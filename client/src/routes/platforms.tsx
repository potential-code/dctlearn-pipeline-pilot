import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P13-Hubs'
import { requireRole } from '@/session/guards'

export const Route = createFileRoute('/platforms')({
  beforeLoad: requireRole('any'),
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
