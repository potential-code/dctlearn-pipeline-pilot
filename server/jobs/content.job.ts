import { purgeOldVoiceIntakes } from '@server/services/ai/voice-intake.service'
import { defineSchedule } from './runtime'

/** §9.7 retention: voice-hiring applicant data is deleted after 12 months (daily sweep). */
defineSchedule('content.voice_intake_retention', 24 * 60 * 60, purgeOldVoiceIntakes)
