import {
  autoCompleteBookings,
  sendSessionReminders,
} from '@server/services/mentoring/bookings.service'
import { defineSchedule } from './runtime'

/** Contract §9.3: session reminders (24 h and 1 h before) and booking auto-complete (15 min). */
defineSchedule('mentoring.session_reminders', 300, sendSessionReminders)
defineSchedule('mentoring.auto_complete', 900, autoCompleteBookings)
