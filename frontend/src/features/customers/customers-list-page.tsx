import { Search, Users } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CustomerForm,
  toCustomerPayload,
} from '@/features/customers/customer-form'
import { useCreateCustomer, useCustomers } from '@/features/customers/use-customers'
import { ApiError } from '@/lib/api-error'

export function CustomersListPage() {
  const { t } = useTranslation('features')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const { data: customers, isLoading, isError, refetch } = useCustomers(
    debouncedSearch,
  )
  const createCustomer = useCreateCustomer()

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDebouncedSearch(search.trim())
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('customers.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('customers.description')}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          {t('customers.addCustomer')}
        </Button>
      </div>

      <form className="relative max-w-md" onSubmit={handleSearchSubmit}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('customers.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </form>

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

      {!isLoading && !isError && customers && customers.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customers.columns.name')}</TableHead>
                <TableHead>{t('customers.columns.phone')}</TableHead>
                <TableHead>{t('customers.columns.address')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      to={`/customers/${customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.address || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

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
