import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P44-Scores'

export const Route = createFileRoute('/$p/admin/scores')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ site: 'zu' }} />
}
