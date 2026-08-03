import type { PrismaClient } from '../../../../generated/client/index.js';
import { decryptSecret, encryptSecret } from '../../../utilities/encryption.js';
import { AppError } from '../../../errors/app-error.js';
import { ErrorCodes } from '../../../errors/error-codes.js';
import type { Env } from '../../../config/env.js';

export class AiService {
  constructor(
    private prisma: PrismaClient,
    private encryptionKey: string,
    private env?: Env,
    private orders?: import('../orders/order.service.js').OrderService,
  ) {}

  async config(shopId: string) {
    const config = await this.prisma.aiConfig.findUnique({ where: { shopId } });
    const envAvailable = Boolean(this.env?.DEEPSEEK_API_KEY);
    if (config) {
      return {
        provider: config.provider,
        model: config.model,
        isEnabled: config.isEnabled,
        hasApiKey: Boolean(config.apiKeyCipher),
        canToggle: true,
      };
    }
    return {
      provider: this.env?.AI_DEFAULT_PROVIDER ?? 'DEEPSEEK',
      model: this.env?.DEEPSEEK_MODEL ?? null,
      isEnabled: envAvailable,
      hasApiKey: envAvailable,
      canToggle: false,
    };
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

  async updateStaffConfig(shopId: string, isEnabled: boolean) {
    const existing = await this.prisma.aiConfig.findUnique({ where: { shopId } });
    if (!existing) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'aiConfig', code: 'AI_NOT_CONFIGURED' },
      ]);
    }
    await this.prisma.aiConfig.update({ where: { shopId }, data: { isEnabled } });
    return this.config(shopId);
  }

  async createSession(shopId: string, userId: string) {
    return this.prisma.chatSession.create({ data: { shopId, userId } });
  }

  async message(
    shopId: string,
    userId: string,
    sessionId: string,
    content: string,
    locale: 'en' | 'my' = 'en',
  ) {
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
    const languageInstruction =
      locale === 'my'
        ? 'Always reply in Burmese (Myanmar Unicode). Do not transliterate Burmese.'
        : 'Always reply in English.';
    const prompt = `You are a helpful shop operations assistant for a cosmetic online shop. ${languageInstruction} Have a natural conversation, ask concise follow-up questions when customer/order details are missing, answer questions about this shop using only the context below, and proactively remind the staff about overdue deliveries, unpaid balances, and preorder stock shortages.

When answering about orders, format for readability:
- Use short paragraphs and bullet lists.
- Put each order number on its own line or bullet, unchanged (example: TESTSHOP-2026-0007).
- Use **bold** for order numbers, statuses, and key amounts.
- Include MMK amounts as whole integers.

If the user is clearly describing a new order, return ONLY JSON with keys customerId (string|null), newCustomer (object|null), lineItems ({productId,quantity}[]), notes (string), confidence (number 0..1). Otherwise return a helpful plain-text answer. Match only IDs in this tenant context.

Products: ${JSON.stringify(products)}
Customers: ${JSON.stringify(customers)}
Open orders: ${JSON.stringify(openOrders)}
User message: ${content}`;
    const endpoint = provider === 'DEEPSEEK' ? (this.env?.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com') + '/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    if (!['OPENAI', 'DEEPSEEK'].includes(provider)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_PROVIDER_NOT_SUPPORTED' }]);
    const response = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: config?.model || (provider === 'DEEPSEEK' ? 'deepseek-chat' : 'gpt-4.1-mini'), messages: [{ role: 'system', content: 'You draft shop orders when asked, but otherwise answer naturally. Never invent product or customer IDs.' }, { role: 'user', content: prompt }] }) });
    if (!response.ok) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_PROVIDER_ERROR' }]);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = payload.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_INVALID_RESPONSE' }]);
    let draft: unknown;
    try {
      const normalized = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      draft = JSON.parse(normalized);
    } catch {
      await this.prisma.chatMessage.create({ data: { sessionId, role: 'assistant', content: raw } });
      return { text: raw };
    }
    if (!draft || typeof draft !== 'object' || !Array.isArray((draft as { lineItems?: unknown }).lineItems)) {
      const text = typeof draft === 'string' ? draft : raw;
      await this.prisma.chatMessage.create({ data: { sessionId, role: 'assistant', content: text } });
      return { text };
    }
    const candidate = draft as { customerId?: unknown; newCustomer?: unknown; lineItems: Array<{ productId?: unknown; quantity?: unknown }>; notes?: unknown; confidence?: unknown };
    const productIds = new Set(products.map((product) => product.id));
    const customerIds = new Set(customers.map((customer) => customer.id));
    if (candidate.customerId != null && (typeof candidate.customerId !== 'string' || !customerIds.has(candidate.customerId))) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_INVALID_RESPONSE' }]);
    if (candidate.lineItems.length === 0 || candidate.lineItems.some((item) => typeof item.productId !== 'string' || !productIds.has(item.productId) || !Number.isInteger(item.quantity) || Number(item.quantity) < 1)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'provider', code: 'AI_INVALID_RESPONSE' }]);
    draft = { customerId: candidate.customerId ?? null, newCustomer: candidate.newCustomer ?? null, lineItems: candidate.lineItems, notes: typeof candidate.notes === 'string' ? candidate.notes : '', confidence: typeof candidate.confidence === 'number' ? Math.max(0, Math.min(1, candidate.confidence)) : 0 };
    const enriched = this.enrichDraft(
      draft as {
        customerId: string | null;
        newCustomer: { name?: string; phone?: string; townshipOrCity?: string; detailedAddress?: string } | null;
        lineItems: Array<{ productId: string; quantity: number }>;
        notes: string;
        confidence: number;
      },
      products,
      customers,
    );
    await this.prisma.chatMessage.create({ data: { sessionId, role: 'assistant', content: raw, draftJson: JSON.stringify(enriched) } });
    return enriched;
  }

  private enrichDraft<
    T extends {
      customerId: string | null;
      newCustomer: { name?: string; phone?: string; townshipOrCity?: string; detailedAddress?: string } | null;
      lineItems: Array<{ productId: string; quantity: number }>;
      notes: string;
      confidence: number;
    },
  >(
    draft: T,
    products: Array<{ id: string; name: string; sku: string; priceMMK: number; stockQty: number; reservedQty: number }>,
    customers: Array<{ id: string; name: string; phone: string; townshipOrCity: string | null; detailedAddress: string | null }>,
  ) {
    const productById = new Map(products.map((product) => [product.id, product]));
    const customer = draft.customerId
      ? customers.find((entry) => entry.id === draft.customerId) ?? null
      : null;

    return {
      ...draft,
      customerName: customer?.name ?? draft.newCustomer?.name ?? null,
      customerPhone: customer?.phone ?? draft.newCustomer?.phone ?? null,
      lineItems: draft.lineItems.map((item) => {
        const product = productById.get(item.productId);
        return {
          ...item,
          productName: product?.name ?? item.productId,
          productSku: product?.sku ?? '',
          unitPriceMMK: product?.priceMMK ?? 0,
          availableStock: product
            ? Math.max(0, product.stockQty - product.reservedQty)
            : 0,
        };
      }),
    };
  }

  async confirm(
    shopId: string,
    userId: string,
    sessionId: string,
    input: {
      customerId?: string | null;
      newCustomer?: {
        name: string;
        phone: string;
        townshipOrCity?: string | null;
        detailedAddress?: string | null;
        addressLabel?: string | null;
      } | null;
      lineItems: Array<{ productId: string; quantity: number }>;
      notes?: string;
      type?: 'STANDARD' | 'PREORDER';
      expectedFulfillAt?: string | null;
      delivery: {
        customerName: string;
        customerPhone: string;
        townshipOrCity: string;
        detailedAddress: string;
        addressLabel?: string | null;
      };
      channel?: string;
      paymentMethod?: string | null;
    },
  ) {
    if (!this.orders) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'orders', code: 'SERVICE_UNAVAILABLE' },
      ]);
    }

    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, shopId, userId },
    });
    if (!session) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404);
    }

    const hasCustomerId = typeof input.customerId === 'string' && input.customerId.trim() !== '';
    const hasNewCustomer = Boolean(input.newCustomer?.name?.trim() && input.newCustomer.phone?.trim());
    if (hasCustomerId === hasNewCustomer) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'customerId', code: 'CUSTOMER_REQUIRED' },
      ]);
    }

    const order = await this.orders.create(shopId, userId, {
      customerId: input.customerId ?? '',
      customer: hasNewCustomer
        ? {
            name: input.newCustomer!.name.trim(),
            phone: input.newCustomer!.phone.trim(),
            townshipOrCity: input.newCustomer!.townshipOrCity ?? input.delivery.townshipOrCity,
            detailedAddress: input.newCustomer!.detailedAddress ?? input.delivery.detailedAddress,
            addressLabel: input.newCustomer!.addressLabel ?? input.delivery.addressLabel ?? null,
          }
        : undefined,
      channel: input.channel,
      paymentMethod: input.paymentMethod ?? null,
      notes: input.notes,
      delivery: {
        customerName: input.delivery.customerName.trim(),
        customerPhone: input.delivery.customerPhone.trim(),
        townshipOrCity: input.delivery.townshipOrCity.trim(),
        detailedAddress: input.delivery.detailedAddress.trim(),
        addressLabel: input.delivery.addressLabel?.trim() || null,
      },
      lineItems: input.lineItems,
      type: input.type,
      expectedFulfillAt: input.expectedFulfillAt ?? null,
      chatSessionId: sessionId,
    });

    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: `Confirmed order ${order.orderNumber}`,
      },
    });

    return order;
  }
}
