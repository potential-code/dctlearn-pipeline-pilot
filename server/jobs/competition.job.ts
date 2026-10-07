import { closeDueRounds } from '@server/services/competition/rounds.service'
import { defineSchedule } from './runtime'

/** Round close (contract §9.3): every 5 min, open rounds past `closesAt` move to judging. */
defineSchedule('competition.round_close', 5 * 60, closeDueRounds)
