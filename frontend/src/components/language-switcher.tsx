import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('language')}>
          <Languages className="h-4 w-4" />
          <span className="sr-only">{t('language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void i18n.changeLanguage('en')}>
          {t('english')}
          {i18n.language === 'en' ? (
            <span className="ml-auto text-xs">✓</span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void i18n.changeLanguage('my')}>
          {t('myanmar')}
          {i18n.language === 'my' ? (
            <span className="ml-auto text-xs">✓</span>
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
