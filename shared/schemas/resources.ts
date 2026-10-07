import { z } from 'zod'
import { RESOURCE_STATUSES } from '../enums'
import { httpsUrl, I18n, i18nTitle, MicrositeRef, paginated, pagination, UserDto } from './common'

/** P53 sub-admin resources, P54 admin verification, P52 resources tab, P14 resources section. */

export const ResourceType = z.enum(['link', 'pdf'])
export const ResourceStatus = z.enum(RESOURCE_STATUSES)

/**
 * JSON `{ title, url, imageUrl? }`, or multipart with a PDF in `file` (then `url` is omitted;
 * send the title as `title[en]` / `title[ar]`). On edit, omitting both url and file keeps the
 * current link or PDF.
 */
export const ResourceInput = z.object({
  title: i18nTitle,
  url: httpsUrl.optional(),
  imageUrl: httpsUrl.optional().nullable(),
})
export type ResourceInput = z.infer<typeof ResourceInput>

export const SubResourcesQuery = pagination.extend({ status: ResourceStatus.optional() })
export const SubResource = z.strictObject({
  id: z.string(),
  title: I18n,
  url: z.string(),
  type: ResourceType,
  status: ResourceStatus,
  reviewNote: z.string().optional(),
  submittedAt: z.string(),
})
export const SubResourcesPage = paginated(SubResource)

export const AdminResourcesQuery = pagination.extend({
  status: ResourceStatus.default('pending'),
})
export const AdminResource = z.strictObject({
  id: z.string(),
  microsite: MicrositeRef,
  title: I18n,
  url: z.string(),
  submittedBy: UserDto,
  submittedAt: z.string(),
})
export const AdminResourcesPage = paginated(AdminResource)

export const RejectResourceInput = z.object({ note: z.string().trim().min(1).max(1000) })
export const ReviewResponse = z.strictObject({ ok: z.literal(true) })

/* learner */

export const HubResourcesQuery = pagination.extend({ type: ResourceType.optional() })
export const HubResource = z.strictObject({
  id: z.string(),
  title: I18n,
  type: ResourceType,
  url: z.string(),
  imageUrl: z.string().optional(),
})
export const HubResourcesPage = paginated(HubResource)

export const DashboardResource = z.strictObject({
  id: z.string(),
  title: I18n,
  url: z.string(),
  imageUrl: z.string().optional(),
})
