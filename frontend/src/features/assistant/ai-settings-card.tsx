import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchAiConfig, saveAiConfig } from './api'

export function AiSettingsCard() {
  const { t } = useTranslation('pages')
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['ai', 'config'], queryFn: fetchAiConfig })
  const [provider, setProvider] = useState('OPENAI'); const [model, setModel] = useState(''); const [apiKey, setApiKey] = useState(''); const [enabled, setEnabled] = useState(false)
  useEffect(() => { if (query.data) { setProvider(query.data.provider); setModel(query.data.model ?? ''); setEnabled(query.data.isEnabled) } }, [query.data])
  const mutation = useMutation({ mutationFn: saveAiConfig, onSuccess: (config) => { queryClient.setQueryData(['ai', 'config'], config); setApiKey(''); toast.success(t('settings.aiSaved')) }, onError: () => toast.error(t('settings.aiSaveError')) })
  return <Card><CardHeader><CardTitle className="text-lg">{t('settings.aiTitle')}</CardTitle><CardDescription>{t('settings.aiDescription')}</CardDescription></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ provider, model: model || undefined, apiKey: apiKey || undefined, isEnabled: enabled }) }}>
    <label className="space-y-2 text-sm font-medium">{t('settings.aiProvider')}<select className="flex h-10 w-full rounded-md border bg-background px-3" value={provider} onChange={(e) => setProvider(e.target.value)}><option>OPENAI</option><option>ANTHROPIC</option><option>DEEPSEEK</option><option>OTHER</option></select></label>
    <label className="space-y-2 text-sm font-medium">{t('settings.aiModel')}<Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4.1-mini" /></label>
    <label className="space-y-2 text-sm font-medium sm:col-span-2">{t('settings.aiApiKey')}<Input type="password" autoComplete="new-password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={query.data?.hasApiKey ? t('settings.aiKeySaved') : t('settings.aiKeyPlaceholder')} /></label>
    <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />{t('settings.aiEnabled')}</label>
    <Button className="sm:w-fit" disabled={mutation.isPending || query.isLoading}>{mutation.isPending ? t('settings.saving') : t('settings.aiSave')}</Button>
  </form></CardContent></Card>
}
