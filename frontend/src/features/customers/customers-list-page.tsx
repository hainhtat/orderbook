import { ArrowDownUp, ChevronRight, Phone, Plus, RotateCcw, Search, ShoppingBag, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CustomerForm,
  toCustomerPayload,
} from '@/features/customers/customer-form'
import { useCreateCustomer, useCustomers } from '@/features/customers/use-customers'
import { ApiError } from '@/lib/api-error'
import { formatYangonDate } from '@/lib/date'
import { formatMMK } from '@/lib/format-mmk'

export function CustomersListPage() {
  const { t } = useTranslation('features')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const { data: customers, isLoading, isError, refetch } = useCustomers(debouncedSearch, page, 20)
  const createCustomer = useCreateCustomer()
  const [newestFirst, setNewestFirst] = useState(true)
  const visibleCustomers = newestFirst ? customers : customers ? [...customers].reverse() : customers

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDebouncedSearch(search.trim())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('customers.title')}
          </h1>
          <p className="mt-1 hidden text-muted-foreground sm:block">
            {t('customers.description')}
          </p>
        </div>
        <Button size="icon" className="h-12 w-12 shrink-0 rounded-full" onClick={() => setCreateOpen(true)} aria-label={t('customers.addCustomer')}>
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <form className="relative" onSubmit={handleSearchSubmit}>
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 rounded-full bg-card pl-11"
          placeholder={t('customers.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </form>
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold">{t('customers.count', { count: visibleCustomers?.length ?? 0 })}</p>
        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setNewestFirst((value) => !value)}>
          <ArrowDownUp className="h-4 w-4" />{newestFirst ? t('customers.sortNewest') : t('customers.sortOldest')}
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
          <p className="text-sm text-destructive">{t('customers.loadError')}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void refetch()}
          >
            {t('customers.retry')}
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && customers?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            {debouncedSearch
              ? t('customers.noResultsTitle')
              : t('customers.emptyTitle')}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {debouncedSearch
              ? t('customers.noResultsDescription')
              : t('customers.emptyDescription')}
          </p>
          {!debouncedSearch ? (
            <Button className="mt-6" onClick={() => setCreateOpen(true)}>
              {t('customers.addFirstCustomer')}
            </Button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !isError && visibleCustomers && visibleCustomers.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleCustomers.map((customer) => {
            const lastOrder = customer.lastOrder
            return (
              <article key={customer.id} className="rounded-3xl border bg-card p-4 shadow-sm">
                <Link to={`/customers/${customer.id}`} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{customer.phone}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                {lastOrder ? (
                  <div className="mt-3 rounded-2xl bg-muted/60 p-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="flex items-center gap-1.5"><ShoppingBag className="h-3.5 w-3.5" />{t('customers.lastOrder')}</span>
                      <span className="normal-case">{formatYangonDate(lastOrder.createdAt, { month: 'short', day: 'numeric' })} · {formatMMK(lastOrder.totalMMK)}</span>
                    </div>
                    <p className="mt-2 text-sm">{lastOrder.itemSummary}</p>
                    <Button asChild size="sm" className="mt-3 ml-auto flex w-fit rounded-full">
                      <Link to={`/orders/new?customerId=${customer.id}`}><RotateCcw className="mr-1.5 h-4 w-4" />{t('customers.repeatOrder')}</Link>
                    </Button>
                  </div>
                ) : <p className="mt-3 rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground">{t('customers.noOrders')}</p>}
              </article>
            )
          })}
        </div>
      ) : null}
      {!isLoading && !isError && visibleCustomers && visibleCustomers.length > 0 && (customers as typeof customers & { pagination?: { totalPages: number } }).pagination?.totalPages! > 1 ? <div className="flex items-center justify-between"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm text-muted-foreground">Page {page} of {(customers as typeof customers & { pagination?: { totalPages: number } }).pagination?.totalPages}</span><Button variant="outline" size="sm" disabled={page >= ((customers as typeof customers & { pagination?: { totalPages: number } }).pagination?.totalPages ?? 1)} onClick={() => setPage(page + 1)}>Next</Button></div> : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('customers.createTitle')}</DialogTitle>
            <DialogDescription>
              {t('customers.createDescription')}
            </DialogDescription>
          </DialogHeader>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          <CustomerForm
            isSubmitting={createCustomer.isPending}
            submitLabel={t('customers.createCustomer')}
            onSubmit={async (values) => {
              setServerError(null)
              try {
                await createCustomer.mutateAsync(toCustomerPayload(values))
                toast.success(t('customers.created'))
                setCreateOpen(false)
              } catch (error) {
                if (
                  error instanceof ApiError &&
                  error.status === 409
                ) {
                  return
                }
                setServerError(
                  error instanceof ApiError
                    ? error.message
                    : t('customers.saveError'),
                )
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
