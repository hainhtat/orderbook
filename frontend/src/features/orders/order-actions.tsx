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
import { useCollectCod, useRecordPayment, useTransitionOrder } from '@/features/orders/use-orders'
import { ApiError } from '@/lib/api-error'
import { formatMMK } from '@/lib/format-mmk'

export function OrderActions({ order }: { order: Order }) {
  const { t } = useTranslation('features')
  const transition = useTransitionOrder(order.id)
  const payment = useRecordPayment(order.id)
  const collectCod = useCollectCod(order.id)
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null)
  const [cancelNote, setCancelNote] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [amount, setAmount] = useState(String(order.balanceDueMMK))
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [codFee, setCodFee] = useState('')
  const [feeMode, setFeeMode] = useState<'PERCENT' | 'AMOUNT'>('PERCENT')
  const [note, setNote] = useState('')

  const preorderTransitions: Partial<Record<string, OrderStatus[]>> = {
    CONFIRMED: ['CANCELLED'],
    DEPOSIT_PAID: ['CANCELLED'],
    RESERVED: ['READY_TO_FULFILL', 'CANCELLED'],
    AWAITING_STOCK: ['RESERVED', 'CANCELLED'],
    READY_TO_FULFILL: ['FULFILLED', 'CANCELLED'],
    FULFILLED: [],
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
          }}>{order.paymentMethod === 'COD' ? t('orders.cod.collect') : t('orders.recordPayment')}</Button>
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

      <Dialog
        open={nextStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNextStatus(null)
            setCancelNote('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{nextStatus ? t(`orders.confirm.${nextStatus}.title`, { defaultValue: t(`orders.actions.${nextStatus}`) }) : ''}</DialogTitle>
            <DialogDescription>{nextStatus ? t(`orders.confirm.${nextStatus}.description`, { defaultValue: t('orders.confirmAction') }) : ''}</DialogDescription>
          </DialogHeader>
          {nextStatus === 'CANCELLED' && order.type === 'PREORDER' && order.amountPaidMMK > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="cancel-forfeiture-note">{t('orders.preorderCancel.forfeitureNote')}</Label>
              <Textarea
                id="cancel-forfeiture-note"
                value={cancelNote}
                onChange={(event) => setCancelNote(event.target.value)}
                placeholder={t('orders.preorderCancel.forfeiturePlaceholder')}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNextStatus(null); setCancelNote('') }}>{t('orders.close')}</Button>
            <Button
              variant={nextStatus === 'CANCELLED' ? 'destructive' : 'default'}
              disabled={transition.isPending}
              onClick={async () => {
                if (!nextStatus) return
                try {
                  const note = nextStatus === 'CANCELLED' && order.type === 'PREORDER' && order.amountPaidMMK > 0
                    ? cancelNote.trim() || undefined
                    : undefined
                  const updatedOrder = await transition.mutateAsync({ status: nextStatus, note })
                  toast.success(t('orders.statusUpdated'))
                  setNextStatus(null)
                  setCancelNote('')
                  if (
                    nextStatus === 'DELIVERED'
                    && updatedOrder.paymentMethod === 'COD'
                    && updatedOrder.paymentStatus !== 'PAID'
                    && updatedOrder.balanceDueMMK > 0
                  ) {
                    setAmount(String(updatedOrder.balanceDueMMK))
                    setMethod('CASH')
                    setCodFee('')
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
            <DialogTitle>{order.paymentMethod === 'COD' ? t('orders.cod.collect') : t('orders.payment.title')}</DialogTitle>
            <DialogDescription>{order.paymentMethod === 'COD' ? t('orders.cod.description', { balance: formatMMK(order.balanceDueMMK) }) : t('orders.payment.description', { balance: formatMMK(order.balanceDueMMK) })}</DialogDescription>
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
                  {paymentMethods.filter((value) => order.paymentMethod !== 'COD' || value !== 'COD').map((value) => <SelectItem key={value} value={value}>{t(`orders.payment.methods.${value}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {order.paymentMethod === 'COD' ? <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="cod-fee">{t('orders.cod.fee')}</Label>
                <div className="flex rounded-lg border bg-background p-1">
                  <Button type="button" size="sm" variant={feeMode === 'PERCENT' ? 'default' : 'ghost'} onClick={() => setFeeMode('PERCENT')}>%</Button>
                  <Button type="button" size="sm" variant={feeMode === 'AMOUNT' ? 'default' : 'ghost'} onClick={() => setFeeMode('AMOUNT')}>{t('orders.cod.mmk')}</Button>
                </div>
              </div>
              <Input id="cod-fee" inputMode="numeric" value={codFee} onChange={(event) => setCodFee(event.target.value)} placeholder={feeMode === 'PERCENT' ? '7' : '0'} />
              <p className="text-sm text-muted-foreground">{t('orders.cod.netReceived', { amount: formatMMK(Math.max(0, Number(amount || 0) - (feeMode === 'PERCENT' ? Math.round(Number(amount || 0) * Number(codFee || 0) / 100) : Number(codFee || 0)))) })}</p>
            </div> : null}
            <div className="space-y-2">
              <Label htmlFor="payment-note">{t('orders.payment.note')}</Label>
              <Textarea id="payment-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>{t('orders.close')}</Button>
            <Button
              disabled={payment.isPending || collectCod.isPending || !/^\d+$/.test(amount) || Number(amount) < 1 || Number(amount) > order.balanceDueMMK || (codFee !== '' && (!/^\d+(\.\d+)?$/.test(codFee) || Number(codFee) < 0))}
              onClick={async () => {
                try {
                  if (order.paymentMethod === 'COD') {
                    const feeMMK = feeMode === 'PERCENT' ? Math.round(Number(amount) * Number(codFee || 0) / 100) : Math.round(Number(codFee || 0))
                    await collectCod.mutateAsync({ amountMMK: Number(amount), settlementMethod: method as Exclude<PaymentMethod, 'COD'>, feeMMK, note: note.trim() || undefined })
                  } else {
                    await payment.mutateAsync({ amountMMK: Number(amount), method, note: note.trim() || undefined })
                  }
                  toast.success(t('orders.payment.recorded'))
                  setNote('')
                  setCodFee('')
                  setPaymentOpen(false)
                } catch (error) { fail(error) }
              }}
            >{payment.isPending || collectCod.isPending ? t('orders.saving') : order.paymentMethod === 'COD' ? t('orders.cod.submit') : t('orders.payment.submit')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
