import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Microsite from '@/pages/Microsite'
import Employees from '@/pages/P02-Employees'
import Students from '@/pages/P03-Students'

export const Route = createFileRoute('/$p/')({
  component: RouteComponent,
})

/** Microsite landing (P12). The employees and zu landings are the P02 and P03 designs. */
function RouteComponent() {
  const { p } = Route.useParams()
  if (p === 'employees') return <DCPage C={Employees} />
  if (p === 'zu') return <DCPage C={Students} />
  return <DCPage C={Microsite} props={{ site: p, popup: p === 'elevate' }} />
}
