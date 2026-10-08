import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P34-Applicants'

export const Route = createFileRoute('/judge/applicants')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
