import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common')
  const isMyanmar = i18n.resolvedLanguage === 'my' || i18n.language.startsWith('my')
  const nextLanguage = isMyanmar ? 'en' : 'my'
  const label = t(isMyanmar ? 'switchToEnglish' : 'switchToMyanmar')

  return (
    <Button
      variant="outline"
      size="icon"
      title={label}
      aria-label={label}
      onClick={() => void i18n.changeLanguage(nextLanguage)}
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}
