import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P55-Reports'

export const Route = createFileRoute('/admin/microsites')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ site: 'employees' }} />
}
