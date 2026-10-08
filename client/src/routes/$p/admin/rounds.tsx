import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P41-Rounds'

export const Route = createFileRoute('/$p/admin/rounds')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ site: 'zu' }} />
}
