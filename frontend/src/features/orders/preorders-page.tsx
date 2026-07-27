import { CalendarClock, PackageOpen } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrders } from '@/features/orders/use-orders'
import { formatMMK } from '@/lib/format-mmk'
import { preorderStatuses } from '@/features/orders/types'

export function PreordersPage() {
  const { t } = useTranslation('features')
  const [status, setStatus] = useState<'ALL' | (typeof preorderStatuses)[number]>('ALL')
  const [search, setSearch] = useState('')
  const filters = { search: search.trim() || undefined, status: status === 'ALL' ? undefined : status, type: 'PREORDER' as const }
  const query = useOrders(filters)
  const orders = query.data ?? []
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-semibold tracking-tight">{t('preorders.title')}</h1><p className="mt-2 text-muted-foreground">{t('preorders.description')}</p></div>
        <Button asChild><Link to="/orders/new?type=preorder">{t('preorders.new')}</Link></Button>
      </div>
      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
        <Input aria-label={t('preorders.search')} placeholder={t('preorders.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}><SelectTrigger aria-label={t('preorders.statusFilter')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t('preorders.allStatuses')}</SelectItem>{preorderStatuses.map((s) => <SelectItem key={s} value={s}>{t(`orders.status.${s}`, s)}</SelectItem>)}</SelectContent></Select>
      </div>
      {query.isLoading ? <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : null}
      {query.isError ? <div role="alert" className="rounded-lg border border-destructive/30 p-6 text-center text-destructive">{t('preorders.loadError')}<br /><Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>{t('orders.retry')}</Button></div> : null}
      {!query.isLoading && !query.isError && orders.length === 0 ? <div className="flex flex-col items-center rounded-lg border border-dashed p-12 text-center"><PackageOpen className="h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">{t('preorders.emptyTitle')}</h2><p className="mt-2 text-sm text-muted-foreground">{t('preorders.emptyDescription')}</p></div> : null}
      <div className="grid gap-3">{orders.map((order) => <Link key={order.id} to={`/orders/${order.id}`} className="rounded-lg border p-4 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{order.orderNumber} · {order.customerName}</p><p className="mt-1 text-sm text-muted-foreground">{order.expectedFulfillAt ? <><CalendarClock className="mr-1 inline h-4 w-4" />{new Date(order.expectedFulfillAt).toLocaleDateString()}</> : t('preorders.dateUnset')}</p></div><Badge variant="secondary">{t(`orders.status.${order.status}`, order.status)}</Badge></div><div className="mt-3 flex justify-between text-sm"><span>{t('orders.balanceDue', { balance: formatMMK(order.balanceDueMMK) })}</span><span className="font-medium">{formatMMK(order.totalMMK)}</span></div></Link>)}</div>
    </div>
  )
}
