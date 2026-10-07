import { defineConfig } from 'drizzle-kit'

// One file per area in server/db/schema/; drizzle-kit collects them by glob (no barrel to edit).
export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema/*.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  strict: true,
  verbose: true,
})
