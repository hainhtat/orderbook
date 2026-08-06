import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  PackageOpen,
  PackageSearch,
  Truck,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Order } from '@/features/orders/types'
import { useBulkUpdatePreorderExpectedDate, useOrders } from '@/features/orders/use-orders'
import { differenceInYangonCalendarDays, formatYangonDate, todayYangonIsoDate } from '@/lib/date'
import { formatMMK } from '@/lib/format-mmk'
import { useProducts } from '@/features/products/use-products'
import type { Product } from '@/features/products/types'

type WorkQueue = 'ALL' | 'NEEDS_PAYMENT' | 'WAITING_STOCK' | 'READY_TO_DELIVER' | 'BALANCE_TO_COLLECT'

const queueIcons = {
  ALL: PackageSearch,
  NEEDS_PAYMENT: CircleDollarSign,
  WAITING_STOCK: PackageOpen,
  READY_TO_DELIVER: Truck,
  BALANCE_TO_COLLECT: WalletCards,
} satisfies Record<WorkQueue, typeof PackageSearch>

export function queuesFor(order: Order, products: Product[]): Array<Exclude<WorkQueue, 'ALL'>> {
  const queues: Array<Exclude<WorkQueue, 'ALL'>> = []
  if (order.status === 'CONFIRMED' || order.status === 'DEPOSIT_PAID') queues.push('NEEDS_PAYMENT')
  const availableById = new Map(products.map((product) => [product.id, Math.max(0, product.stockQty - product.reservedQty)]))
  const hasShortage = order.lineItems.some((item) => item.productId && item.quantity > (availableById.get(item.productId) ?? 0))
  if (order.status === 'AWAITING_STOCK' || (['CONFIRMED', 'DEPOSIT_PAID'].includes(order.status) && hasShortage)) queues.push('WAITING_STOCK')
  if (order.status === 'RESERVED' || order.status === 'READY_TO_FULFILL') queues.push('READY_TO_DELIVER')
  if (order.status === 'FULFILLED' && order.balanceDueMMK > 0) queues.push('BALANCE_TO_COLLECT')
  return queues
}

function dateUrgency(expectedFulfillAt: string | null) {
  if (!expectedFulfillAt) return null
  const days = differenceInYangonCalendarDays(expectedFulfillAt, todayYangonIsoDate())
  if (days < 0) return { key: 'overdue', days: Math.abs(days), destructive: true }
  if (days <= 7) return { key: 'dueSoon', days, destructive: false }
  return null
}

