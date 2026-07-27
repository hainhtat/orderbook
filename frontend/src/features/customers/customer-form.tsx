import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
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
import { Textarea } from '@/components/ui/textarea'
import type { Customer } from '@/features/customers/types'
import { ApiError } from '@/lib/api-error'
import { getFieldErrorCode } from '@/lib/api-field-error'

export type CustomerFormValues = {
  name: string
  phone: string
  townshipOrCity: string
  detailedAddress: string
  addressLabel: string
  notes: string
}

type CustomerFormProps = {
  customer?: Customer
  onSubmit: (values: CustomerFormValues) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function CustomerForm({
  customer,
  onSubmit,
  isSubmitting = false,
  submitLabel,
}: CustomerFormProps) {
  const { t } = useTranslation('features')

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('customers.validation.required')),
        phone: z.string().min(1, t('customers.validation.required')),
        townshipOrCity: z.string(),
        detailedAddress: z.string(),
        addressLabel: z.string(),
        notes: z.string(),
      }),
    [t],
  )

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      townshipOrCity: customer?.townshipOrCity ?? '',
      detailedAddress: customer?.detailedAddress ?? '',
      addressLabel: customer?.addressLabel ?? '',
      notes: customer?.notes ?? '',
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        getFieldErrorCode(error, 'phone') === 'DUPLICATE_PHONE'
      ) {
        form.setError('phone', {
          message: t('customers.errors.duplicatePhone'),
        })
        return
      }

      throw error
    }
  })

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('customers.fields.name')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('customers.fields.phone')}</FormLabel>
              <FormControl>
                <Input type="tel" autoComplete="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="townshipOrCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('customers.fields.townshipOrCity')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('customers.fields.addressLabel')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('customers.fields.addressLabelPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="detailedAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('customers.fields.detailedAddress')}</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('customers.fields.notes')}</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('customers.saving')
            : (submitLabel ?? t('customers.save'))}
        </Button>
      </form>
    </Form>
  )
}

export function toCustomerPayload(values: CustomerFormValues) {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    townshipOrCity: values.townshipOrCity.trim() || undefined,
    detailedAddress: values.detailedAddress.trim() || undefined,
    addressLabel: values.addressLabel.trim() || undefined,
    notes: values.notes.trim() || undefined,
  }
}

export function toUpdateCustomerPayload(values: CustomerFormValues) {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    townshipOrCity: values.townshipOrCity.trim() || null,
    detailedAddress: values.detailedAddress.trim() || null,
    addressLabel: values.addressLabel.trim() || null,
    notes: values.notes.trim() || undefined,
  }
}
