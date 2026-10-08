// Global design CSS first, so page CSS (scoped, loaded with each route) wins ties, as in the artboards.
import './styles/dct-ds.css'
import './styles/portal.css'
import './styles/motion.css'
import './styles/prototype.css'
import './styles/base.css'
import './styles/fixes.css'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { SessionProvider } from '@/session/SessionProvider'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: false })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('#root missing')
createRoot(root).render(
  <LocaleProvider>
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  </LocaleProvider>,
)
