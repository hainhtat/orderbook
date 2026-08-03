import { Bot, Send, Settings, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createAiSession, sendAiMessage, type OrderDraft } from './api'

export function AssistantPage() {
  const { t } = useTranslation('features'); const [message, setMessage] = useState(''); const [draft, setDraft] = useState<OrderDraft | null>(null); const [pending, setPending] = useState(false); const [error, setError] = useState(false)
  async function submit() { if (!message.trim()) return; setPending(true); setError(false); try { const session = await createAiSession(); const result = await sendAiMessage(session.id, message.trim()); if ('text' in result) setError(true); else setDraft(result) } catch { setError(true) } finally { setPending(false) } }
  return <div className="mx-auto max-w-3xl space-y-5"><div><h1 className="flex items-center gap-2 text-3xl font-semibold"><Bot className="h-7 w-7" />{t('assistant.title')}</h1><p className="mt-2 leading-7 text-muted-foreground">{t('assistant.description')}</p></div>
    <Card><CardContent className="space-y-3 pt-6"><Textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('assistant.placeholder')} /><Button className="w-full sm:w-auto" disabled={pending || !message.trim()} onClick={() => void submit()}><Send className="mr-2 h-4 w-4" />{pending ? t('assistant.working') : t('assistant.createDraft')}</Button>{error ? <div role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{t('assistant.error')} <Link className="underline" to="/settings"><Settings className="mr-1 inline h-4 w-4" />{t('assistant.settings')}</Link></div> : null}</CardContent></Card>
    {draft ? <Card><CardHeader><CardTitle>{t('assistant.draftTitle')}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl bg-muted p-4 text-sm"><p>{t('assistant.customer')}: {draft.customerId ?? draft.newCustomer?.name ?? t('assistant.newCustomer')}</p><p>{t('assistant.confidence')}: {Math.round((draft.confidence ?? 0) * 100)}%</p></div><div className="space-y-2">{draft.lineItems.map((item, index) => <div key={`${item.productId}-${index}`} className="flex justify-between rounded-xl border p-3 text-sm"><span>{item.productId}</span><strong>× {item.quantity}</strong></div>)}</div>{draft.notes ? <p className="text-sm text-muted-foreground">{draft.notes}</p> : null}<Button asChild><Link to="/orders/new" onClick={() => sessionStorage.setItem('assistant-order-draft', JSON.stringify(draft))}><ShoppingCart className="mr-2 h-4 w-4" />{t('assistant.reviewOrder')}</Link></Button></CardContent></Card> : null}
  </div>
}
