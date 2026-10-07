import { app } from '@server/app'
import { env } from '@server/config/env'
import { closeDb, db } from '@server/db/connection'
import { startJobs, stopJobs } from '@server/jobs/runtime'
import '@server/jobs/index'
import { logger } from '@server/lib/logger'
import { sql } from 'drizzle-orm'

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server listening')
})

db.execute(sql`select 1`)
  .then(() => logger.info('Database connection ok'))
  .catch((error: unknown) => logger.error({ err: error }, 'Database is not reachable'))

startJobs()

let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'Shutting down')
  try {
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await stopJobs()
    await closeDb()
    process.exit(0)
  } catch (error) {
    logger.error({ err: error }, 'Shutdown failed')
    process.exit(1)
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
