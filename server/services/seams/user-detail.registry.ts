/**
 * P47 user detail is assembled from several areas (external certificates, GROW-log counts, …).
 * Each registers a section; the admin users service merges them into the response.
 */
export type UserDetailSection = (
  userId: string,
  viewerId: string,
) => Promise<Record<string, unknown>>

const sections: UserDetailSection[] = []

export function registerUserDetailSection(section: UserDetailSection) {
  sections.push(section)
}

export function userDetailSections() {
  return [...sections]
}
