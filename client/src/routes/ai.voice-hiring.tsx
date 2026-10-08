import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P27-VoiceHiring'

export const Route = createFileRoute('/ai/voice-hiring')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ screen: 'intro' }} />
}
