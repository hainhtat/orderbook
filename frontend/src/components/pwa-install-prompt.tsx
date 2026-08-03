import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    setInstalled(media.matches)

    function handleBeforeInstall(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function handleInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function install() {
    if (!deferredPrompt) {
      return
    }
    await deferredPrompt.prompt()
    setDeferredPrompt(null)
  }

  return {
    canInstall: Boolean(deferredPrompt) && !installed,
    install,
  }
}

export function PwaInstallPrompt() {
  const { t } = useTranslation('common')
  const { canInstall, install } = usePwaInstallPrompt()

  if (!canInstall) {
    return null
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void install()}>
      <Download className="mr-2 h-4 w-4" />
      {t('pwa.install')}
    </Button>
  )
}

export function PwaInstallSettingsAction() {
  const { t } = useTranslation('pages')
  const { t: tc } = useTranslation('common')
  const { canInstall, install } = usePwaInstallPrompt()

  if (!canInstall) {
    return <p className="text-sm text-muted-foreground">{t('settings.pwaInstalledHint')}</p>
  }

  return (
    <Button type="button" onClick={() => void install()}>
      <Download className="mr-2 h-4 w-4" />
      {tc('pwa.install')}
    </Button>
  )
}
