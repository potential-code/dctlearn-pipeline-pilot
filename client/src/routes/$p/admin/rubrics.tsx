import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P43-Rubrics'

export const Route = createFileRoute('/$p/admin/rubrics')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ site: 'zu' }} />
}
