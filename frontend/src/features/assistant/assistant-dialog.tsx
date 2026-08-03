import { Bot, Loader2, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AssistantDraftForm } from '@/features/assistant/assistant-draft-form'
import { AssistantMessageContent } from '@/features/assistant/assistant-message-content'
import {
  createAiSession,
  sendAiMessage,
  type AssistantResponseLocale,
  type OrderDraft,
} from '@/features/assistant/api'

type ChatLine = {
  role: 'user' | 'assistant'
  text: string
  draft?: OrderDraft
  orderLink?: { id: string; orderNumber: string }
  isError?: boolean
}

export function AssistantDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('features')
  const [sessionId, setSessionId] = useState<string>()
  const [responseLocale, setResponseLocale] = useState<AssistantResponseLocale | null>(null)
  const [text, setText] = useState('')
  const [lines, setLines] = useState<ChatLine[]>([])
  const [pending, setPending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && !sessionId) {
      void createAiSession()
        .then((session) => setSessionId(session.id))
        .catch(() => undefined)
    }
  }, [open, sessionId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines, pending, responseLocale])

  function resetSession() {
    setSessionId(undefined)
    setResponseLocale(null)
    setLines([])
    setText('')
    setPending(false)
  }

  function close(value: boolean) {
    if (!value) {
      resetSession()
    }
    onOpenChange(value)
  }

  function chooseLocale(locale: AssistantResponseLocale) {
    setResponseLocale(locale)
    setLines([
      {
        role: 'assistant',
        text: t(locale === 'my' ? 'assistant.greetingMy' : 'assistant.greetingEn'),
      },
    ])
  }

  async function send(retryContent?: string) {
    if (!sessionId || !responseLocale || pending) {
      return
    }

    const content = (retryContent ?? text).trim()
    if (!content) {
      return
    }

    if (!retryContent) {
      setText('')
      setLines((current) => [...current, { role: 'user', text: content }])
    }
    setPending(true)

    try {
      const result = await sendAiMessage(sessionId, content, responseLocale)
      if ('text' in result) {
        setLines((current) => [...current, { role: 'assistant', text: result.text }])
      } else {
        setLines((current) => [
          ...current,
          {
            role: 'assistant',
            text: t('assistant.draftReady'),
            draft: result,
          },
        ])
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('assistant.errorGeneric')
      setLines((current) => [...current, { role: 'assistant', text: message, isError: true }])
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex h-[min(720px,calc(100dvh-2rem))] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t('assistant.title')}
          </DialogTitle>
          <DialogDescription>{t('assistant.chatDescription')}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
          {responseLocale === null ? (
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-sm font-medium">{t('assistant.languagePrompt')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('assistant.languageHint')}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => chooseLocale('en')}>
                  {t('assistant.languageEn')}
                </Button>
                <Button variant="outline" onClick={() => chooseLocale('my')}>
                  {t('assistant.languageMy')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {lines.map((line, index) => (
                <div
                  key={index}
                  className={
                    line.role === 'user'
                      ? 'ml-8 rounded-2xl rounded-br-sm bg-primary p-3 text-sm text-primary-foreground'
                      : 'mr-8 rounded-2xl rounded-bl-sm border bg-card p-3'
                  }
                >
                  {line.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{line.text}</p>
                  ) : (
                    <>
                      <AssistantMessageContent text={line.text} />
                      {line.isError ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const lastUser = [...lines]
                                .slice(0, index)
                                .reverse()
                                .find((entry) => entry.role === 'user')
                              if (lastUser) {
                                void send(lastUser.text)
                              }
                            }}
                          >
                            {t('assistant.retry')}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" asChild>
                            <Link to="/orders/new">{t('assistant.manualOrder')}</Link>
                          </Button>
                        </div>
                      ) : null}
                      {line.orderLink ? (
                        <Button type="button" size="sm" className="mt-3" asChild>
                          <Link to={`/orders/${line.orderLink.id}`} onClick={() => close(false)}>
                            {t('assistant.viewOrder', { orderNumber: line.orderLink.orderNumber })}
                          </Link>
                        </Button>
                      ) : null}
                      {line.draft && sessionId ? (
                        <AssistantDraftForm
                          sessionId={sessionId}
                          draft={line.draft}
                          onConfirmed={(order) => {
                            setLines((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? {
                                      ...entry,
                                      draft: undefined,
                                      text: t('assistant.orderCreated', {
                                        orderNumber: order.orderNumber,
                                      }),
                                      orderLink: order,
                                    }
                                  : entry,
                              ),
                            )
                          }}
                        />
                      ) : null}
                    </>
                  )}
                </div>
              ))}

              {pending ? (
                <div className="mr-8 flex items-center gap-2 rounded-2xl border bg-card p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{t('assistant.thinking')}</span>
                </div>
              ) : null}
            </>
          )}

          <div ref={endRef} />
        </div>

        <div className="border-t bg-card p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
              rows={2}
              disabled={responseLocale === null || pending}
              placeholder={t('assistant.placeholder')}
              className="max-h-32 resize-none"
            />
            <Button
              size="icon"
              disabled={responseLocale === null || pending || !text.trim()}
              onClick={() => void send()}
              aria-label={t('assistant.send')}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
