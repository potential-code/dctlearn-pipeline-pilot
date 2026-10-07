import { env } from '@server/config/env'
import pino from 'pino'

// JSON lines on stdout. No passwords, tokens, cookies or personal data (contract §9.10).
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.newPassword',
      '*.currentPassword',
      '*.token',
      '*.email',
    ],
    censor: '[redacted]',
  },
})
