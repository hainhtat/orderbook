import { CalendarClock, ChevronRight, MapPin, PackageOpen, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrders } from '@/features/orders/use-orders'
import { useCustomers } from '@/features/customers/use-customers'
import type { Order, OrderStatus } from '@/features/orders/types'
import { formatMMK } from '@/lib/format-mmk'

const fulfillmentStatuses = ['ALL', 'TO_DELIVER', 'DELIVERED', 'CANCELLED'] as const
const paymentStatuses = ['ALL', 'UNPAID', 'COD', 'PAID'] as const
type PaymentFilter = (typeof paymentStatuses)[number]
type PaymentDisplayStatus = Exclude<PaymentFilter, 'ALL'> | 'PARTIALLY_PAID'

function getPaymentDisplayStatus(order: Order): PaymentDisplayStatus {
  return order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID'
    ? 'COD'
    : order.paymentStatus
}

function getItemSummary(order: Order) {
  const [first, ...rest] = order.lineItems
  if (!first) return order.orderNumber
  const firstItem = `${first.productName} × ${first.quantity}`
  return rest.length ? `${firstItem} +${rest.length}` : firstItem
}

function getContextAction(order: Order, paymentStatus: PaymentDisplayStatus) {
  if (order.status === 'TO_DELIVER') return 'markDelivered'
  if (order.status === 'DELIVERED' && paymentStatus === 'COD') return 'collectCod'
  if (paymentStatus === 'UNPAID' || paymentStatus === 'PARTIALLY_PAID') return 'markPaid'
  return 'view'
}

function getCardTone(order: Order, paymentStatus: PaymentDisplayStatus) {
  if (order.status === 'CANCELLED') return 'border-l-slate-400'
  if (order.status === 'DELIVERED') return paymentStatus === 'COD' ? 'border-l-amber-400' : 'border-l-emerald-400'
  if (order.status === 'DELIVERING') return 'border-l-blue-400'
  return 'border-l-rose-400'
}

