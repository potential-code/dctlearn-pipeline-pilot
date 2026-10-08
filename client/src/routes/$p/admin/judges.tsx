import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P42-Judges'

export const Route = createFileRoute('/$p/admin/judges')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ site: 'zu' }} />
}
