import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCashAccount, createCashbookEntry, fetchCashAccounts, fetchCashbookEntries, fetchCashbookSummary, fetchDailyStaffReport } from '@/features/cashbook/api'

export const cashbookKeys = { all: ['cashbook'] as const, accounts: () => ['cashbook', 'accounts'] as const, entries: () => ['cashbook', 'entries'] as const, summary: (from: string, to: string) => ['cashbook', 'summary', from, to] as const, daily: (date: string) => ['cashbook', 'daily', date] as const }
export const useCashAccounts = () => useQuery({ queryKey: cashbookKeys.accounts(), queryFn: fetchCashAccounts })
export const useCashbookEntries = () => useQuery({ queryKey: cashbookKeys.entries(), queryFn: fetchCashbookEntries })
export const useCashbookSummary = (from: string, to: string) => useQuery({ queryKey: cashbookKeys.summary(from, to), queryFn: () => fetchCashbookSummary(from, to) })
export const useDailyStaffReport = (date: string) => useQuery({ queryKey: cashbookKeys.daily(date), queryFn: () => fetchDailyStaffReport(date) })

function useCashbookMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => void queryClient.invalidateQueries({ queryKey: cashbookKeys.all }) })
}
export const useCreateCashAccount = () => useCashbookMutation(createCashAccount)
export const useCreateCashbookEntry = () => useCashbookMutation(createCashbookEntry)
