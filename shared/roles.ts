/**
 * Roles, shared by both sides (API-CONTRACT §0.1). One role per account.
 * The server stores and enforces them; the client only reads them to decide what to show.
 */
export const ROLES = ['learner', 'mentor', 'judge', 'sub_admin', 'admin'] as const
export type Role = (typeof ROLES)[number]
export const DEFAULT_ROLE: Role = 'learner'

/** Roles whose sessions are capped at 12 h and ignore "remember me" (contract §9.6). */
export const PRIVILEGED_ROLES: readonly Role[] = ['admin', 'sub_admin']

/** Roles an invitation may upgrade a learner to on accept (decision 2026-10-07). */
export const UPGRADABLE_FROM_LEARNER: readonly Role[] = ['judge', 'mentor', 'sub_admin']
