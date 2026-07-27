import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { createShopRequest } from '@/features/auth/api'
import { useAuth } from '@/features/auth/auth-provider'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api-error'

export function ShopSetupPage() {
  const { t } = useTranslation('auth')
  const { setShop } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = z.object({
    name: z.string().min(1, t('validation.required')),
    slug: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  })

  type ShopSetupValues = z.infer<typeof schema>

  const form = useForm<ShopSetupValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      phone: '',
      address: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)

    try {
      const shop = await createShopRequest({
        name: values.name,
        slug: values.slug || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
      })
      setShop(shop)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setServerError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : t('validation.required'),
      )
    }
  })

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>{t('shopSetup.title')}</CardTitle>
          <CardDescription>{t('shopSetup.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shopSetup.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shopSetup.slug')}</FormLabel>
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
                    <FormLabel>{t('shopSetup.phone')}</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shopSetup.address')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? t('shopSetup.pending')
                  : t('shopSetup.submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
