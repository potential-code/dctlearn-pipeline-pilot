import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/PX-Notifications'
import { requireRole } from '@/session/guards'

export const Route = createFileRoute('/notifications')({
  beforeLoad: requireRole('any'),
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
