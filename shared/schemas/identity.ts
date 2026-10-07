import { z } from 'zod'
import { email, locale, MicrositeRef, password, personName, UserDto, uuid } from './common'

/** P06 `GET /api/me?from={p}` */
export const MeQuery = z.object({
  from: z
    .string()
    .regex(/^[a-z0-9-]{2,40}$/)
    .optional(),
})
export const MeResponse = z.strictObject({
  user: UserDto,
  microsites: z.array(MicrositeRef.extend({ role: z.enum(['learner', 'sub_admin']) }).strict()),
  mustSetPassword: z.boolean(),
  defaultRoute: z.string(),
  accessDenied: z.strictObject({ microsite: MicrositeRef, canJoin: z.boolean() }).optional(),
})

/** P13 */
export const MyMicrositesResponse = z.strictObject({
  items: z.array(
    MicrositeRef.extend({
      subtitle: z.strictObject({ en: z.string(), ar: z.string() }),
      features: z.array(
        z.enum(['courses', 'workshops', 'mentors', 'ai_coaches', 'ai_tools', 'resources']),
      ),
      progressPct: z.number(),
      lastVisitedAt: z.string().optional(),
    }).strict(),
  ),
})

/** P15 */
const profileFields = {
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  country: z.string().trim().max(80),
  position: z.string().trim().max(120),
  department: z.string().trim().max(120),
  employmentType: z.string().trim().max(80),
  seniorityLevel: z.string().trim().max(80),
  preferredLanguage: locale,
  linkedinUrl: z.union([
    z.literal(''),
    z
      .string()
      .max(2048)
      .pipe(z.url({ protocol: /^https$/ })),
  ]),
  mobile: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+0-9 ()-]*$/, 'Digits, spaces, + ( ) - only'),
}
export const ProfileUpdate = z.object(profileFields).partial()
export const ProfileResponse = z.strictObject({
  user: UserDto,
  profile: z.strictObject(profileFields),
  readOnly: z.strictObject({
    employeeId: z.string().optional(),
    sector: z.string().optional(),
    hireDate: z.string().optional(),
  }),
  microsites: z.array(MicrositeRef),
})
export const PasswordChange = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
})
export const LocaleUpdate = z.object({ locale })
export const PhotoResponse = z.strictObject({ imageUrl: z.string() })

/** P08 */
export const EmployeeRegistration = z.object({
  fullName: personName,
  email,
  password,
  level: z.string().trim().min(1).max(80),
  timeAtDct: z.enum(['lt6m', '1to2y', 'gt2y']),
})
export const EmployeeRegistrationResponse = z.strictObject({
  userId: z.string(),
  verificationSent: z.literal(true),
})

/** P09/P10 */
export const PasswordTokenResponse = z.strictObject({
  valid: z.boolean(),
  email: z.string().optional(),
  purpose: z.enum(['reset', 'invite']),
})

/** P11 */
export const InvitationView = z.strictObject({
  valid: z.boolean(),
  email: z.string(),
  role: z.enum(['learner', 'mentor', 'judge', 'sub_admin', 'admin']),
  microsite: MicrositeRef.optional(),
  invitedBy: z.string(),
  expiresAt: z.string(),
})
export const InvitationAccept = z.object({
  name: personName,
  password,
  locale: locale.default('en'),
})
export const InvitationAcceptResponse = z.strictObject({
  userId: z.string(),
  defaultRoute: z.string(),
})

export const TokenParam = z.object({ token: z.string().min(20).max(200) })
export const UserIdParam = z.object({ id: uuid })
