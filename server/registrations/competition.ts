import { competitionCriteria, competitionRounds } from '@server/db/schema/competition'
import { upsertRoster } from '@server/services/competition/admin.service'
import { dashboardSection, onPitchSaved } from '@server/services/competition/learner.service'
import { onInvitationAccepted } from '@server/services/identity/invitation.service'
import { onActionPlanSaved } from '@server/services/seams/action-plan.seam'
import { registerDashboardSection } from '@server/services/seams/dashboard.registry'
import {
  registerTranslatable,
  type TranslatableEntity,
} from '@server/services/seams/translatable.registry'

/** Competition plugs into P14, the action-plan seam, invitations and P60 translations. */

registerDashboardSection('competition', ({ viewer, microsite }) =>
  dashboardSection(viewer, microsite),
)

// First save of a round's pitch: submission not_started → in_progress.
onActionPlanSaved(onPitchSaved)

// An accepted judge invitation for a microsite puts the judge on that microsite's roster.
onInvitationAccepted(async (tx, { invitation, userId }) => {
  if (invitation.role !== 'judge' || !invitation.micrositeId) return
  await upsertRoster(tx, invitation.micrositeId, invitation.email, userId, invitation.id)
})

// TranslatableEntity does not list competition entities yet (requested shared change).
registerTranslatable({
  entity: 'competition_round' as TranslatableEntity,
  table: competitionRounds,
  id: competitionRounds.id,
  fields: { name: competitionRounds.name, description: competitionRounds.description },
  richFields: ['description'],
})
registerTranslatable({
  entity: 'competition_criterion' as TranslatableEntity,
  table: competitionCriteria,
  id: competitionCriteria.id,
  fields: { question: competitionCriteria.question },
})
