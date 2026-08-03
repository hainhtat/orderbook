import { ArrowDownUp, Box, PackageOpen, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { useProducts } from '@/features/products/use-products'
import type { Product } from '@/features/products/types'
import { formatMMK, isLowStock } from '@/lib/format-mmk'
import { cn } from '@/lib/utils'

type ProductTab = 'all' | 'needsRestock'

type ProductsWithPagination = Product[] & {
  pagination?: { totalPages: number }
}

const RESTOCK_PAGE_SIZE = 100

export function ProductsListPage() {
  const { t } = useTranslation('features')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<ProductTab>('all')
  const needsRestock = tab === 'needsRestock'
  const pageSize = needsRestock ? RESTOCK_PAGE_SIZE : 20
  const { data: products, isLoading, isError, refetch } = useProducts(
    false,
    page,
    pageSize,
    needsRestock,
  )
  const [newestFirst, setNewestFirst] = useState(true)
  const pagination = (products as ProductsWithPagination | undefined)?.pagination
  const visibleProducts = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase()
    const filtered =
      products?.filter(
        (product) =>
          !normalized ||
          product.name.toLocaleLowerCase().includes(normalized) ||
          product.sku.toLocaleLowerCase().includes(normalized),
      ) ?? []
    return newestFirst ? filtered : [...filtered].reverse()
  }, [newestFirst, products, search])

  function switchTab(next: ProductTab) {
    if (next === tab) return
    setTab(next)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('products.title')}
          </h1>
          <p className="mt-1 hidden text-muted-foreground sm:block">
            {t('products.description')}
          </p>
        </div>
        <Button asChild size="icon" className="h-12 w-12 shrink-0 rounded-full" aria-label={t('products.addProduct')}>
          <Link to="/products/new"><Plus className="h-6 w-6" /></Link>
        </Button>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-12 rounded-full bg-card pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('products.searchPlaceholder')} />
        </div>
        <div
          className="flex w-fit gap-1 rounded-full bg-muted p-1"
          role="tablist"
          aria-label={t('products.title')}
        >
          <Button
            type="button"
            role="tab"
            aria-selected={tab === 'all'}
            size="sm"
            variant={tab === 'all' ? 'default' : 'ghost'}
            className={cn('rounded-full', tab !== 'all' && 'text-muted-foreground')}
            onClick={() => switchTab('all')}
          >
            {t('products.tabs.all')}
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={tab === 'needsRestock'}
            size="sm"
            variant={tab === 'needsRestock' ? 'default' : 'ghost'}
            className={cn('rounded-full', tab !== 'needsRestock' && 'text-muted-foreground')}
            onClick={() => switchTab('needsRestock')}
          >
            {t('products.tabs.needsRestock')}
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold">{t('products.count', { count: visibleProducts.length })}</p>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setNewestFirst((value) => !value)}>
            <ArrowDownUp className="h-4 w-4" />{newestFirst ? t('products.sortNewest') : t('products.sortOldest')}
          </Button>
        </div>
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

      {!isLoading && !isError && products?.length === 0 && !needsRestock ? (
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

      {!isLoading && !isError && products?.length === 0 && needsRestock ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PackageOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            {t('products.emptyRestockTitle')}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {t('products.emptyRestockDescription')}
          </p>
        </div>
      ) : null}

      {!isLoading && !isError && products && products.length > 0 && pagination?.totalPages! > 1 ? (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination?.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= (pagination?.totalPages ?? 1)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && products && products.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleProducts.map((product) => {
            const available = Math.max(0, product.stockQty - product.reservedQty)
            const neededQty = product.preorderNeededQty ?? 0
            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="flex items-center gap-4 rounded-3xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <Box className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{formatMMK(product.priceMMK)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {needsRestock ? (
                      <>
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400">
                          {t('products.needUnits', { count: neededQty })}
                        </Badge>
                        <Badge variant="secondary">
                          {t('products.openPreorderQty', { count: product.openPreorderQty ?? 0 })}
                        </Badge>
                        <Badge variant="secondary">
                          {t('products.stockOnHand', { count: product.stockQty })}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          {t('products.sold', { count: product.soldQuantity })}
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {t('products.revenue', { amount: formatMMK(product.salesRevenueMMK) })}
                        </Badge>
                        <Badge variant="secondary">{t('products.available', { count: available })}</Badge>
                        {neededQty > 0 ? (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400">
                            {t('products.preorderNeed', { count: neededQty })}
                          </Badge>
                        ) : null}
                        {product.isArchived ? (
                          <Badge variant="secondary">{t('products.status.archived')}</Badge>
                        ) : null}
                        {isLowStock(available, product.lowStockAt) ? (
                          <Badge variant="warning">{t('products.status.lowStock')}</Badge>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xl text-muted-foreground">›</span>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
