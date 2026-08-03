import { Download, LineChart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { downloadOrdersCsv, localIsoDate } from '@/features/reports/api'
import {
  usePaymentMethods,
  usePreorderPipeline,
  useSalesSummary,
  useTopProducts,
} from '@/features/reports/use-reports'
import type { ReportGroupBy } from '@/features/reports/types'
import { formatMMK } from '@/lib/format-mmk'
import { useDailyStaffReport } from '@/features/cashbook/use-cashbook'

function defaultRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return {
    from: localIsoDate(from),
    to: localIsoDate(to),
  }
}

export function ReportsPage() {
  const { t } = useTranslation('features')
  const initial = useMemo(() => defaultRange(), [])
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('day')
  const [exporting, setExporting] = useState(false)
  const range = { from, to }
  const rangeIsValid = Boolean(from && to && from <= to)

  const sales = useSalesSummary(range, groupBy, rangeIsValid)
  const topProducts = useTopProducts(range, 10, rangeIsValid)
  const pipeline = usePreorderPipeline()
  const payments = usePaymentMethods(range, rangeIsValid)
  const daily = useDailyStaffReport(to)

  const loading =
    sales.isLoading || topProducts.isLoading || pipeline.isLoading || payments.isLoading
  const error = sales.isError || topProducts.isError || pipeline.isError || payments.isError

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('reports.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('reports.description')}</p>
        </div>
        <Button
          variant="outline"
          disabled={exporting || !rangeIsValid}
          onClick={async () => {
            setExporting(true)
            try {
              await downloadOrdersCsv(range)
              toast.success(t('reports.exportSuccess'))
            } catch {
              toast.error(t('reports.exportError'))
            } finally {
              setExporting(false)
            }
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? t('reports.exporting') : t('reports.exportCsv')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.filters.title')}</CardTitle>
          <CardDescription>{t('reports.filters.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="report-from">{t('reports.filters.from')}</Label>
            <Input id="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-to">{t('reports.filters.to')}</Label>
            <Input id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-group">{t('reports.filters.groupBy')}</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as ReportGroupBy)}>
              <SelectTrigger id="report-group"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t('reports.filters.day')}</SelectItem>
                <SelectItem value="week">{t('reports.filters.week')}</SelectItem>
                <SelectItem value="month">{t('reports.filters.month')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!rangeIsValid ? (
        <div role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">
          {t('reports.filters.invalidRange')}
        </div>
      ) : null}

      {rangeIsValid && daily.data ? <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader><CardTitle>{t('cashbook.daily.title', { date: new Date(`${to}T00:00:00`).toLocaleDateString() })}</CardTitle><CardDescription>{t('cashbook.daily.description')}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{(['orderCount', 'salesMMK', 'moneyReceivedMMK', 'expensesMMK', 'netCashMMK'] as const).map((key) => <div key={key} className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">{t(`cashbook.daily.${key}`)}</p><p className="mt-1 truncate font-semibold">{key === 'orderCount' ? daily.data.totals[key] : formatMMK(daily.data.totals[key])}</p></div>)}</div>
          <div className="grid gap-3 lg:grid-cols-2"><div className="rounded-xl border bg-card p-3"><h3 className="mb-2 font-semibold">{t('cashbook.daily.sentOrders')}</h3>{daily.data.orders.length === 0 ? <p className="text-sm text-muted-foreground">{t('cashbook.daily.noOrders')}</p> : daily.data.orders.map((order) => <Link key={order.id} to={`/orders/${order.id}`} className="block border-b py-2 last:border-0"><div className="flex justify-between gap-2"><span className="truncate font-medium">{order.customerName} · {order.townshipOrCity}</span><span className="shrink-0 font-semibold">{formatMMK(order.totalMMK)}</span></div><p className="truncate text-sm text-muted-foreground">{order.lineItems.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}</p></Link>)}</div><div className="rounded-xl border bg-card p-3"><h3 className="mb-2 font-semibold">{t('cashbook.daily.productsSent')}</h3>{daily.data.products.map((product) => <div key={`${product.productSku}:${product.productName}`} className="flex justify-between border-b py-2 last:border-0"><span>{product.productName}</span><span className="font-semibold">× {product.quantity}</span></div>)}</div></div>
        </CardContent>
      </Card> : null}

      {rangeIsValid && error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 p-6 text-center text-destructive">
          {t('reports.loadError')}
          <div className="mt-3">
            <Button variant="outline" onClick={() => {
              void sales.refetch()
              void topProducts.refetch()
              void pipeline.refetch()
              void payments.refetch()
            }}>{t('orders.retry')}</Button>
          </div>
        </div>
      ) : null}

      {rangeIsValid && loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : null}

      {rangeIsValid && !loading && !error && sales.data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-muted-foreground" />
                {t('reports.salesSummary.title')}
              </CardTitle>
              <CardDescription>{t('reports.salesSummary.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.salesSummary.orders')}</p>
                  <p className="text-2xl font-semibold">{sales.data.totals.orderCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.salesSummary.revenue')}</p>
                  <p className="text-2xl font-semibold">{formatMMK(sales.data.totals.revenueMMK)}</p>
                </div>
              </div>
              {sales.data.buckets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.salesSummary.period')}</TableHead>
                      <TableHead className="text-right">{t('reports.salesSummary.orders')}</TableHead>
                      <TableHead className="text-right">{t('reports.salesSummary.revenue')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.data.buckets.map((bucket) => (
                      <TableRow key={bucket.period}>
                        <TableCell>{bucket.period}</TableCell>
                        <TableCell className="text-right">{bucket.orderCount}</TableCell>
                        <TableCell className="text-right">{formatMMK(bucket.revenueMMK)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.topProducts.title')}</CardTitle>
              <CardDescription>{t('reports.topProducts.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.data && topProducts.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.topProducts.product')}</TableHead>
                      <TableHead className="text-right">{t('reports.topProducts.qty')}</TableHead>
                      <TableHead className="text-right">{t('reports.topProducts.revenue')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.data.map((row) => (
                      <TableRow key={`${row.productSku}-${row.productName}`}>
                        <TableCell>
                          <div className="font-medium">{row.productName}</div>
                          <div className="text-xs text-muted-foreground">{row.productSku}</div>
                        </TableCell>
                        <TableCell className="text-right">{row.quantity}</TableCell>
                        <TableCell className="text-right">{formatMMK(row.revenueMMK)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">{t('reports.topProducts.empty')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.pipeline.title')}</CardTitle>
              <CardDescription>{t('reports.pipeline.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {pipeline.data && pipeline.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.pipeline.status')}</TableHead>
                      <TableHead className="text-right">{t('reports.pipeline.count')}</TableHead>
                      <TableHead className="text-right">{t('reports.pipeline.paid')}</TableHead>
                      <TableHead className="text-right">{t('reports.pipeline.balance')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipeline.data.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell>{t(`orders.status.${row.status}`, row.status)}</TableCell>
                        <TableCell className="text-right">{row.orderCount}</TableCell>
                        <TableCell className="text-right">{formatMMK(row.amountPaidMMK)}</TableCell>
                        <TableCell className="text-right">{formatMMK(row.balanceDueMMK)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">{t('reports.pipeline.empty')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.payments.title')}</CardTitle>
              <CardDescription>{t('reports.payments.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.data && payments.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.payments.method')}</TableHead>
                      <TableHead className="text-right">{t('reports.payments.count')}</TableHead>
                      <TableHead className="text-right">{t('reports.payments.amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.data.map((row) => (
                      <TableRow key={row.method}>
                        <TableCell>{t(`orders.payment.methods.${row.method}`, row.method)}</TableCell>
                        <TableCell className="text-right">{row.paymentCount}</TableCell>
                        <TableCell className="text-right">{formatMMK(row.amountMMK)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">{t('reports.payments.empty')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
