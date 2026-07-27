import { LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function DashboardPage() {
  const { t } = useTranslation('pages')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('dashboard.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('dashboard.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
            {t('dashboard.emptyTitle')}
          </CardTitle>
          <CardDescription>{t('dashboard.emptyDescription')}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  )
}