export function PreordersPage() {
  const { t } = useTranslation('features')
  const [queue, setQueue] = useState<WorkQueue>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [bulkDate, setBulkDate] = useState('')
  const query = useOrders({ type: 'PREORDER', limit: 100 })
  const productsQuery = useProducts(false, 1, 100)
  const products = productsQuery.data ?? []
  const bulkUpdate = useBulkUpdatePreorderExpectedDate()
  const activeOrders = useMemo(
    () => (query.data ?? []).filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status)),
    [query.data],
  )
  const counts = useMemo(() => {
    const next = { ALL: activeOrders.length, NEEDS_PAYMENT: 0, WAITING_STOCK: 0, READY_TO_DELIVER: 0, BALANCE_TO_COLLECT: 0 }
    activeOrders.forEach((order) => {
      queuesFor(order, products).forEach((workQueue) => { next[workQueue] += 1 })
    })
    return next
  }, [activeOrders, products])
  const orders = activeOrders.filter((order) => {
    const matchesQueue = queue === 'ALL' || queuesFor(order, products).includes(queue)
    const term = search.trim().toLocaleLowerCase()
    return matchesQueue && (!term || `${order.orderNumber} ${order.customerName} ${order.customerPhone}`.toLocaleLowerCase().includes(term))
  })
  const queues = Object.keys(counts) as WorkQueue[]

  async function applyBulkDate() {
    if (!bulkDate || selected.length === 0) return
    try {
      await bulkUpdate.mutateAsync({ orderIds: selected, expectedFulfillAt: bulkDate })
      toast.success(t('preorders.bulk.success', { count: selected.length }))
      setSelected([])
      setBulkDate('')
    } catch {
      toast.error(t('preorders.bulk.error'))
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{t('preorders.title')}</h1>
          <p className="mt-2 leading-7 text-muted-foreground">{t('preorders.description')}</p>
        </div>
        <Button asChild size="icon" className="shrink-0 rounded-full sm:w-auto sm:px-4">
          <Link to="/orders/new?type=preorder"><span className="text-xl sm:hidden">+</span><span className="hidden sm:inline">{t('preorders.new')}</span></Link>
        </Button>
      </div>

      <Input aria-label={t('preorders.search')} placeholder={t('preorders.search')} value={search} onChange={(event) => setSearch(event.target.value)} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={t('preorders.workQueues')}>
        {queues.map((item) => {
          const Icon = queueIcons[item]
          return (
            <Button key={item} type="button" variant={queue === item ? 'default' : 'outline'} className="h-auto min-w-0 justify-start gap-2 px-3 py-3" onClick={() => setQueue(item)}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 text-left"><span className="block truncate text-xs">{t(`preorders.queues.${item}`)}</span><span className="block text-base font-semibold">{counts[item]}</span></span>
            </Button>
          )
        })}
      </div>

      {selected.length > 0 ? (
        <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <label htmlFor="bulk-expected-date" className="text-sm font-medium">{t('preorders.bulk.label', { count: selected.length })}</label>
            <Input id="bulk-expected-date" type="date" value={bulkDate} onChange={(event) => setBulkDate(event.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelected([])}>{t('preorders.bulk.clear')}</Button>
            <Button disabled={!bulkDate || bulkUpdate.isPending} onClick={() => void applyBulkDate()}>{t('preorders.bulk.apply')}</Button>
          </div>
        </div>
      ) : null}

      {query.isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-36 w-full rounded-2xl" />)}</div> : null}
      {query.isError ? <div role="alert" className="rounded-2xl border border-destructive/30 p-6 text-center text-destructive">{t('preorders.loadError')}<br /><Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>{t('orders.retry')}</Button></div> : null}
      {!query.isLoading && !query.isError && orders.length === 0 ? <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center"><PackageOpen className="h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">{t('preorders.emptyTitle')}</h2><p className="mt-2 leading-7 text-muted-foreground">{t('preorders.emptyDescription')}</p></div> : null}

      <div className="grid gap-3">
        {orders.map((order) => {
          const orderQueues = queuesFor(order, products)
          const workQueue = queue !== 'ALL' && orderQueues.includes(queue) ? queue : orderQueues[0] ?? null
          const urgency = dateUrgency(order.expectedFulfillAt)
          return (
            <article key={order.id} className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary/50">
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 accent-primary"
                  aria-label={t('preorders.bulk.select', { order: order.orderNumber })}
                  checked={selected.includes(order.id)}
                  onChange={(event) => setSelected((current) => event.target.checked ? [...current, order.id] : current.filter((id) => id !== order.id))}
                />
                <Link to={`/orders/${order.id}`} className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-semibold">{order.customerName}</p><p className="truncate text-sm text-muted-foreground">{order.orderNumber} · {order.customerPhone}</p></div>
                    <span className="shrink-0 font-semibold">{formatMMK(order.totalMMK)}</span>
                  </div>
                  <p className="mt-3 truncate text-sm">{order.lineItems.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {workQueue ? <Badge>{t(`preorders.queues.${workQueue}`)}</Badge> : null}
                    <Badge variant="outline">{t('orders.balanceDue', { balance: formatMMK(order.balanceDueMMK) })}</Badge>
                    {urgency ? <Badge variant={urgency.destructive ? 'destructive' : 'secondary'}><AlertTriangle className="mr-1 h-3 w-3" />{t(`preorders.${urgency.key}`, { count: urgency.days })}</Badge> : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground"><CalendarClock className="mr-1 inline h-4 w-4" />{order.expectedFulfillAt ? formatYangonDate(order.expectedFulfillAt) : t('preorders.dateUnset')}</span>
                    <span className="flex shrink-0 items-center font-medium text-primary">{workQueue ? t(`preorders.actions.${workQueue}`) : t('preorders.view')}<ArrowRight className="ml-1 h-4 w-4" /></span>
                  </div>
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
