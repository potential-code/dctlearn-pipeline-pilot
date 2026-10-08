import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireRole } from '@/session/guards'

export const Route = createFileRoute('/judge')({
  beforeLoad: requireRole(['judge']),
  component: Outlet,
})
