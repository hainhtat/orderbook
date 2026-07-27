import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ProductForm,
  toUpdateProductPayload,
} from '@/features/products/product-form'
import { StockAdjustmentDialog } from '@/features/products/stock-adjustment-dialog'
import {
  useArchiveProduct,
  useProduct,
  useUpdateProduct,
} from '@/features/products/use-products'
import { ApiError } from '@/lib/api-error'
import { formatMMK, isLowStock } from '@/lib/format-mmk'

export function ProductDetailPage() {
  const { t } = useTranslation('features')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading, isError, refetch } = useProduct(id)
  const updateProduct = useUpdateProduct(id ?? '')
  const archiveProduct = useArchiveProduct()
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{t('products.loadError')}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => void refetch()}>
            {t('products.retry')}
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/products">{t('products.backToList')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/products">{t('products.backToList')}</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="mt-2 text-muted-foreground">{product.sku}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!product.isArchived ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStockDialogOpen(true)}
                >
                  {t('products.adjustStock')}
                </Button>
                <Button
                  variant="destructive"
                  disabled={archiveProduct.isPending}
                  onClick={async () => {
                    try {
                      await archiveProduct.mutateAsync(product.id)
                      toast.success(t('products.archived'))
                      navigate('/products')
                    } catch (error) {
                      toast.error(
                        error instanceof ApiError
                          ? error.message
                          : t('products.saveError'),
                      )
                    }
                  }}
                >
                  {t('products.archive')}
                </Button>
              </>
            ) : (
              <Badge variant="secondary">{t('products.status.archived')}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('products.detail.price')}</CardDescription>
            <CardTitle className="text-2xl">
              {formatMMK(product.priceMMK)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('products.detail.stock')}</CardDescription>
            <CardTitle className="text-2xl">{product.stockQty}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('products.detail.reserved', { count: product.reservedQty })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('products.detail.alerts')}</CardDescription>
            <CardTitle className="text-base font-medium">
              {isLowStock(product.stockQty, product.lowStockAt) ? (
                <Badge variant="warning">{t('products.status.lowStock')}</Badge>
              ) : (
                <span className="text-muted-foreground">
                  {t('products.detail.noAlerts')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {!product.isArchived ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('products.editTitle')}</CardTitle>
            <CardDescription>{t('products.editDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {serverError ? (
              <p className="mb-4 text-sm text-destructive" role="alert">
                {serverError}
              </p>
            ) : null}
            <ProductForm
              key={product.id}
              mode="edit"
              product={product}
              isSubmitting={updateProduct.isPending}
              onSubmit={async (values) => {
                setServerError(null)
                try {
                  await updateProduct.mutateAsync(toUpdateProductPayload(values))
                  toast.success(t('products.updated'))
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
      ) : null}

      <StockAdjustmentDialog
        productId={product.id}
        currentStock={product.stockQty}
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
      />
    </div>
  )
}
