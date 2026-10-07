import { auth } from '@server/auth/auth'
import { CLIENT_IP_HEADER } from '@server/auth/internal'
import { clientIp } from '@server/lib/client-ip'
import type { RouteContext } from '@server/lib/route'
import { acceptInvitation, viewInvitation } from '@server/services/identity/invitation.service'
import { getMe } from '@server/services/identity/me.service'
import {
  inspectPasswordToken,
  registerEmployee,
} from '@server/services/identity/registration.service'
import type { EmployeeRegistration, InvitationAccept } from '@shared/schemas/identity'
import type { z } from 'zod'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>

export const register = ({ body }: Ctx<unknown, unknown, z.infer<typeof EmployeeRegistration>>) =>
  registerEmployee(body)

export const passwordToken = ({ params }: Ctx<{ token: string }>) =>
  inspectPasswordToken(params.token)

export const getInvitation = ({ params }: Ctx<{ token: string }>) => viewInvitation(params.token)

/** Accepts, then signs the new or existing account in (cookie on this response). */
export const accept = async ({
  params,
  body,
  req,
  res,
}: Ctx<{ token: string }, unknown, z.infer<typeof InvitationAccept>>) => {
  const ip = clientIp(req)
  const { userId, email } = await acceptInvitation(params.token, body, ip)
  const signIn = await auth.api.signInEmail({
    body: { email, password: body.password },
    headers: new Headers({ [CLIENT_IP_HEADER]: ip, 'user-agent': req.headers['user-agent'] ?? '' }),
    asResponse: true,
  })
  const cookies = signIn.headers.getSetCookie()
  if (cookies.length) res.append('Set-Cookie', cookies)
  const me = await getMe({ id: userId } as Viewer)
  return { userId, defaultRoute: me.defaultRoute }
}
