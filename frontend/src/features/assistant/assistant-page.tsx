import { Bot, Loader2, Send, Settings } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AssistantDraftForm } from '@/features/assistant/assistant-draft-form'
import { AssistantMessageContent } from '@/features/assistant/assistant-message-content'
import {
  createAiSession,
  sendAiMessage,
  type AssistantResponseLocale,
  type OrderDraft,
} from '@/features/assistant/api'

export function AssistantPage() {
  const { t } = useTranslation('features')
  const [responseLocale, setResponseLocale] = useState<AssistantResponseLocale | null>(null)
  const [sessionId, setSessionId] = useState<string>()
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState<string | null>(null)
  const [draft, setDraft] = useState<OrderDraft | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string; orderNumber: string } | null>(
    null,
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)

  async function chooseLocale(locale: AssistantResponseLocale) {
    setResponseLocale(locale)
    const session = await createAiSession()
    setSessionId(session.id)
  }

  async function submit() {
    if (!responseLocale || !sessionId || !message.trim()) {
      return
    }

    setPending(true)
    setError(false)
    setReply(null)
    setDraft(null)
    setConfirmedOrder(null)

    try {
      const result = await sendAiMessage(sessionId, message.trim(), responseLocale)
      if ('text' in result) {
        setReply(result.text)
      } else {
        setDraft(result)
      }
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold">
          <Bot className="h-7 w-7" />
          {t('assistant.title')}
        </h1>
        <p className="mt-2 leading-7 text-muted-foreground">{t('assistant.description')}</p>
      </div>

      {responseLocale === null ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="font-medium">{t('assistant.languagePrompt')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('assistant.languageHint')}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => void chooseLocale('en')}>
                {t('assistant.languageEn')}
              </Button>
              <Button variant="outline" onClick={() => void chooseLocale('my')}>
                {t('assistant.languageMy')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Textarea
              rows={7}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t('assistant.placeholder')}
            />
            <Button
              className="w-full sm:w-auto"
              disabled={pending || !message.trim()}
              onClick={() => void submit()}
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('assistant.thinking')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('assistant.createDraft')}
                </>
              )}
            </Button>
            {error ? (
              <div role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
                {t('assistant.errorGeneric')}{' '}
                <Link className="underline" to="/settings">
                  <Settings className="mr-1 inline h-4 w-4" />
                  {t('assistant.settings')}
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {reply ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('assistant.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AssistantMessageContent text={reply} />
          </CardContent>
        </Card>
      ) : null}

      {draft && sessionId && !confirmedOrder ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('assistant.draftTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">{t('assistant.draftReady')}</p>
            <AssistantDraftForm
              sessionId={sessionId}
              draft={draft}
              onConfirmed={(order) => setConfirmedOrder(order)}
            />
          </CardContent>
        </Card>
      ) : null}

      {confirmedOrder ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <p className="text-sm">{t('assistant.orderCreated', { orderNumber: confirmedOrder.orderNumber })}</p>
            <Button asChild>
              <Link to={`/orders/${confirmedOrder.id}`}>{t('assistant.viewOrder', { orderNumber: confirmedOrder.orderNumber })}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
