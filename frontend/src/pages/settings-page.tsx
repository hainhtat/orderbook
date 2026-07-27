import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { updateCurrentShopRequest } from '@/features/auth/api'
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

export function SettingsPage() {
  const { t } = useTranslation('pages')
  const { state, setShop } = useAuth()

  const schema = z.object({
    name: z.string().min(1, t('settings.shopName')),
    slug: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  })

  type SettingsFormValues = z.infer<typeof schema>

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      phone: '',
      address: '',
    },
  })

  useEffect(() => {
    if (state.status === 'authenticated' && state.shop) {
      form.reset({
        name: state.shop.name,
        slug: state.shop.slug,
        phone: state.shop.phone ?? '',
        address: state.shop.address ?? '',
      })
    }
  }, [form, state])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const shop = await updateCurrentShopRequest({
        name: values.name,
        slug: values.slug || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
      })
      setShop(shop)
      toast.success(t('settings.saved'))
    } catch (error) {
      toast.error(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : t('settings.save'),
      )
    }
  })

  if (state.status !== 'authenticated' || !state.shop) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('settings.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.shopSection')}</CardTitle>
          <CardDescription>{t('settings.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.shopName')}</FormLabel>
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
                    <FormLabel>{t('settings.shopSlug')}</FormLabel>
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
                    <FormLabel>{t('settings.shopPhone')}</FormLabel>
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
                    <FormLabel>{t('settings.shopAddress')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? t('settings.saving')
                  : t('settings.save')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
