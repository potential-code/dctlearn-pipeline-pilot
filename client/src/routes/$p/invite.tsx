import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/Auth'

export const Route = createFileRoute('/$p/invite')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ screen: 'invite' }} />
}
