import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
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
import {
  CustomerForm,
  toUpdateCustomerPayload,
} from '@/features/customers/customer-form'
import {
  useCustomer,
  useCustomerOrders,
  useUpdateCustomer,
} from '@/features/customers/use-customers'
import { ApiError } from '@/lib/api-error'
import { formatMMK } from '@/lib/format-mmk'
import { BackToListLink } from '@/components/back-to-list-link'

export function CustomerDetailPage() {
  const { t } = useTranslation('features')
  const { id } = useParams<{ id: string }>()
  const { data: customer, isLoading, isError, refetch } = useCustomer(id)
  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useCustomerOrders(id)
  const updateCustomer = useUpdateCustomer(id ?? '')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{t('customers.loadError')}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => void refetch()}>
            {t('customers.retry')}
          </Button>
          <BackToListLink to="/customers" label={t('customers.backToList')} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <BackToListLink to="/customers" label={t('customers.backToList')} />
        <h1 className="text-3xl font-semibold tracking-tight">
          {customer.name}
        </h1>
        <p className="mt-2 text-muted-foreground">{customer.phone}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('customers.editTitle')}</CardTitle>
          <CardDescription>{t('customers.editDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm
            key={customer.id}
            customer={customer}
            isSubmitting={updateCustomer.isPending}
            onSubmit={async (values) => {
              try {
                await updateCustomer.mutateAsync(toUpdateCustomerPayload(values))
                toast.success(t('customers.updated'))
              } catch (error) {
                if (error instanceof ApiError && error.status === 409) {
                  return
                }
                toast.error(
                  error instanceof ApiError
                    ? error.message
                    : t('customers.saveError'),
                )
              }
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('customers.ordersTitle')}</CardTitle>
          <CardDescription>{t('customers.ordersDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : null}

          {ordersError ? (
            <p className="text-sm text-destructive">
              {t('customers.ordersLoadError')}
            </p>
          ) : null}

          {!ordersLoading && !ordersError && orders?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('customers.ordersEmpty')}
            </p>
          ) : null}

          {!ordersLoading && !ordersError && orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('customers.orderColumns.number')}</TableHead>
                  <TableHead>{t('customers.orderColumns.status')}</TableHead>
                  <TableHead className="text-right">
                    {t('customers.orderColumns.total')}
                  </TableHead>
                  <TableHead className="text-right">
                    {t('customers.orderColumns.paid')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell className="text-right">
                      {formatMMK(order.totalMMK)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMMK(order.amountPaidMMK)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
