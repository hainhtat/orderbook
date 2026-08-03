import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  confirmAiDraft,
  type ConfirmDraftInput,
  type OrderDraft,
} from '@/features/assistant/api'
import { useCustomers } from '@/features/customers/use-customers'
import { useProducts } from '@/features/products/use-products'
import { formatMMK } from '@/lib/format-mmk'

type AssistantDraftFormProps = {
  sessionId: string
  draft: OrderDraft
  onConfirmed: (order: { id: string; orderNumber: string }) => void
}

export function AssistantDraftForm({
  sessionId,
  draft,
  onConfirmed,
}: AssistantDraftFormProps) {
  const { t } = useTranslation('features')
  const { data: customers = [] } = useCustomers()
  const { data: products = [] } = useProducts()

  const schema = useMemo(
    () =>
      z
        .object({
          customerMode: z.enum(['existing', 'new']),
          customerId: z.string(),
          newCustomerName: z.string(),
          newCustomerPhone: z.string(),
          customerName: z.string().min(1, t('orders.validation.required')),
          customerPhone: z.string().min(1, t('orders.validation.required')),
          townshipOrCity: z.string().min(1, t('orders.validation.required')),
          detailedAddress: z.string().min(1, t('orders.validation.required')),
          notes: z.string(),
          lineItems: z
            .array(
              z.object({
                productId: z.string().min(1, t('orders.validation.required')),
                quantity: z
                  .string()
                  .min(1, t('orders.validation.required'))
                  .refine(
                    (value) => /^\d+$/.test(value) && Number(value) >= 1,
                    t('orders.validation.invalidAmount'),
                  ),
              }),
            )
            .min(1, t('orders.validation.lineItemsRequired')),
        })
        .refine((values) => values.customerMode !== 'existing' || values.customerId.length > 0, {
          path: ['customerId'],
          message: t('orders.validation.required'),
        })
        .refine(
          (values) =>
            values.customerMode !== 'new' ||
            (values.newCustomerName.trim().length > 0 && values.newCustomerPhone.trim().length > 0),
          {
            path: ['newCustomerName'],
            message: t('orders.validation.required'),
          },
        ),
    [t],
  )

  const initialCustomerMode =
    draft.customerId && !draft.newCustomer ? 'existing' : draft.newCustomer ? 'new' : 'existing'

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerMode: initialCustomerMode,
      customerId: draft.customerId ?? '',
      newCustomerName: draft.newCustomer?.name ?? draft.customerName ?? '',
      newCustomerPhone: draft.newCustomer?.phone ?? draft.customerPhone ?? '',
      customerName: draft.customerName ?? draft.newCustomer?.name ?? '',
      customerPhone: draft.customerPhone ?? draft.newCustomer?.phone ?? '',
      townshipOrCity: draft.newCustomer?.townshipOrCity ?? '',
      detailedAddress: draft.newCustomer?.detailedAddress ?? '',
      notes: draft.notes ?? '',
      lineItems: draft.lineItems.map((item) => ({
        productId: item.productId,
        quantity: String(item.quantity),
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  })

  const customerMode = form.watch('customerMode')
  const customerId = form.watch('customerId')
  const lineItems = form.watch('lineItems')

  useEffect(() => {
    if (customerMode !== 'existing' || !customerId) {
      return
    }
    const customer = customers.find((entry) => entry.id === customerId)
    if (!customer) {
      return
    }
    form.setValue('customerName', customer.name)
    form.setValue('customerPhone', customer.phone)
    form.setValue('townshipOrCity', customer.townshipOrCity ?? '')
    form.setValue('detailedAddress', customer.detailedAddress ?? '')
  }, [customerId, customerMode, customers, form])

  const lineTotal = lineItems.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId)
    const quantity = Number(item.quantity || 0)
    return sum + (product?.priceMMK ?? 0) * quantity
  }, 0)

  async function onSubmit(values: z.infer<typeof schema>) {
    const payload: ConfirmDraftInput = {
      lineItems: values.lineItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
      notes: values.notes,
      delivery: {
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim(),
        townshipOrCity: values.townshipOrCity.trim(),
        detailedAddress: values.detailedAddress.trim(),
      },
    }

    if (values.customerMode === 'existing') {
      payload.customerId = values.customerId
    } else {
      payload.newCustomer = {
        name: values.newCustomerName.trim(),
        phone: values.newCustomerPhone.trim(),
        townshipOrCity: values.townshipOrCity.trim(),
        detailedAddress: values.detailedAddress.trim(),
      }
    }

    const order = await confirmAiDraft(sessionId, payload)
    onConfirmed(order)
  }

  return (
    <Form {...form}>
      <form className="mt-3 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t('assistant.draftBadge')}</Badge>
          <span className="text-xs text-muted-foreground">
            {t('assistant.confidence')}: {Math.round((draft.confidence ?? 0) * 100)}%
          </span>
        </div>

        <FormField
          control={form.control}
          name="customerMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('assistant.customer')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="existing">{t('assistant.existingCustomer')}</SelectItem>
                  <SelectItem value="new">{t('assistant.newCustomer')}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {customerMode === 'existing' ? (
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('assistant.selectCustomer')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('assistant.selectCustomer')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} · {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="newCustomerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('assistant.customerName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newCustomerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('assistant.customerPhone')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t('assistant.lineItems')}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: products[0]?.id ?? '', quantity: '1' })}
              disabled={products.length === 0}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t('assistant.addLineItem')}
            </Button>
          </div>
          {fields.map((field, index) => {
            const selected = products.find((product) => product.id === lineItems[index]?.productId)
            const draftItem = draft.lineItems[index]
            const availableStock = selected
              ? Math.max(0, selected.stockQty - selected.reservedQty)
              : draftItem?.availableStock ?? 0
            const lowStock =
              selected &&
              selected.lowStockAt !== null &&
              availableStock <= selected.lowStockAt
            const insufficient =
              selected && Number(lineItems[index]?.quantity || 0) > availableStock

            return (
              <div key={field.id} className="rounded-lg border bg-card p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
                  <FormField
                    control={form.control}
                    name={`lineItems.${index}.productId`}
                    render={({ field: productField }) => (
                      <FormItem>
                        <FormLabel className="sr-only">{t('assistant.product')}</FormLabel>
                        <Select value={productField.value} onValueChange={productField.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('assistant.product')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lineItems.${index}.quantity`}
                    render={({ field: quantityField }) => (
                      <FormItem>
                        <FormLabel className="sr-only">{t('assistant.quantity')}</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" {...quantityField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={t('assistant.removeLineItem')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatMMK(selected?.priceMMK ?? draftItem?.unitPriceMMK ?? 0)} ·{' '}
                    {t('assistant.stockAvailable', {
                      count: availableStock,
                    })}
                  </span>
                  {lowStock ? (
                    <Badge variant="warning">{t('products.status.lowStock')}</Badge>
                  ) : null}
                  {insufficient ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t('assistant.insufficientStock')}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('assistant.deliveryName')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('assistant.deliveryPhone')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="townshipOrCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('assistant.township')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="detailedAddress"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('assistant.address')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('assistant.notes')}</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <span>{t('assistant.estimatedTotal')}</span>
          <strong>{formatMMK(lineTotal)}</strong>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('assistant.confirming')}
              </>
            ) : (
              t('assistant.confirmOrder')
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/orders/new">{t('assistant.manualOrder')}</Link>
          </Button>
        </div>
      </form>
    </Form>
  )
}
