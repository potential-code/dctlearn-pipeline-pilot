import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P36-CreateMicrosite'

export const Route = createFileRoute('/admin/platforms/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ step: '1' }} />
}
