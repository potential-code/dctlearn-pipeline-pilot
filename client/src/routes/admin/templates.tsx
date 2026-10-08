import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P37-Templates'

export const Route = createFileRoute('/admin/templates')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ preview: 'none' }} />
}
