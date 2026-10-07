import { notFound } from './errors'

/**
 * Ownership checks (contract §0.3 **own** / **assigned**): a record that does not belong to the
 * caller answers 404, exactly like a missing one, so ids cannot be probed.
 */
export function assertFound<T>(row: T | undefined | null): T {
  if (row === undefined || row === null) throw notFound()
  return row
}

export function assertOwn<T extends { userId: string | null }>(
  row: T | undefined | null,
  userId: string,
): T {
  if (!row || row.userId !== userId) throw notFound()
  return row
}
