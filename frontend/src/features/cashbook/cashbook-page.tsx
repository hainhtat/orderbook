import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, ReceiptText, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { CashAccountType, CashDirection } from '@/features/cashbook/types'
import { useCashAccounts, useCashbookEntries, useCashbookSummary, useCreateCashAccount, useCreateCashbookEntry } from '@/features/cashbook/use-cashbook'
import type { DailyStaffReport } from '@/features/cashbook/types'
import { formatYangonDate, shiftYangonIsoDate, todayYangonIsoDate } from '@/lib/date'
import { formatMMK } from '@/lib/format-mmk'

const accountTypes: CashAccountType[] = ['CASH', 'BANK', 'KBZPAY', 'WAVE', 'COD_CLEARING', 'OTHER']
const expenseCategories = ['TAXI', 'DELIVERY', 'PACKAGING', 'MEALS', 'OTHER_EXPENSE'] as const
function accountTone(type: CashAccountType) { return type === 'CASH' ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30' : type === 'KBZPAY' ? 'border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30' : type === 'WAVE' ? 'border-violet-200 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/30' : type === 'COD_CLEARING' ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30' : 'border-border bg-card' }
function localDate(offsetDays = 0) { return shiftYangonIsoDate(todayYangonIsoDate(), offsetDays) }

