import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P26-LessonPlanner'

export const Route = createFileRoute('/$p/_portal/ai/lesson-planner')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, screen: 'empty' }} />
}
