import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/theme/theme-provider'

export function ModeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation('common')
  const label = t(theme === 'dark' ? 'switchToLightTheme' : 'switchToDarkTheme')

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      title={label}
      aria-label={label}
      onClick={toggleTheme}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}
