import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'

export function PwaUpdatePrompt() {
  const { t } = useTranslation('common')
  const toastShown = useRef(false)

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        if (toastShown.current) {
          return
        }
        toastShown.current = true
        toast.message(t('pwa.updateAvailable'), {
          duration: Infinity,
          action: {
            label: t('pwa.reload'),
            onClick: () => {
              void update(true)
            },
          },
        })
      },
    })

    return () => {
      toastShown.current = false
    }
  }, [t])

  return null
}
