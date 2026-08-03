import { apiRequest } from '@/lib/api-client'

export type AssistantResponseLocale = 'en' | 'my'

export type OrderDraftLineItem = {
  productId: string
  quantity: number
  productName?: string
  productSku?: string
  unitPriceMMK?: number
  availableStock?: number
}

export type OrderDraft = {
  customerId: string | null
  newCustomer: {
    name?: string
    phone?: string
    townshipOrCity?: string
    detailedAddress?: string
  } | null
  customerName?: string | null
  customerPhone?: string | null
  lineItems: OrderDraftLineItem[]
  notes: string
  confidence: number
}

export type AiConfig = {
  provider: string
  model: string | null
  isEnabled: boolean
  hasApiKey: boolean
  canToggle: boolean
}

export type ConfirmDraftInput = {
  customerId?: string | null
  newCustomer?: {
    name: string
    phone: string
    townshipOrCity?: string | null
    detailedAddress?: string | null
    addressLabel?: string | null
  } | null
  lineItems: Array<{ productId: string; quantity: number }>
  notes?: string
  type?: 'STANDARD' | 'PREORDER'
  expectedFulfillAt?: string | null
  delivery: {
    customerName: string
    customerPhone: string
    townshipOrCity: string
    detailedAddress: string
    addressLabel?: string | null
  }
  channel?: string
  paymentMethod?: string | null
}

export function fetchAiConfig() {
  return apiRequest<{ config: AiConfig }>('/ai/config').then((data) => data.config)
}

export function updateAiConfig(isEnabled: boolean) {
  return apiRequest<{ config: AiConfig }>('/ai/config', {
    method: 'PUT',
    body: { isEnabled },
  }).then((data) => data.config)
}

export function createAiSession() {
  return apiRequest<{ session: { id: string } }>('/ai/sessions', { method: 'POST' }).then(
    (data) => data.session,
  )
}

export function sendAiMessage(
  id: string,
  content: string,
  locale: AssistantResponseLocale,
) {
  return apiRequest<{ draft: OrderDraft | { text: string } }>(
    `/ai/sessions/${id}/messages`,
    { method: 'POST', body: { content, locale } },
  ).then((data) => data.draft)
}

export function confirmAiDraft(sessionId: string, input: ConfirmDraftInput) {
  return apiRequest<{ order: { id: string; orderNumber: string } }>(
    `/ai/sessions/${sessionId}/confirm`,
    { method: 'POST', body: input },
  ).then((data) => data.order)
}
