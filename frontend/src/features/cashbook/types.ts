export type CashAccountType = 'CASH' | 'BANK' | 'KBZPAY' | 'WAVE' | 'COD_CLEARING' | 'OTHER'
export type CashDirection = 'IN' | 'OUT'
export type CashbookEntryKind = 'PAYMENT' | 'MANUAL_INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'OPENING_BALANCE' | 'ADJUSTMENT' | 'REVERSAL'

export type CashAccount = {
  id: string
  name: string
  type: CashAccountType
  openingBalance: number
  balanceMMK: number
}

export type CashbookEntry = {
  id: string
  accountId: string
  orderId: string | null
  paymentId: string | null
  reversesEntryId: string | null
  kind: CashbookEntryKind
  direction: CashDirection
  amountMMK: number
  category: string
  note: string | null
  occurredAt: string
  account: { name: string; type: CashAccountType }
  order: { orderNumber: string } | null
}

export type CashbookSummary = { moneyInMMK: number; moneyOutMMK: number; netMMK: number }

export type DailyStaffReport = {
  date: string
  totals: { orderCount: number; salesMMK: number; moneyReceivedMMK: number; expensesMMK: number; netCashMMK: number }
  products: Array<{ productName: string; productSku: string; quantity: number; revenueMMK: number }>
  orders: Array<{
    id: string
    orderNumber: string
    customerName: string
    customerPhone: string
    townshipOrCity: string
    totalMMK: number
    lineItems: Array<{ productName: string; productSku: string; quantity: number; lineTotalMMK: number }>
  }>
  expenses: CashbookEntry[]
}