export function OrdersListPage() {
  const { t } = useTranslation('features')
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '')
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('TO_DELIVER')
  const [paymentStatus, setPaymentStatus] = useState<PaymentFilter>('ALL')
  const [channel, setChannel] = useState<'ALL' | 'MESSENGER' | 'PHONE' | 'IN_PERSON' | 'OTHER'>('ALL')
  const [customerId, setCustomerId] = useState('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const nextSearch = searchParams.get('search') ?? ''
    setSearch(nextSearch)
    setPage(1)
  }, [searchParams])

  const filters = {
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    channel: channel === 'ALL' ? undefined : channel,
    customerId: customerId === 'ALL' ? undefined : customerId,
    from: from || undefined,
    to: to || undefined,
    paymentStatus: paymentStatus === 'UNPAID' || paymentStatus === 'PAID' ? paymentStatus : undefined,
    paymentMethod: paymentStatus === 'COD' ? 'COD' as const : undefined,
    page,
    limit: 20,
  }
  const { data: orders, isLoading, isError, refetch } = useOrders(filters)
  const countBase = { search: search.trim() || undefined, channel: channel === 'ALL' ? undefined : channel, customerId: customerId === 'ALL' ? undefined : customerId, page: 1, limit: 1 }
  const { data: toDeliverCount } = useOrders({ ...countBase, status: 'TO_DELIVER' })
  const { data: unpaidCount } = useOrders({ ...countBase, paymentStatus: 'UNPAID' })
  const { data: codCount } = useOrders({ ...countBase, paymentMethod: 'COD', paymentStatus: 'UNPAID' })
  const { data: codPartialCount } = useOrders({ ...countBase, paymentMethod: 'COD', paymentStatus: 'PARTIALLY_PAID' })
  const countFor = (items: typeof toDeliverCount) => (items as (typeof toDeliverCount & { pagination?: { total?: number } }) | undefined)?.pagination?.total ?? 0
  const codOutstandingCount = countFor(codCount) + countFor(codPartialCount)
  const { data: customers = [] } = useCustomers()
  const visibleOrders = paymentStatus === 'COD' ? orders?.filter((order) => order.paymentStatus !== 'PAID') : orders

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('orders.title')}</h1>
          <p className="mt-1 hidden text-muted-foreground sm:block">{t('orders.description')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" className="rounded-full"><Link to="/pre-orders"><CalendarClock className="mr-2 h-4 w-4" />{t('orders.viewPreorders')}</Link></Button>
          <Button asChild size="icon" className="h-12 w-12 rounded-full" aria-label={t('orders.addOrder')}><Link to="/orders/new"><Plus className="h-6 w-6" /></Link></Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 rounded-full bg-card pl-11"
            aria-label={t('orders.filters.search')}
            placeholder={t('orders.filters.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {fulfillmentStatuses.map((value) => (
            <Button
              key={value}
              type="button"
              aria-label={value === 'ALL' ? t('orders.filters.all') : t(`orders.status.${value}`)}
              variant={status === value ? 'default' : 'outline'}
              className="h-10 shrink-0 rounded-full px-4"
              onClick={() => setStatus(value)}
            >
              {value === 'ALL' ? t('orders.filters.all') : t(`orders.status.${value}`)}{value === 'TO_DELIVER' ? <span className="ml-1 rounded-full bg-background/70 px-1.5 text-xs">{countFor(toDeliverCount)}</span> : null}
            </Button>
          ))}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {paymentStatuses.map((value) => (
            <Button
              key={value}
              type="button"
              aria-label={value === 'ALL' ? t('orders.paymentFilters.all') : t(`orders.paymentStatus.${value}`)}
              size="sm"
              variant={paymentStatus === value ? 'secondary' : 'ghost'}
              className="shrink-0 rounded-full"
              onClick={() => setPaymentStatus(value)}
            >
              {value === 'ALL' ? t('orders.paymentFilters.all') : t(`orders.paymentStatus.${value}`)}{value === 'UNPAID' ? <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{countFor(unpaidCount)}</span> : value === 'COD' ? <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">{codOutstandingCount}</span> : null}
            </Button>
          ))}
        </div>
      </div>

      <details className="rounded-3xl border bg-card p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-medium">{t('orders.filters.more')}</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Select value={channel} onValueChange={(value) => setChannel(value as typeof channel)}>
          <SelectTrigger aria-label={t('orders.filters.channel')}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('orders.filters.allChannels')}</SelectItem>
            {(['MESSENGER', 'PHONE', 'IN_PERSON', 'OTHER'] as const).map((value) => (
              <SelectItem key={value} value={value}>{t(`orders.channels.${value}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger aria-label={t('orders.filters.customer')}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('orders.filters.allCustomers')}</SelectItem>
            {customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input aria-label={t('orders.filters.from')} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input aria-label={t('orders.filters.to')} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </details>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{t('orders.loadError')}</p>
          <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
            {t('orders.retry')}
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && visibleOrders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PackageOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">{t('orders.emptyTitle')}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {t('orders.emptyDescription')}
          </p>
          <Button asChild className="mt-6">
            <Link to="/orders/new">{t('orders.addFirstOrder')}</Link>
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && visibleOrders && visibleOrders.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleOrders.map((order) => {
            const orderPaymentStatus = getPaymentDisplayStatus(order)
            const action = getContextAction(order, orderPaymentStatus)
            return (
            <article key={order.id} className={`min-w-0 rounded-3xl border-l-4 ${getCardTone(order, orderPaymentStatus)} bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/orders/${order.id}`} className="font-semibold hover:underline">{order.customerName}</Link>
                  <p className="mt-0.5 font-mono text-xs font-medium text-sky-700 dark:text-sky-300">{order.orderNumber}</p>
                  <p className="mt-1 truncate text-sm">{getItemSummary(order)}</p>
                </div>
                <p className="max-w-[42%] shrink-0 truncate text-right font-bold">{formatMMK(order.totalMMK)}</p>
              </div>
              <p className="mt-3 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{order.detailedAddress}, {order.townshipOrCity}</span>
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={orderPaymentStatus === 'PAID' ? 'default' : 'secondary'}>
                  {t(`orders.paymentStatus.${orderPaymentStatus}`)}
                </Badge>
                <Badge variant="outline">{t(`orders.status.${order.status}`)}</Badge>
                <Button asChild variant="ghost" size="sm" className="ml-auto rounded-full">
                  <Link to={`/orders/${order.id}`}>
                    {t(`orders.cardActions.${action}`)}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </article>
          )})}
        </div>
      ) : null}
      {!isLoading && !isError && visibleOrders && visibleOrders.length > 0 && (visibleOrders as typeof visibleOrders & { pagination?: { page: number; totalPages: number } }).pagination?.totalPages! > 1 ? (
        <div className="flex items-center justify-between gap-3" aria-label="Pagination">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {(visibleOrders as typeof visibleOrders & { pagination?: { totalPages: number } }).pagination?.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= ((visibleOrders as typeof visibleOrders & { pagination?: { totalPages: number } }).pagination?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  )
}
