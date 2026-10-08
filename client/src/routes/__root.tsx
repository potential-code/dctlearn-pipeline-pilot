import { createRootRoute, Outlet } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import { NavBridge } from '@/app/NavBridge'
import { PrototypeChrome } from '@/app/PrototypeChrome'
import { RouteError } from '@/app/RouteError'
import NotFound from '@/pages/P05-NotFound'

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: () => <DCPage C={NotFound} />,
  errorComponent: RouteError,
})

function Root() {
  return (
    <>
      <NavBridge />
      <PrototypeChrome>
        <Outlet />
      </PrototypeChrome>
    </>
  )
}
