import type { PaginationInput } from '@shared/schemas/common'

export function pageWindow({ page, pageSize }: PaginationInput) {
  return { limit: pageSize, offset: (page - 1) * pageSize }
}

export function paged<T>(items: T[], total: number, { page, pageSize }: PaginationInput) {
  return { items, page, pageSize, total }
}

/** `?sort=field:asc|desc` against an allow-list. */
export function parseSort<K extends string>(
  sort: string | undefined,
  allowed: readonly K[],
  fallback: [K, 'asc' | 'desc'],
) {
  if (!sort) return { field: fallback[0], dir: fallback[1] }
  const [field, dir] = sort.split(':')
  if (!allowed.includes(field as K)) return { field: fallback[0], dir: fallback[1] }
  return { field: field as K, dir: dir === 'desc' ? ('desc' as const) : ('asc' as const) }
}
