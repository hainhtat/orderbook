import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdateAiConfig, useAiConfig } from '@/features/assistant/use-ai-config'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PwaInstallSettingsAction } from '@/components/pwa-install-prompt'
import { ApiError } from '@/lib/api-error'

export function SettingsPage() {
  const { t } = useTranslation('pages')
  const { state, setShop } = useAuth()
  const { data: aiConfig } = useAiConfig()
  const updateAiConfig = useUpdateAiConfig()

  const schema = z.object({
    name: z.string().min(1, t('settings.shopName')),
    slug: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    logoUrl: z.string().url(t('settings.logoUrlInvalid')).optional().or(z.literal('')),
    receiptFooter: z.string().max(200).optional(),
    orderNumberPrefix: z
      .string()
      .max(12, t('settings.orderNumberPrefixInvalid'))
      .regex(/^[a-z0-9]*$/i, t('settings.orderNumberPrefixInvalid')),
  })

  type SettingsFormValues = z.infer<typeof schema>

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      phone: '',
      address: '',
      logoUrl: '',
      receiptFooter: 'Thank you for your order.',
      orderNumberPrefix: '',
    },
  })

  useEffect(() => {
    if (state.status === 'authenticated' && state.shop) {
      form.reset({
        name: state.shop.name,
        slug: state.shop.slug,
        phone: state.shop.phone ?? '',
        address: state.shop.address ?? '',
        logoUrl: state.shop.logoUrl ?? '',
        receiptFooter: state.shop.receiptFooter ?? 'Thank you for your order.',
        orderNumberPrefix: state.shop.orderNumberPrefix ?? '',
      })
    }
  }, [form, state])

  const onSubmit = form.handleSubmit(async (values) => {
    const orderNumberPrefix = values.orderNumberPrefix.trim().toLowerCase()
    try {
      const shop = await updateCurrentShopRequest({
        name: values.name,
        slug: values.slug || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        logoUrl: values.logoUrl || undefined,
        receiptFooter: values.receiptFooter?.trim() || 'Thank you for your order.',
        orderNumberPrefix,
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
                name="logoUrl"
                render={({ field }) => (
                  <FormItem><FormLabel>{t('settings.logoUrl')}</FormLabel><FormControl><Input type="url" placeholder="https://…" {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="receiptFooter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.receiptFooter')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('settings.receiptFooterPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderNumberPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.orderNumberPrefix')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('settings.orderNumberPrefixPlaceholder')}
                        autoComplete="off"
                        spellCheck={false}
                        {...field}
                        onBlur={() => {
                          field.onBlur()
                          form.setValue(
                            'orderNumberPrefix',
                            field.value.trim().toLowerCase(),
                            { shouldValidate: true, shouldDirty: true },
                          )
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('settings.orderNumberPrefixHelp')}
                    </FormDescription>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.aiTitle')}</CardTitle>
          <CardDescription>{t('settings.aiDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!aiConfig?.hasApiKey ? (
            <p className="text-sm text-muted-foreground">{t('settings.aiOperatorManaged')}</p>
          ) : (
            <>
              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="font-medium">{t('settings.aiEnabled')}</p>
                  <p className="text-sm text-muted-foreground">
                    {aiConfig.provider}
                    {aiConfig.model ? ` · ${aiConfig.model}` : ''}
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={aiConfig.isEnabled}
                  disabled={!aiConfig.canToggle}
                  onChange={(event) => {
                    void updateAiConfig(event.target.checked)
                      .then(() => toast.success(t('settings.aiSaved')))
                      .catch((error) =>
                        toast.error(
                          error instanceof ApiError || error instanceof Error
                            ? error.message
                            : t('settings.aiSaveError'),
                        ),
                      )
                  }}
                />
              </label>
              {!aiConfig.canToggle ? (
                <p className="text-sm text-muted-foreground">{t('settings.aiOperatorManaged')}</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.pwaTitle')}</CardTitle>
          <CardDescription>{t('settings.pwaDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <PwaInstallSettingsAction />
        </CardContent>
      </Card>
    </div>
  )
}
