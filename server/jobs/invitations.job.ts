import { expireInvitations } from '@server/services/identity/invitation.service'
import { defineSchedule } from './runtime'

defineSchedule('invitations.expire', 3600, expireInvitations)
