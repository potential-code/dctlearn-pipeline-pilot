import type { users } from '@server/db/schema/identity'
import { urlForStored } from '@server/services/files.service'
import type { UserDto } from '@shared/schemas/common'

type UserRow = Pick<
  typeof users.$inferSelect,
  'id' | 'name' | 'email' | 'role' | 'locale' | 'image' | 'status'
>

/** §0.2 User. E-mail only reaches callers allowed to see it (presenters decide). */
export async function toUserDto(u: UserRow, viewerId: string | null): Promise<UserDto> {
  const imageUrl = await urlForStored(u.image, viewerId)
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserDto['role'],
    locale: u.locale === 'ar' ? 'ar' : 'en',
    status: u.status as UserDto['status'],
    ...(imageUrl ? { imageUrl } : {}),
  }
}
