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

export function OrderCreatePage() {
  const { t } = useTranslation('features')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createOrder = useCreateOrder()

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
            isSubmitting={createOrder.isPending}
            onSubmit={async (values) => {
              try {
                const order = await createOrder.mutateAsync(toCreateOrderPayload(values))
                toast.success(t('orders.created'))
                navigate(`/orders/${order.id}`)
              } catch (error) {
                toast.error(
                  error instanceof ApiError ? error.message : t('orders.saveError'),
                )
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
