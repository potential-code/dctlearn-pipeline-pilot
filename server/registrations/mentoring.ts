import { mentorProfiles } from '@server/db/schema/mentoring'
import { onInvitationAccepted } from '@server/services/identity/invitation.service'
import {
  growLogsSummary,
  onMentorInvitationAccepted,
} from '@server/services/mentoring/admin.service'
import { dashboardSection, mentorsTab } from '@server/services/mentoring/learner.service'
import { registerDashboardSection } from '@server/services/seams/dashboard.registry'
import { registerHubTab } from '@server/services/seams/hub.registry'
import { registerTranslatable } from '@server/services/seams/translatable.registry'
import { registerUserDetailSection } from '@server/services/seams/user-detail.registry'
import { MentorsTabQuery, MentorsTabResponse } from '@shared/schemas/mentoring'

/** Mentoring plugs into the shared seams (BACKEND.md "Seams"). Imported once at boot. */

// P52 `mentors` tab: Elevate mentors; MuseoPro trainers (browse only, mentoring flag ignored).
registerHubTab('mentors', {
  query: MentorsTabQuery,
  response: MentorsTabResponse,
  handler: ({ viewer, microsite, query }) =>
    mentorsTab(viewer, microsite, query as Parameters<typeof mentorsTab>[2]),
})

// P14 `mentoring` section (only called when the microsite has mentoring on).
registerDashboardSection('mentoring', ({ viewer, microsite }) =>
  dashboardSection(viewer, microsite),
)

// P47 user detail: GROW-log counts only.
registerUserDetailSection((userId) => growLogsSummary(userId))

// P48 invitation accepted → mentor profile + microsite links.
onInvitationAccepted((tx, input) => onMentorInvitationAccepted(tx, input))

// P60: mentor bio is `{ en, ar }`. 'mentor' is not yet in TranslatableEntity (requested change).
registerTranslatable({
  entity: 'mentor',
  table: mentorProfiles,
  id: mentorProfiles.id,
  fields: { bio: mentorProfiles.bio },
})
