import { CalendarClock, LineChart, PackageOpen, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDashboard } from '@/features/reports/use-reports'
import { formatMMK } from '@/lib/format-mmk'

export function DashboardPage() {
  const { t } = useTranslation('pages')
  const { t: tf } = useTranslation('features')
  const { data, isLoading, isError, refetch } = useDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/30 p-6 text-center text-destructive">
        <p>{t('dashboard.loadError')}</p>
        <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
          {t('dashboard.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">{t('dashboard.description')}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/reports">{t('dashboard.viewReports')}</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.todaySales')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <LineChart className="h-5 w-5 text-muted-foreground" />
              {formatMMK(data.today.revenueMMK)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.orderCount', { count: data.today.orderCount })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.monthSales')}</CardDescription>
            <CardTitle className="text-2xl">{formatMMK(data.monthToDate.revenueMMK)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.orderCount', { count: data.monthToDate.orderCount })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('dashboard.openPreorders')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PackageOpen className="h-5 w-5 text-muted-foreground" />
              {data.openPreorders.count}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{t('dashboard.depositsPaid', { amount: formatMMK(data.openPreorders.amountPaidMMK) })}</p>
            <p>{t('dashboard.balanceDue', { amount: formatMMK(data.openPreorders.balanceDueMMK) })}</p>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/pre-orders">{t('dashboard.viewPreorders')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {data.lowStockCount > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TriangleAlert className="h-5 w-5" />
              {t('dashboard.lowStockTitle')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.lowStockDescription', { count: data.lowStockCount })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/products">{t('dashboard.viewProducts')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {(data.preorderShortages ?? []).length > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle>{t('dashboard.preorderShortagesTitle')}</CardTitle>
            <CardDescription>{t('dashboard.preorderShortagesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.preorderShortages ?? []).map((item) => (
              <div key={item.productId} className="flex items-center justify-between rounded-md border bg-background/70 px-3 py-2 text-sm">
                <span>{item.productName}</span>
                <span className="font-medium">{t('dashboard.preorderShortageQty', { count: item.toOrderQty })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            {t('dashboard.pipelineTitle')}
          </CardTitle>
          <CardDescription>{t('dashboard.pipelineDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.pipeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.pipelineEmpty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tf('reports.pipeline.status')}</TableHead>
                  <TableHead className="text-right">{tf('reports.pipeline.count')}</TableHead>
                  <TableHead className="text-right">{tf('reports.pipeline.paid')}</TableHead>
                  <TableHead className="text-right">{tf('reports.pipeline.balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pipeline.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell>{tf(`orders.status.${row.status}`, row.status)}</TableCell>
                    <TableCell className="text-right">{row.orderCount}</TableCell>
                    <TableCell className="text-right">{formatMMK(row.amountPaidMMK)}</TableCell>
                    <TableCell className="text-right">{formatMMK(row.balanceDueMMK)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
