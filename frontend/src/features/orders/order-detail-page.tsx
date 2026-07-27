import { ClipboardCopy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
  OrderForm,
  toUpdateOrderPayload,
} from '@/features/orders/order-form'
import { OrderActions } from '@/features/orders/order-actions'
import { useOrder, useUpdateOrder } from '@/features/orders/use-orders'
import { ApiError } from '@/lib/api-error'
import { copyDeliveryToClipboard } from '@/lib/delivery-clipboard'
import { formatMMK } from '@/lib/format-mmk'
import { BackToListLink } from '@/components/back-to-list-link'

export function OrderDetailPage() {
  const { t } = useTranslation('features')
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, isError, refetch } = useOrder(id)
  const updateOrder = useUpdateOrder(id ?? '')
  const [editing, setEditing] = useState(false)
  const [copying, setCopying] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{t('orders.loadError')}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => void refetch()}>
            {t('orders.retry')}
          </Button>
          <BackToListLink to="/orders" label={t('orders.backToList')} />
        </div>
      </div>
    )
  }

  const canEdit = order.status !== 'CANCELLED'
    && order.status !== 'DELIVERED'
    && order.status !== 'COMPLETED'
    && order.status !== 'FULFILLED'

  const handleCopyDelivery = async () => {
    setCopying(true)
    try {
      await copyDeliveryToClipboard(order)
      toast.success(t('orders.copiedToClipboard'))
    } catch {
      toast.error(t('orders.copyError'))
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <BackToListLink to="/orders" label={t('orders.backToList')} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {order.orderNumber}
              </h1>
              <Badge variant="secondary">{t(`orders.status.${order.status}`)}</Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              {t('orders.detailSummary', {
                total: formatMMK(order.totalMMK),
                paid: formatMMK(order.amountPaidMMK),
              })}
            </p>
            <p className="mt-1 font-medium">{t('orders.balanceDue', { balance: formatMMK(order.balanceDueMMK) })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleCopyDelivery()} disabled={copying}>
              <ClipboardCopy className="mr-2 h-4 w-4" />
              {copying ? t('orders.copying') : t('orders.copyDeliveryInfo')}
            </Button>
            {canEdit ? (
              <Button variant="outline" onClick={() => setEditing((value) => !value)}>
                {editing ? t('orders.cancelEdit') : t('orders.edit')}
              </Button>
            ) : null}
            <OrderActions order={order} />
          </div>
        </div>
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.editTitle')}</CardTitle>
            <CardDescription>{t('orders.editDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderForm
              mode="edit"
              order={order}
              isSubmitting={updateOrder.isPending}
              onSubmit={async (values) => {
                try {
                  await updateOrder.mutateAsync(toUpdateOrderPayload(values))
                  toast.success(t('orders.updated'))
                  setEditing(false)
                } catch (error) {
                  toast.error(
                    error instanceof ApiError ? error.message : t('orders.saveError'),
                  )
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('orders.deliveryTitle')}</CardTitle>
              <CardDescription>{t('orders.deliveryDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DeliveryField label={t('orders.fields.customerName')} value={order.customerName} />
              <DeliveryField label={t('orders.fields.customerPhone')} value={order.customerPhone} />
              <DeliveryField label={t('orders.fields.townshipOrCity')} value={order.townshipOrCity} />
              <DeliveryField
                label={t('orders.fields.addressLabel')}
                value={order.addressLabel ?? t('orders.noAddressLabel')}
              />
              <div className="sm:col-span-2">
                <DeliveryField
                  label={t('orders.fields.detailedAddress')}
                  value={order.detailedAddress}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('orders.payment.history')}</CardTitle>
              <CardDescription>{t('orders.payment.historyDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {order.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('orders.payment.empty')}</p>
              ) : (
                <div className="overflow-x-auto">
                <Table className="min-w-[480px]">
                  <TableHeader><TableRow>
                    <TableHead>{t('orders.payment.method')}</TableHead>
                    <TableHead>{t('orders.payment.note')}</TableHead>
                    <TableHead className="text-right">{t('orders.payment.amount')}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{order.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{t(`orders.payment.methods.${payment.method}`)}</TableCell>
                      <TableCell>{payment.note ?? '—'}</TableCell>
                      <TableCell className="text-right">{formatMMK(payment.amountMMK)}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('orders.itemsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('orders.columns.product')}</TableHead>
                    <TableHead>{t('orders.columns.sku')}</TableHead>
                    <TableHead className="text-right">{t('orders.columns.qty')}</TableHead>
                    <TableHead className="text-right">{t('orders.columns.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.productSku}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatMMK(item.lineTotalMMK)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function DeliveryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
