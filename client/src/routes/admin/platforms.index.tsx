import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P50-Microsites'

export const Route = createFileRoute('/admin/platforms/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ tab: 'live' }} />
}
