import { createFileRoute, notFound } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { DCPage } from '@/app/DCPage'
import Buttons from '@/pages/Buttons'
import Cards from '@/pages/Cards'
import Data from '@/pages/Data'
import Feedback from '@/pages/Feedback'
import Forms from '@/pages/Forms'
import Landing from '@/pages/Landing'
import Learning from '@/pages/Learning'
import Main from '@/pages/Main'
import Shell from '@/pages/Shell'
import ShellMobile from '@/pages/ShellMobile'

/** The canvas's design-system boards, as dev-only reference pages (/design/<board>). */
const BOARDS: Record<string, ComponentType<Record<string, unknown>>> = {
  foundations: Main,
  buttons: Buttons,
  forms: Forms,
  shell: Shell,
  'shell-mobile': ShellMobile,
  cards: Cards,
  data: Data,
  feedback: Feedback,
  landing: Landing,
  learning: Learning,
}

export const Route = createFileRoute('/design/$board')({
  beforeLoad: ({ params }) => {
    if (!import.meta.env.DEV || !BOARDS[params.board]) throw notFound()
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { board } = Route.useParams()
  const C = BOARDS[board]
  return C ? <DCPage C={C} /> : null
}
