import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P22-SessionRoom'
import { requireRole } from '@/session/guards'
import { useSession } from '@/session/useSession'

export const Route = createFileRoute('/mentoring/session/$bookingId')({
  beforeLoad: requireRole('any'),
  component: RouteComponent,
})

function RouteComponent() {
  const { account } = useSession()
  const role = account?.role === 'mentor' ? 'mentor' : 'learner'
  return <DCPage C={Page} props={{ role, screen: 'ready' }} />
}
