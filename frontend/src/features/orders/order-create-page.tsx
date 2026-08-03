import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  OrderForm,
  toCreateOrderPayload,
} from '@/features/orders/order-form'
import { useCreateOrder } from '@/features/orders/use-orders'
import { ApiError } from '@/lib/api-error'
import { BackToListLink } from '@/components/back-to-list-link'
import { ReceiptDialog } from '@/features/orders/receipt-dialog'
import { useAuth } from '@/features/auth/auth-provider'
import { useState } from 'react'
import type { Order } from '@/features/orders/types'

export function OrderCreatePage() {
  const { t } = useTranslation('features')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createOrder = useCreateOrder()
  const { state } = useAuth()
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
  const assistantDraft = (() => { try { const raw = sessionStorage.getItem('assistant-order-draft'); return raw ? JSON.parse(raw) : undefined } catch { return undefined } })()

  return (
    <div className="space-y-6">
      <div>
        <BackToListLink to="/orders" label={t('orders.backToList')} />
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('orders.createTitle')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('orders.createDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('orders.formTitle')}</CardTitle>
          <CardDescription>{t('orders.formDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderForm
            mode="create"
            initialCustomerId={searchParams.get('customerId') ?? undefined}
            initialOrderType={searchParams.get('type')?.toLowerCase() === 'preorder' ? 'PREORDER' : 'STANDARD'}
            initialDraft={assistantDraft}
            isSubmitting={createOrder.isPending}
            onSubmit={async (values) => {
              try {
                const order = await createOrder.mutateAsync(toCreateOrderPayload(values))
                sessionStorage.removeItem('assistant-order-draft')
                toast.success(t('orders.created'))
                if (values.printReceipt) setReceiptOrder(order)
                else navigate(`/orders/${order.id}`)
              } catch (error) {
                toast.error(
                  error instanceof ApiError ? error.message : t('orders.saveError'),
                )
              }
            }}
          />
        </CardContent>
      </Card>
      {receiptOrder && state.status === 'authenticated' && state.shop ? <ReceiptDialog order={receiptOrder} shop={state.shop} onClose={() => navigate(`/orders/${receiptOrder.id}`)} /> : null}
    </div>
  )
}
