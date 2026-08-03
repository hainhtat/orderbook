import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCustomers } from '@/features/customers/use-customers'
import type { Order, OrderFormValues, PaymentMethod } from '@/features/orders/types'
import { useProducts } from '@/features/products/use-products'

type OrderFormProps = {
  mode: 'create' | 'edit'
  order?: Order
  initialCustomerId?: string
  initialOrderType?: 'STANDARD' | 'PREORDER'
  onSubmit: (values: OrderFormValues) => Promise<void>
  isSubmitting?: boolean
  initialDraft?: { customerId?: string | null; newCustomer?: { name?: string; phone?: string } | null; lineItems?: Array<{ productId: string; quantity: number }>; notes?: string }
}

export function OrderForm({ mode, order, initialCustomerId, initialOrderType = 'STANDARD', initialDraft, onSubmit, isSubmitting = false }: OrderFormProps) {
  const { t } = useTranslation('features')
  const { data: customers = [] } = useCustomers()
  const { data: products = [] } = useProducts()
  const [productSearch, setProductSearch] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showDelivery, setShowDelivery] = useState(Boolean(order?.detailedAddress))

  const schema = useMemo(() => z.object({
    customerId: z.string(),
    orderType: z.enum(['STANDARD', 'PREORDER']),
    expectedFulfillAt: z.string(),
    quickCreateCustomer: z.boolean(),
    printReceipt: z.boolean().optional(),
    channelReference: z.string(),
    discountMMK: z.string().refine((value) => value === '' || (/^\d+$/.test(value) && Number(value) >= 0), t('orders.validation.invalidAmount')),
    notes: z.string(),
    paymentMethod: z.enum(['', 'COD', 'CASH', 'BANK_TRANSFER', 'KBZPAY_MANUAL', 'WAVE_MANUAL', 'OTHER']),
    customerName: z.string().min(1, t('orders.validation.required')),
    customerPhone: z.string().min(1, t('orders.validation.required')),
    townshipOrCity: z.string().min(1, t('orders.validation.required')),
    detailedAddress: z.string().min(1, t('orders.validation.required')),
    addressLabel: z.string(),
    lineItems: z.array(z.object({
      productId: z.string().min(1, t('orders.validation.required')),
      quantity: z.string().min(1, t('orders.validation.required')).refine((value) => /^\d+$/.test(value) && Number(value) >= 1, t('orders.validation.invalidAmount')),
    })).min(1, t('orders.validation.lineItemsRequired')),
  }).refine((values) => values.quickCreateCustomer || values.customerId.length > 0, { path: ['customerId'], message: t('orders.validation.required') }), [t])

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: order?.customerId ?? initialDraft?.customerId ?? initialCustomerId ?? '',
      orderType: (order?.type as 'STANDARD' | 'PREORDER') ?? initialOrderType,
      expectedFulfillAt: order?.expectedFulfillAt?.slice(0, 10) ?? '',
      quickCreateCustomer: Boolean(initialDraft?.newCustomer),
      channelReference: order?.channelReference ?? '',
      discountMMK: order ? String(order.discountMMK) : '0',
      notes: order?.notes ?? initialDraft?.notes ?? '',
      paymentMethod: order?.paymentMethod ?? '',
      customerName: order?.customerName ?? initialDraft?.newCustomer?.name ?? '',
      customerPhone: order?.customerPhone ?? initialDraft?.newCustomer?.phone ?? '',
      townshipOrCity: order?.townshipOrCity ?? '',
      detailedAddress: order?.detailedAddress ?? '',
      addressLabel: order?.addressLabel ?? '',
      lineItems: order?.lineItems.map((item) => ({ productId: item.productId ?? '', quantity: String(item.quantity) })) ?? initialDraft?.lineItems?.map((item) => ({ productId: item.productId, quantity: String(item.quantity) })) ?? [],
      printReceipt: false,
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lineItems' })
  const customerId = form.watch('customerId')
  const quickCreateCustomer = form.watch('quickCreateCustomer')
  const orderType = form.watch('orderType')
  const lineItems = form.watch('lineItems')

  useEffect(() => {
    if (quickCreateCustomer || !customerId) return
    const customer = customers.find((item) => item.id === customerId)
    if (!customer) return
    form.setValue('customerName', customer.name)
    form.setValue('customerPhone', customer.phone)
    if (customer.townshipOrCity) form.setValue('townshipOrCity', customer.townshipOrCity)
    if (customer.detailedAddress) form.setValue('detailedAddress', customer.detailedAddress)
    if (customer.addressLabel) form.setValue('addressLabel', customer.addressLabel)
    setShowDelivery(Boolean(customer.detailedAddress))
  }, [customerId, customers, form, quickCreateCustomer])

  const filteredProducts = products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.toLowerCase()))
  const subtotal = lineItems.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    return sum + (product?.priceMMK ?? 0) * Number(item.quantity || 0)
  }, 0)
  const discount = Number(form.watch('discountMMK') || 0)

  const addProduct = (productId: string) => {
    const product = products.find((item) => item.id === productId)
    const available = product ? Math.max(0, product.stockQty - product.reservedQty) : 0
    const index = fields.findIndex((field) => field.productId === productId)
    if (index >= 0) {
      const quantity = Number(form.getValues(`lineItems.${index}.quantity`))
      if (orderType === 'STANDARD' && quantity >= available) return
      form.setValue(`lineItems.${index}.quantity`, String(quantity + 1))
    } else append({ productId, quantity: '1' })
  }

  return (
    <Form {...form}>
      <form className="space-y-5 pb-28" onSubmit={form.handleSubmit(onSubmit, (errors) => {
        if (errors.townshipOrCity || errors.detailedAddress || errors.customerName || errors.customerPhone) setShowDelivery(true)
      })}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
          <section className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input aria-label={t('orders.fields.product')} className="h-11 pl-9" placeholder={t('orders.fields.productPlaceholder')} value={productSearch} onChange={(event) => setProductSearch(event.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredProducts.map((product) => {
                const available = Math.max(0, product.stockQty - product.reservedQty)
                const selectedItem = lineItems.find((item) => item.productId === product.id)
                const selectedQuantity = Number(selectedItem?.quantity ?? 0)
                const cannotAdd = orderType === 'STANDARD' && available <= selectedQuantity
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={cannotAdd}
                    onClick={() => addProduct(product.id)}
                    className="group flex min-h-24 items-center gap-3 rounded-3xl border bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                  >
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Box className="h-7 w-7 text-muted-foreground" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{product.name}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {product.priceMMK.toLocaleString()} MMK
                      </span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary">
                          {t('products.available', { count: available })}
                        </Badge>
                        {selectedQuantity > 0 ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                            <ShoppingCart className="mr-1 h-3 w-3" />
                            {selectedQuantity}
                          </Badge>
                        ) : null}
                        {available <= (product.lowStockAt ?? 0) && available > 0 ? (
                          <Badge variant="warning">{t('products.status.lowStock')}</Badge>
                        ) : null}
                        {available === 0 ? (
                          <Badge variant="destructive">{t('products.detail.outOfStock')}</Badge>
                        ) : null}
                      </span>
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition group-hover:scale-105">
                      <Plus className="h-5 w-5" />
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div><h2 className="font-semibold">{t('orders.sections.items')}</h2><p className="text-sm text-muted-foreground">{fields.length} {t('orders.items')}</p></div>
              {fields.length > 0 && <span className="font-semibold">{Math.max(0, subtotal - discount).toLocaleString()} MMK</span>}
            </div>
            {fields.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t('orders.sections.itemsDescription')}</p> : (
              <div className="space-y-2">
                {fields.map((field, index) => {
                  const product = products.find((item) => item.id === field.productId)
                  const quantity = Number(lineItems[index]?.quantity || 1)
                  const available = product ? Math.max(0, product.stockQty - product.reservedQty) : 0
                  const cannotIncrease = orderType === 'STANDARD' && quantity >= available
                  return <div key={field.id} className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
                    <div className="min-w-0 flex-1"><p className="truncate font-medium">{product?.name ?? t('orders.fields.productPlaceholder')}</p><p className="text-xs text-muted-foreground">{(product?.priceMMK ?? 0).toLocaleString()} MMK</p></div>
                    <Button type="button" variant="outline" size="icon" aria-label={`${t('orders.fields.quantity')} ${product?.name ?? ''}: decrease`} onClick={() => quantity <= 1 ? remove(index) : form.setValue(`lineItems.${index}.quantity`, String(quantity - 1))}><Minus className="h-4 w-4" /></Button>
                    <span className="w-6 text-center text-sm">{quantity}</span>
                    <Button type="button" variant="outline" size="icon" aria-label={`${t('orders.fields.quantity')} ${product?.name ?? ''}: increase`} disabled={cannotIncrease} onClick={() => {
                      if (!cannotIncrease) form.setValue(`lineItems.${index}.quantity`, String(quantity + 1))
                    }}><Plus className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" aria-label={t('orders.removeLineItem')} onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                })}
              </div>
            )}

            <section className="space-y-3 border-t pt-4">
              <FormField control={form.control} name="customerId" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.customer')}</FormLabel><Select value={field.value} onValueChange={field.onChange} disabled={mode === 'edit' || quickCreateCustomer}><FormControl><SelectTrigger><SelectValue placeholder={t('orders.fields.customerPlaceholder')} /></SelectTrigger></FormControl><SelectContent>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name} ({customer.phone})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
              {mode === 'create' && <Button type="button" variant="link" className="h-auto p-0" onClick={() => { const next = !quickCreateCustomer; form.setValue('quickCreateCustomer', next); form.setValue('customerId', ''); if (!next) { form.setValue('customerName', ''); form.setValue('customerPhone', '') } }}>{quickCreateCustomer ? t('orders.selectExistingCustomer') : t('orders.quickCreateCustomer')}</Button>}
              {quickCreateCustomer && <div className="grid gap-3 sm:grid-cols-2"><FormField control={form.control} name="customerName" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.customerName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="customerPhone" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.customerPhone')}</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>} /></div>}
              {mode === 'create' && <FormField control={form.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.paymentMethod')}</FormLabel><Select value={field.value || 'NONE'} onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value as PaymentMethod)}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="NONE">{t('orders.payment.methods.UNSPECIFIED')}</SelectItem><SelectItem value="COD">{t('orders.payment.methods.COD')}</SelectItem><SelectItem value="BANK_TRANSFER">{t('orders.payment.methods.BANK_TRANSFER')}</SelectItem><SelectItem value="KBZPAY_MANUAL">{t('orders.payment.methods.KBZPAY_MANUAL')}</SelectItem><SelectItem value="WAVE_MANUAL">{t('orders.payment.methods.WAVE_MANUAL')}</SelectItem><SelectItem value="CASH">{t('orders.payment.methods.CASH')}</SelectItem><SelectItem value="OTHER">{t('orders.payment.methods.OTHER')}</SelectItem></SelectContent></Select></FormItem>} />}
            </section>

            <button type="button" aria-expanded={showDelivery} aria-controls="order-delivery-fields" className="flex w-full items-center justify-between border-t pt-4 text-left text-sm font-medium" onClick={() => setShowDelivery(!showDelivery)}>{t('orders.sections.delivery')} <span>{showDelivery ? '−' : '+'}</span></button>
            {showDelivery && <div id="order-delivery-fields" className="grid gap-3 sm:grid-cols-2"><FormField control={form.control} name="townshipOrCity" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.townshipOrCity')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="addressLabel" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.addressLabel')}</FormLabel><FormControl><Input placeholder={t('orders.fields.addressLabelPlaceholder')} {...field} /></FormControl></FormItem>} /><FormField control={form.control} name="detailedAddress" render={({ field }) => <FormItem className="sm:col-span-2"><FormLabel>{t('orders.fields.detailedAddress')}</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>} /></div>}

            <FormField control={form.control} name="orderType" render={({ field }) => (
              <FormItem className="border-t pt-4">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-muted/20 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-input accent-primary"
                    checked={field.value === 'PREORDER'}
                    onChange={(event) => {
                      field.onChange(event.target.checked ? 'PREORDER' : 'STANDARD')
                      if (!event.target.checked) form.setValue('expectedFulfillAt', '')
                    }}
                  />
                  <span className="font-medium">{t('orders.types.PREORDER')}</span>
                </label>
              </FormItem>
            )} />
            {orderType === 'PREORDER' && <FormField control={form.control} name="expectedFulfillAt" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.expectedFulfillAt')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />}

            <button type="button" aria-expanded={showAdvanced} aria-controls="order-advanced-fields" className="flex w-full items-center justify-between border-t pt-4 text-left text-sm font-medium" onClick={() => setShowAdvanced(!showAdvanced)}>{t('orders.moreOptions')} <span>{showAdvanced ? '−' : '+'}</span></button>
            {showAdvanced && <div id="order-advanced-fields" className="space-y-3"><FormField control={form.control} name="discountMMK" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.discountMMK')}</FormLabel><FormControl><Input inputMode="numeric" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="channelReference" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.channelReference')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} /><FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>{t('orders.fields.notes')}</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>} /></div>}

            <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur"><div><p className="text-xs text-muted-foreground">{t('orders.total')}</p><p className="text-lg font-semibold">{Math.max(0, subtotal - discount).toLocaleString()} MMK</p></div><FormField control={form.control} name="printReceipt" render={({ field }) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={field.value ?? false} onChange={field.onChange} />{t('orders.printReceipt')}</label>} /><Button type="submit" disabled={isSubmitting || fields.length === 0}>{isSubmitting ? t('orders.saving') : t('orders.save')}</Button></div>
          </section>
        </div>
      </form>
    </Form>
  )
}

export function toCreateOrderPayload(values: OrderFormValues) {
  return {
    type: values.orderType,
    expectedFulfillAt: values.orderType === 'PREORDER' && values.expectedFulfillAt ? values.expectedFulfillAt : null,
    ...(values.quickCreateCustomer ? { customer: { name: values.customerName.trim(), phone: values.customerPhone.trim(), townshipOrCity: values.townshipOrCity.trim() || undefined, detailedAddress: values.detailedAddress.trim() || undefined, addressLabel: values.addressLabel.trim() || undefined } } : { customerId: values.customerId }),
    channelReference: values.channelReference.trim() || undefined,
    discountMMK: values.discountMMK.trim() ? Number(values.discountMMK) : undefined,
    notes: values.notes.trim() || undefined,
    paymentMethod: values.paymentMethod || undefined,
    delivery: { customerName: values.customerName.trim(), customerPhone: values.customerPhone.trim(), townshipOrCity: values.townshipOrCity.trim(), detailedAddress: values.detailedAddress.trim(), addressLabel: values.addressLabel.trim() || null },
    lineItems: values.lineItems.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
  }
}

export function toUpdateOrderPayload(values: OrderFormValues) {
  return {
    channelReference: values.channelReference.trim() || null,
    discountMMK: values.discountMMK.trim() ? Number(values.discountMMK) : 0,
    notes: values.notes.trim() || null,
    delivery: { customerName: values.customerName.trim(), customerPhone: values.customerPhone.trim(), townshipOrCity: values.townshipOrCity.trim(), detailedAddress: values.detailedAddress.trim(), addressLabel: values.addressLabel.trim() || null },
    lineItems: values.lineItems.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
  }
}
