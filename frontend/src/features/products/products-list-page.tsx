import { PackageOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProducts } from '@/features/products/use-products'
import { formatMMK, isLowStock } from '@/lib/format-mmk'

export function ProductsListPage() {
  const { t } = useTranslation('features')
  const { data: products, isLoading, isError, refetch } = useProducts()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('products.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('products.description')}
          </p>
        </div>
        <Button asChild>
          <Link to="/products/new">{t('products.addProduct')}</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{t('products.loadError')}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void refetch()}
          >
            {t('products.retry')}
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && products?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PackageOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            {t('products.emptyTitle')}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {t('products.emptyDescription')}
          </p>
          <Button asChild className="mt-6">
            <Link to="/products/new">{t('products.addFirstProduct')}</Link>
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && products && products.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('products.columns.name')}</TableHead>
                <TableHead>{t('products.columns.sku')}</TableHead>
                <TableHead className="text-right">
                  {t('products.columns.price')}
                </TableHead>
                <TableHead className="text-right">
                  {t('products.columns.stock')}
                </TableHead>
                <TableHead>{t('products.columns.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link
                      to={`/products/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sku}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMMK(product.priceMMK)}
                  </TableCell>
                  <TableCell className="text-right">{product.stockQty}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.isArchived ? (
                        <Badge variant="secondary">
                          {t('products.status.archived')}
                        </Badge>
                      ) : null}
                      {isLowStock(product.stockQty, product.lowStockAt) ? (
                        <Badge variant="warning">
                          {t('products.status.lowStock')}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  )
}
