import { apiRequest } from '@/lib/api-client'
export type OrderDraft = { customerId: string | null; newCustomer: { name?: string; phone?: string } | null; lineItems: Array<{ productId: string; quantity: number }>; notes: string; confidence: number }
export function createAiSession() { return apiRequest<{ session: { id: string } }>('/ai/sessions', { method: 'POST' }).then((data) => data.session) }
export function sendAiMessage(id: string, content: string) { return apiRequest<{ draft: OrderDraft | { text: string } }>(`/ai/sessions/${id}/messages`, { method: 'POST', body: { content } }).then((data) => data.draft) }
