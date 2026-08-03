import { apiRequest } from '@/lib/api-client'
import type { CashAccount, CashAccountType, CashbookEntry, CashbookSummary, CashDirection, DailyStaffReport } from '@/features/cashbook/types'

export const fetchCashAccounts = () => apiRequest<{ accounts: CashAccount[] }>('/cashbook/accounts').then((data) => data.accounts)
export const fetchCashbookEntries = () => apiRequest<{ entries: CashbookEntry[] }>('/cashbook/entries?limit=100').then((data) => data.entries)
export const fetchCashbookSummary = (from: string, to: string) => apiRequest<{ summary: CashbookSummary }>(`/cashbook/summary?from=${from}&to=${to}`).then((data) => data.summary)
export const fetchDailyStaffReport = (date: string) => apiRequest<{ report: DailyStaffReport }>(`/cashbook/daily-report?date=${date}`).then((data) => data.report)
export const createCashAccount = (input: { name: string; type: CashAccountType; openingBalance?: number }) => apiRequest('/cashbook/accounts', { method: 'POST', body: input })
export const createCashbookEntry = (input: { accountId: string; direction: CashDirection; kind: 'MANUAL_INCOME' | 'EXPENSE' | 'ADJUSTMENT'; amountMMK: number; category: string; note?: string }) => apiRequest('/cashbook/entries', { method: 'POST', body: input })