export function CashbookPage() {
  const { t } = useTranslation('features')
  const [from, setFrom] = useState(localDate(-29))
  const [to, setTo] = useState(localDate())
  const [accountOpen, setAccountOpen] = useState(false)
  const [entryOpen, setEntryOpen] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<CashAccountType>('CASH')
  const [openingBalance, setOpeningBalance] = useState('0')
  const [entryAccount, setEntryAccount] = useState('')
  const [direction, setDirection] = useState<CashDirection>('OUT')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const accounts = useCashAccounts()
  const entries = useCashbookEntries()
  const summary = useCashbookSummary(from, to)
  const daily = { data: null as unknown as DailyStaffReport }
  const createAccount = useCreateCashAccount()
  const createEntry = useCreateCashbookEntry()

  async function saveAccount() {
    try {
      await createAccount.mutateAsync({ name: accountName, type: accountType, openingBalance: Number(openingBalance) || 0 })
      toast.success(t('cashbook.accountSaved')); setAccountOpen(false); setAccountName(''); setOpeningBalance('0')
    } catch { toast.error(t('cashbook.saveError')) }
  }
  async function saveEntry() {
    try {
      await createEntry.mutateAsync({ accountId: entryAccount, direction, kind: direction === 'IN' ? 'MANUAL_INCOME' : 'EXPENSE', amountMMK: Number(amount), category, note })
      toast.success(t('cashbook.entrySaved')); setEntryOpen(false); setAmount(''); setCategory(''); setNote('')
    } catch { toast.error(t('cashbook.saveError')) }
  }

  const loading = accounts.isLoading || entries.isLoading || summary.isLoading
  const error = accounts.isError || entries.isError || summary.isError
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold tracking-tight">{t('cashbook.title')}</h1><p className="mt-2 leading-7 text-muted-foreground">{t('cashbook.description')}</p></div><div className="flex gap-2"><Button variant="outline" size="icon" onClick={() => setAccountOpen(true)} aria-label={t('cashbook.addAccount')}><Landmark className="h-4 w-4" /></Button><Button size="icon" onClick={() => { setEntryAccount(accounts.data?.[0]?.id ?? ''); setEntryOpen(true) }} aria-label={t('cashbook.addEntry')} disabled={!accounts.data?.length}><Plus className="h-4 w-4" /></Button></div></div>
      <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="cashbook-from">{t('reports.filters.from')}</Label><Input id="cashbook-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div><div><Label htmlFor="cashbook-to">{t('reports.filters.to')}</Label><Input id="cashbook-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div></div>
      {error ? <div role="alert" className="rounded-2xl border border-destructive/30 p-6 text-center text-destructive">{t('cashbook.loadError')}</div> : null}
      {!error ? <div className="grid grid-cols-3 gap-2">{[['moneyInMMK', ArrowDownLeft], ['moneyOutMMK', ArrowUpRight], ['netMMK', WalletCards]].map(([key, Icon]) => <Card key={key as string}><CardContent className="p-3 sm:p-5"><Icon className="mb-2 h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">{t(`cashbook.summary.${key}`)}</p><p className="mt-1 truncate text-sm font-semibold sm:text-xl">{formatMMK(summary.data?.[key as keyof typeof summary.data] ?? 0)}</p></CardContent></Card>)}</div> : null}
      {daily.data ? <section className="space-y-3"><div><h2 className="text-lg font-semibold">{t('cashbook.daily.title', { date: formatYangonDate(to) })}</h2><p className="mt-1 leading-7 text-muted-foreground">{t('cashbook.daily.description')}</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{(['orderCount', 'salesMMK', 'moneyReceivedMMK', 'expensesMMK', 'netCashMMK'] as const).map((key) => <Card key={key}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{t(`cashbook.daily.${key}`)}</p><p className="mt-1 truncate font-semibold">{key === 'orderCount' ? daily.data.totals[key] : formatMMK(daily.data.totals[key])}</p></CardContent></Card>)}</div><div className="grid gap-3 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">{t('cashbook.daily.sentOrders')}</CardTitle></CardHeader><CardContent className="space-y-3">{daily.data.orders.length === 0 ? <p className="text-sm text-muted-foreground">{t('cashbook.daily.noOrders')}</p> : daily.data.orders.map((order) => <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-xl border p-3 transition hover:border-primary"><div className="flex justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{order.customerName} · {order.townshipOrCity}</p><p className="truncate text-sm text-muted-foreground">{order.orderNumber} · {order.customerPhone}</p></div><span className="shrink-0 font-semibold">{formatMMK(order.totalMMK)}</span></div><p className="mt-2 text-sm leading-6">{order.lineItems.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}</p></Link>)}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">{t('cashbook.daily.productsSent')}</CardTitle></CardHeader><CardContent className="space-y-2">{daily.data.products.length === 0 ? <p className="text-sm text-muted-foreground">{t('cashbook.daily.noProducts')}</p> : daily.data.products.map((product) => <div key={`${product.productSku}:${product.productName}`} className="flex justify-between gap-3 border-b py-2 last:border-0"><div><p className="font-medium">{product.productName}</p><p className="text-xs text-muted-foreground">{product.productSku}</p></div><div className="text-right"><p className="font-semibold">× {product.quantity}</p><p className="text-xs text-muted-foreground">{formatMMK(product.revenueMMK)}</p></div></div>)}</CardContent></Card></div></section> : null}
      <section><h2 className="mb-3 text-lg font-semibold">{t('cashbook.accounts')}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{accounts.data?.map((account) => <Card key={account.id} className={accountTone(account.type)}><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-base"><span className="truncate">{account.name}</span><Badge variant="outline">{t(`cashbook.accountTypes.${account.type}`)}</Badge></CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatMMK(account.balanceMMK)}</p></CardContent></Card>)}</div></section>
      <section><h2 className="mb-3 text-lg font-semibold">{t('cashbook.transactions')}</h2>{!loading && entries.data?.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center"><ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">{t('cashbook.empty')}</p></div> : <div className="space-y-2">{entries.data?.map((entry) => <div key={entry.id} className="flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-4"><span className={`rounded-full p-2 ${entry.direction === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{entry.direction === 'IN' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate font-medium">{entry.category}</p><p className="truncate text-sm text-muted-foreground">{entry.account.name}{entry.order ? ` · ${entry.order.orderNumber}` : ''}</p></div><div className="text-right"><p className="font-semibold">{entry.direction === 'IN' ? '+' : '-'}{formatMMK(entry.amountMMK)}</p><p className="text-xs text-muted-foreground">{formatYangonDate(entry.occurredAt)}</p></div></div>)}</div>}</section>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}><DialogContent><DialogHeader><DialogTitle>{t('cashbook.addAccount')}</DialogTitle><DialogDescription>{t('cashbook.accountHelp')}</DialogDescription></DialogHeader><div className="space-y-4"><div><Label htmlFor="account-name">{t('cashbook.name')}</Label><Input id="account-name" value={accountName} onChange={(event) => setAccountName(event.target.value)} /></div><div><Label>{t('cashbook.type')}</Label><Select value={accountType} onValueChange={(value) => setAccountType(value as CashAccountType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accountTypes.map((type) => <SelectItem key={type} value={type}>{t(`cashbook.accountTypes.${type}`)}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="opening-balance">{t('cashbook.openingBalance')}</Label><Input id="opening-balance" inputMode="numeric" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} /></div></div><DialogFooter><Button disabled={!accountName.trim() || createAccount.isPending} onClick={() => void saveAccount()}>{t('cashbook.save')}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}><DialogContent><DialogHeader><DialogTitle>{t('cashbook.addEntry')}</DialogTitle><DialogDescription>{t('cashbook.entryHelp')}</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>{t('cashbook.account')}</Label><Select value={entryAccount} onValueChange={setEntryAccount}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accounts.data?.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent></Select></div><div><Label>{t('cashbook.direction')}</Label><Select value={direction} onValueChange={(value) => setDirection(value as CashDirection)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="IN">{t('cashbook.moneyIn')}</SelectItem><SelectItem value="OUT">{t('cashbook.moneyOut')}</SelectItem></SelectContent></Select></div><div><Label htmlFor="entry-amount">{t('cashbook.amount')}</Label><Input id="entry-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div><Label htmlFor="entry-category">{t('cashbook.category')}</Label>{direction === 'OUT' ? <div className="my-2 flex flex-wrap gap-2">{expenseCategories.map((item) => <Button key={item} type="button" size="sm" variant={category === item ? 'default' : 'outline'} onClick={() => setCategory(item)}>{t(`cashbook.expenseCategories.${item}`)}</Button>)}</div> : null}<Input id="entry-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder={t('cashbook.categoryPlaceholder')} /></div><div><Label htmlFor="entry-note">{t('cashbook.note')}</Label><Textarea id="entry-note" value={note} onChange={(event) => setNote(event.target.value)} /></div></div><DialogFooter><Button disabled={!entryAccount || Number(amount) <= 0 || !category.trim() || createEntry.isPending} onClick={() => void saveEntry()}>{t('cashbook.save')}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
