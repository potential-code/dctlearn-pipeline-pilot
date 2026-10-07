import { z } from 'zod'
import { USER_STATUSES } from '../enums'
import { I18n, isoDateTime, paginated, personName, UserDto } from './common'

export const UsersQuery = z.object({
  q: z.string().max(100).optional(),
  role: z.enum(['learner', 'mentor', 'judge', 'sub_admin', 'admin']).optional(),
  microsite: z
    .string()
    .regex(/^[a-z0-9-]{2,40}$/)
    .optional(),
  status: z.enum(USER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const AdminUserRow = UserDto.extend({
  microsites: z.array(z.string()),
  joinedAt: z.string(),
  lastSignInAt: z.string().optional(),
  legacyId: z.string().optional(),
}).strict()
export const AdminUsersPage = paginated(AdminUserRow)

export const AdminProfile = z.strictObject({
  firstName: z.string(),
  lastName: z.string(),
  country: z.string(),
  position: z.string(),
  department: z.string(),
  employmentType: z.string(),
  seniorityLevel: z.string(),
  linkedinUrl: z.string(),
  mobile: z.string(),
  employeeId: z.string().optional(),
  sector: z.string().optional(),
  hireDate: z.string().optional(),
})

export const AdminUserDetail = AdminUserRow.extend({
  profile: AdminProfile,
  points: z.number(),
  certificates: z.array(
    z.strictObject({ id: z.string(), courseTitle: I18n, serial: z.string(), issuedAt: z.string() }),
  ),
  externalCertificates: z.array(
    z.strictObject({
      id: z.string(),
      courseTitle: I18n,
      status: z.enum(['pending', 'approved', 'rejected']),
      uploadedAt: z.string(),
    }),
  ),
  growLogsSummary: z.strictObject({ logs: z.number(), mentees: z.number() }).optional(),
  deleteRequestedAt: z.string().optional(),
  updatedAt: z.string(),
  auditTrail: z.array(z.strictObject({ at: z.string(), actor: z.string(), action: z.string() })),
}).strict()

export const AdminUserUpdate = z.object({
  name: personName.optional(),
  role: z.enum(['learner', 'mentor', 'judge', 'sub_admin', 'admin']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  microsites: z
    .array(z.string().regex(/^[a-z0-9-]{2,40}$/))
    .max(50)
    .optional(),
  profile: z
    .object({
      firstName: z.string().max(80),
      lastName: z.string().max(80),
      country: z.string().max(80),
      position: z.string().max(120),
      department: z.string().max(120),
      employmentType: z.string().max(80),
      seniorityLevel: z.string().max(80),
      linkedinUrl: z.string().max(2048),
      mobile: z.string().max(30),
      employeeId: z.string().max(40),
      sector: z.string().max(120),
      hireDate: z.string().max(10),
    })
    .partial()
    .optional(),
  ifMatch: isoDateTime.optional(),
})

export const ImportPreview = z.strictObject({
  preview: z.array(
    z.strictObject({
      row: z.number(),
      email: z.string(),
      name: z.string(),
      microsites: z.array(z.string()),
      action: z.enum(['create', 'update', 'skip']),
      reason: z.string().optional(),
    }),
  ),
  token: z.string(),
})
export const ImportConfirm = z.object({
  token: z.string().min(10).max(200),
  sendWelcome: z.boolean().default(false),
})
export const ImportResult = z.strictObject({
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
})

export const AuditQuery = z.object({
  actor: z.uuid().optional(),
  action: z.string().max(80).optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const AuditRow = z.strictObject({
  at: z.string(),
  actor: UserDto.optional(),
  action: z.string(),
  target: z.strictObject({
    type: z.string(),
    id: z.string().optional(),
    label: z.string().optional(),
  }),
  microsite: z.string().optional(),
})
export const AuditPage = paginated(AuditRow)
