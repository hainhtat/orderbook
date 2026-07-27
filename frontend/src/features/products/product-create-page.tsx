import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ProductForm,
  toCreateProductPayload,
} from '@/features/products/product-form'
import { useCreateProduct } from '@/features/products/use-products'
import { ApiError } from '@/lib/api-error'
import { BackToListLink } from '@/components/back-to-list-link'

export function ProductCreatePage() {
  const { t } = useTranslation('features')
  const navigate = useNavigate()
  const createProduct = useCreateProduct()
  const [serverError, setServerError] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <BackToListLink to="/products" label={t('products.backToList')} />
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('products.createTitle')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('products.createDescription')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('products.formTitle')}</CardTitle>
          <CardDescription>{t('products.formDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {serverError ? (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          <ProductForm
            mode="create"
            isSubmitting={createProduct.isPending}
            onSubmit={async (values) => {
              setServerError(null)
              try {
                const product = await createProduct.mutateAsync(
                  toCreateProductPayload(values),
                )
                toast.success(t('products.created'))
                navigate(`/products/${product.id}`, { replace: true })
              } catch (error) {
                setServerError(
                  error instanceof ApiError
                    ? error.message
                    : t('products.saveError'),
                )
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
