import type { Microsite } from '@server/db/schema/microsites'
import type { Role } from '@shared/roles'

declare global {
  namespace Express {
    interface Request {
      /** Raw JSON body, kept only for /api/webhooks/* signature checks. */
      rawBody?: string
    }

    interface Locals {
      requestId: string
      /** The signed-in user, read from the database on every request (null when signed out). */
      viewer: Viewer | null
      /** Set when the session belongs to a disabled account (requireAuth answers 403). */
      viewerDisabled?: boolean
      /** Set by requireMember / requireSubAdmin. */
      microsite?: Microsite
    }
  }

  type Viewer = {
    id: string
    name: string
    email: string
    role: Role
    status: 'active' | 'disabled' | 'invited'
    emailVerified: boolean
    locale: 'en' | 'ar'
    image: string | null
    sessionId: string
    ip: string
  }
}
