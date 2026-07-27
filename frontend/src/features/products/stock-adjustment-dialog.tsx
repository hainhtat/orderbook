import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAdjustProductStock } from '@/features/products/use-products'
import { ApiError } from '@/lib/api-error'

type StockAdjustmentDialogProps = {
  productId: string
  currentStock: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockAdjustmentDialog({
  productId,
  currentStock,
  open,
  onOpenChange,
}: StockAdjustmentDialogProps) {
  const { t } = useTranslation('features')
  const adjustStock = useAdjustProductStock(productId)
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = z.object({
    deltaQty: z
      .string()
      .min(1, t('products.validation.required'))
      .refine((value) => /^-?\d+$/.test(value), t('products.validation.invalidAmount')),
    reason: z.string().min(1, t('products.validation.required')),
    note: z.string(),
  })

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      deltaQty: '',
      reason: '',
      note: '',
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset()
      setServerError(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('products.stockDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('products.stockDialog.description', { stock: currentStock })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              setServerError(null)
              try {
                await adjustStock.mutateAsync({
                  deltaQty: Number(values.deltaQty),
                  reason: values.reason.trim(),
                  note: values.note.trim() || undefined,
                })
                handleOpenChange(false)
              } catch (error) {
                if (error instanceof ApiError && error.status === 422) {
                  setServerError(t('products.stockDialog.insufficientStock'))
                  return
                }
                setServerError(
                  error instanceof ApiError
                    ? error.message
                    : t('products.saveError'),
                )
              }
            })}
          >
            <FormField
              control={form.control}
              name="deltaQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.stockDialog.deltaQty')}</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="+10 / -5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.stockDialog.reason')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.stockDialog.note')}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError ? (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t('products.cancel')}
              </Button>
              <Button type="submit" disabled={adjustStock.isPending}>
                {adjustStock.isPending
                  ? t('products.saving')
                  : t('products.stockDialog.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
