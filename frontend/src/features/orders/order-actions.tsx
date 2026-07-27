import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Order, OrderStatus, PaymentMethod } from '@/features/orders/types'
import { paymentMethods } from '@/features/orders/types'
import { useRecordPayment, useTransitionOrder } from '@/features/orders/use-orders'
import { ApiError } from '@/lib/api-error'
import { formatMMK } from '@/lib/format-mmk'

export function OrderActions({ order }: { order: Order }) {
  const { t } = useTranslation('features')
  const transition = useTransitionOrder(order.id)
  const payment = useRecordPayment(order.id)
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [amount, setAmount] = useState(String(order.balanceDueMMK))
  const [method, setMethod] = useState<PaymentMethod>(order.paymentMethod === 'COD' ? 'COD' : 'CASH')
  const [note, setNote] = useState('')

  const preorderTransitions: Partial<Record<string, OrderStatus[]>> = {
    CONFIRMED: ['CANCELLED'],
    DEPOSIT_PAID: ['CANCELLED'],
    RESERVED: ['READY_TO_FULFILL', 'CANCELLED'],
    AWAITING_STOCK: ['CANCELLED'],
    READY_TO_FULFILL: ['FULFILLED', 'CANCELLED'],
    FULFILLED: ['CANCELLED'],
  }
  const transitions: OrderStatus[] = order.type === 'PREORDER'
    ? (preorderTransitions[order.status] ?? [])
    : order.status === 'TO_DELIVER' ? ['DELIVERED', 'CANCELLED'] : []

  const fail = (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : t('orders.actionError'))

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {order.status !== 'CANCELLED' && order.balanceDueMMK > 0 ? (
          <Button variant="outline" onClick={() => {
            setAmount(String(order.balanceDueMMK))
            setPaymentOpen(true)
          }}>{t('orders.recordPayment')}</Button>
        ) : null}
        {transitions.map((status) => (
          <Button
            key={status}
            variant={status === 'CANCELLED' ? 'destructive' : 'default'}
            onClick={() => setNextStatus(status)}
          >
            {t(`orders.actions.${status}`)}
          </Button>
        ))}
      </div>

      <Dialog open={nextStatus !== null} onOpenChange={(open) => !open && setNextStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{nextStatus ? t(`orders.confirm.${nextStatus}.title`, { defaultValue: t(`orders.actions.${nextStatus}`) }) : ''}</DialogTitle>
            <DialogDescription>{nextStatus ? t(`orders.confirm.${nextStatus}.description`, { defaultValue: t('orders.confirmAction') }) : ''}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNextStatus(null)}>{t('orders.close')}</Button>
            <Button
              variant={nextStatus === 'CANCELLED' ? 'destructive' : 'default'}
              disabled={transition.isPending}
              onClick={async () => {
                if (!nextStatus) return
                try {
                  const updatedOrder = await transition.mutateAsync({ status: nextStatus })
                  toast.success(t('orders.statusUpdated'))
                  setNextStatus(null)
                  if (
                    nextStatus === 'DELIVERED'
                    && updatedOrder.paymentMethod === 'COD'
                    && updatedOrder.paymentStatus !== 'PAID'
                    && updatedOrder.balanceDueMMK > 0
                  ) {
                    setAmount(String(updatedOrder.balanceDueMMK))
                    setMethod('COD')
                    setPaymentOpen(true)
                  }
                } catch (error) { fail(error) }
              }}
            >{transition.isPending ? t('orders.saving') : t('orders.confirmAction')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('orders.payment.title')}</DialogTitle>
            <DialogDescription>{t('orders.payment.description', { balance: formatMMK(order.balanceDueMMK) })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">{t('orders.payment.amount')}</Label>
              <Input id="payment-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">{t('orders.payment.method')}</Label>
              <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
                <SelectTrigger id="payment-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((value) => <SelectItem key={value} value={value}>{t(`orders.payment.methods.${value}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-note">{t('orders.payment.note')}</Label>
              <Textarea id="payment-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>{t('orders.close')}</Button>
            <Button
              disabled={payment.isPending || !/^\d+$/.test(amount) || Number(amount) < 1 || Number(amount) > order.balanceDueMMK}
              onClick={async () => {
                try {
                  await payment.mutateAsync({ amountMMK: Number(amount), method, note: note.trim() || undefined })
                  toast.success(t('orders.payment.recorded'))
                  setNote('')
                  setPaymentOpen(false)
                } catch (error) { fail(error) }
              }}
            >{payment.isPending ? t('orders.saving') : t('orders.payment.submit')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
