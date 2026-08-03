import { apiRequest } from '@/lib/api-client'
export type AiConfig = { provider: string; model: string | null; isEnabled: boolean; hasApiKey: boolean }
export function fetchAiConfig() { return apiRequest<{ config: AiConfig }>('/ai/config').then((data) => data.config) }
export function saveAiConfig(input: { provider: string; apiKey?: string; model?: string; isEnabled: boolean }) { return apiRequest<{ config: AiConfig }>('/ai/config', { method: 'PUT', body: JSON.stringify(input) }).then((data) => data.config) }
export type OrderDraft = { customerId: string | null; newCustomer: { name?: string; phone?: string } | null; lineItems: Array<{ productId: string; quantity: number }>; notes: string; confidence: number }
export function createAiSession() { return apiRequest<{ session: { id: string } }>('/ai/sessions', { method: 'POST' }).then((data) => data.session) }
export function sendAiMessage(id: string, content: string) { return apiRequest<{ draft: OrderDraft | { text: string } }>(`/ai/sessions/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }).then((data) => data.draft) }
