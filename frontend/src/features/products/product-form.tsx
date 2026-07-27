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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Product } from '@/features/products/types'
import { useCategories } from '@/features/products/use-products'

const NONE_CATEGORY = '__none__'

export type ProductFormValues = {
  sku: string
  name: string
  priceMMK: string
  stockQty: string
  lowStockAt: string
  imageUrl: string
  categoryId: string
}

type ProductFormProps = {
  mode: 'create' | 'edit'
  product?: Product
  onSubmit: (values: ProductFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function ProductForm({
  mode,
  product,
  onSubmit,
  isSubmitting = false,
}: ProductFormProps) {
  const { t } = useTranslation('features')
  const { data: categories = [] } = useCategories()

  const schema = useMemo(
    () =>
      z.object({
        sku: z.string().min(1, t('products.validation.required')),
        name: z.string().min(1, t('products.validation.required')),
        priceMMK: z
          .string()
          .min(1, t('products.validation.required'))
          .refine(
            (value) => /^\d+$/.test(value) && Number(value) >= 0,
            t('products.validation.invalidAmount'),
          ),
        stockQty: z
          .string()
          .refine(
            (value) =>
              mode === 'edit' ||
              (value.length > 0 && /^\d+$/.test(value) && Number(value) >= 0),
            mode === 'create'
              ? t('products.validation.required')
              : t('products.validation.invalidAmount'),
          ),
        lowStockAt: z
          .string()
          .refine(
            (value) => value === '' || (/^\d+$/.test(value) && Number(value) >= 0),
            t('products.validation.invalidAmount'),
          ),
        imageUrl: z
          .string()
          .refine(
            (value) => value === '' || z.string().url().safeParse(value).success,
            t('products.validation.invalidUrl'),
          ),
        categoryId: z.string(),
      }),
    [mode, t],
  )

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: product?.sku ?? '',
      name: product?.name ?? '',
      priceMMK: product ? String(product.priceMMK) : '',
      stockQty: product ? String(product.stockQty) : '0',
      lowStockAt:
        product?.lowStockAt !== null && product?.lowStockAt !== undefined
          ? String(product.lowStockAt)
          : '',
      imageUrl: product?.imageUrl ?? '',
      categoryId: product?.categoryId ?? NONE_CATEGORY,
    },
  })

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => onSubmit(values))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('products.fields.name')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('products.fields.sku')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceMMK"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('products.fields.price')}</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {mode === 'create' ? (
            <FormField
              control={form.control}
              name="stockQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.fields.stockQty')}</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="lowStockAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('products.fields.lowStockAt')}</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="—" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('products.fields.category')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('products.fields.categoryPlaceholder')}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE_CATEGORY}>
                      {t('products.fields.noCategory')}
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
            name="imageUrl"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('products.fields.imageUrl')}</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('products.saving')
            : mode === 'create'
              ? t('products.createProduct')
              : t('products.saveChanges')}
        </Button>
      </form>
    </Form>
  )
}

export function toCreateProductPayload(values: ProductFormValues) {
  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    priceMMK: Number(values.priceMMK),
    stockQty: Number(values.stockQty || '0'),
    lowStockAt: values.lowStockAt ? Number(values.lowStockAt) : undefined,
    imageUrl: values.imageUrl.trim() || undefined,
    categoryId:
      values.categoryId === NONE_CATEGORY ? undefined : values.categoryId,
  }
}

export function toUpdateProductPayload(values: ProductFormValues) {
  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    priceMMK: Number(values.priceMMK),
    lowStockAt: values.lowStockAt ? Number(values.lowStockAt) : null,
    imageUrl: values.imageUrl.trim() || null,
    categoryId:
      values.categoryId === NONE_CATEGORY ? null : values.categoryId,
  }
}
