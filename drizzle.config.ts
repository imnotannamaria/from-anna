import { defineConfig } from 'drizzle-kit'

/**
 * `drizzle-kit` is a standalone CLI, so it never sees the `.env.local` that
 * `next dev` loads for the app. Without this, every migrate and studio run
 * fails with `url: undefined` even though the app itself works.
 *
 * Only `.env.local` is loaded, and only if it exists: on Vercel the
 * environment is already populated and there is no file to read.
 */
try {
  process.loadEnvFile('.env.local')
} catch {
  // No .env.local — expected in CI and on Vercel.
}

const url = process.env.DATABASE_URL

if (!url) {
  throw new Error(
    'DATABASE_URL is not set. Add it to .env.local (see .env.example).',
  )
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
})
