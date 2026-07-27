import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type BackToListLinkProps = {
  to: string
  label: string
}

export function BackToListLink({ to, label }: BackToListLinkProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className="mb-4 min-h-11 gap-2 rounded-xl px-4 font-semibold shadow-sm"
    >
      <Link to={to}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label}
      </Link>
    </Button>
  )
}
