import type { PrismaClient } from '../../../../generated/sqlite/index.js';
import { decryptSecret, encryptSecret } from '../../../utilities/encryption.js';
import { AppError } from '../../../errors/app-error.js';
import { ErrorCodes } from '../../../errors/error-codes.js';
import type { Env } from '../../../config/env.js';

export class AiService {
  constructor(private prisma: PrismaClient, private encryptionKey: string, private env?: Env) {}

  async config(shopId: string) {
    const config = await this.prisma.aiConfig.findUnique({ where: { shopId } });
    return config ? { provider: config.provider, model: config.model, isEnabled: config.isEnabled, hasApiKey: Boolean(config.apiKeyCipher) } : { provider: this.env?.AI_DEFAULT_PROVIDER ?? 'OPENAI', model: this.env?.DEEPSEEK_MODEL ?? null, isEnabled: Boolean(this.env?.DEEPSEEK_API_KEY), hasApiKey: Boolean(this.env?.DEEPSEEK_API_KEY) };
  }

  async saveConfig(shopId: string, input: { provider: string; apiKey?: string; model?: string; isEnabled: boolean }) {
    const existing = await this.prisma.aiConfig.findUnique({ where: { shopId } });
    const apiKeyCipher = input.apiKey ? encryptSecret(input.apiKey, this.encryptionKey) : existing?.apiKeyCipher;
    if (!apiKeyCipher) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'apiKey', code: 'REQUIRED' }]);
    await this.prisma.aiConfig.upsert({
      where: { shopId },
      create: { shopId, provider: input.provider, model: input.model || null, isEnabled: input.isEnabled, apiKeyCipher },
      update: { provider: input.provider, model: input.model || null, isEnabled: input.isEnabled, ...(input.apiKey ? { apiKeyCipher } : {}) },
    });
    return this.config(shopId);
  }

  async createSession(shopId: string, userId: string) {
    return this.prisma.chatSession.create({ data: { shopId, userId } });
  }

  async message(shopId: string, userId: string, sessionId: string, content: string) {
    const session = await this.prisma.chatSession.findFirst({ where: { id: sessionId, shopId, userId } });
    if (!session) throw new AppError(ErrorCodes.NOT_FOUND, 404);
    const config = await this.prisma.aiConfig.findUnique({ where: { shopId } });
    const provider = config?.provider ?? this.env?.AI_DEFAULT_PROVIDER ?? 'DEEPSEEK';
    const fallbackKey = provider === 'DEEPSEEK' ? this.env?.DEEPSEEK_API_KEY : undefined;
    if ((!config?.isEnabled && !fallbackKey) || (!config?.apiKeyCipher && !fallbackKey)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'aiConfig', code: 'AI_NOT_CONFIGURED' }]);
    const [products, customers] = await Promise.all([
      this.prisma.product.findMany({ where: { shopId, isArchived: false }, take: 100, select: { id: true, name: true, sku: true, priceMMK: true, stockQty: true, reservedQty: true } }),
      this.prisma.customer.findMany({ where: { shopId }, take: 100, orderBy: { id: 'desc' }, select: { id: true, name: true, phone: true, townshipOrCity: true, detailedAddress: true } }),
    ]);
    await this.prisma.chatMessage.create({ data: { sessionId, role: 'user', content } });
    const apiKey = config?.apiKeyCipher ? decryptSecret(config.apiKeyCipher, this.encryptionKey) : fallbackKey!;
    const openOrders = await this.prisma.order.findMany({ where: { shopId, status: { notIn: ['DELIVERED', 'COMPLETED', 'CANCELLED'] } }, take: 50, select: { orderNumber: true, status: true, customerName: true, totalMMK: true, amountPaidMMK: true, expectedFulfillAt: true, type: true } });
    const prompt = `You are a helpful shop operations assistant. Have a natural conversation, ask concise follow-up questions when customer/order details are missing, answer questions about this shop using only the context below, and proactively remind the staff about overdue deliveries, unpaid balances, and preorder stock shortages. If the user is clearly describing a new order, return ONLY JSON with keys customerId (string|null), newCustomer (object|null), lineItems ({productId,quantity}[]), notes (string), confidence (number 0..1). Otherwise return a helpful plain-text answer. Match only IDs in this tenant context.\nProducts: ${JSON.stringify(products)}\nCustomers: ${JSON.stringify(customers)}\nOpen orders: ${JSON.stringify(openOrders)}\nUser message: ${content}`;
    const endpoint = provider === 'DEEPSEEK' ? (this.env?.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com') + '/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    if (!['OPENAI', 'DEEPSEEK'].includes(provider)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_PROVIDER_NOT_SUPPORTED' }]);
    const response = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: config?.model || (provider === 'DEEPSEEK' ? 'deepseek-chat' : 'gpt-4.1-mini'), messages: [{ role: 'system', content: 'You draft shop orders when asked, but otherwise answer naturally. Never invent product or customer IDs.' }, { role: 'user', content: prompt }] }) });
    if (!response.ok) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_PROVIDER_ERROR' }]);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_INVALID_RESPONSE' }]);
    let draft: unknown;
    try { draft = JSON.parse(raw); } catch { await this.prisma.chatMessage.create({ data: { sessionId, role: 'assistant', content: raw } }); return { text: raw }; }
    if (!draft || typeof draft !== 'object' || !Array.isArray((draft as { lineItems?: unknown }).lineItems)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_INVALID_RESPONSE' }]);
    const candidate = draft as { customerId?: unknown; newCustomer?: unknown; lineItems: Array<{ productId?: unknown; quantity?: unknown }>; notes?: unknown; confidence?: unknown };
    const productIds = new Set(products.map((product) => product.id));
    const customerIds = new Set(customers.map((customer) => customer.id));
    if (candidate.customerId != null && (typeof candidate.customerId !== 'string' || !customerIds.has(candidate.customerId))) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_INVALID_RESPONSE' }]);
    if (candidate.lineItems.length === 0 || candidate.lineItems.some((item) => typeof item.productId !== 'string' || !productIds.has(item.productId) || !Number.isInteger(item.quantity) || Number(item.quantity) < 1)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_INVALID_RESPONSE' }]);
    draft = { customerId: candidate.customerId ?? null, newCustomer: candidate.newCustomer ?? null, lineItems: candidate.lineItems, notes: typeof candidate.notes === 'string' ? candidate.notes : '', confidence: typeof candidate.confidence === 'number' ? Math.max(0, Math.min(1, candidate.confidence)) : 0 };
    await this.prisma.chatMessage.create({ data: { sessionId, role: 'assistant', content: raw, draftJson: JSON.stringify(draft) } });
    return draft;
  }
}
