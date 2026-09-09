import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema'

type Database = ReturnType<typeof create>

function create(connectionString: string) {
  return drizzle(neon(connectionString), { schema })
}

let cached: Database | null = null

/**
 * The database handle, created on first use.
 *
 * Deliberately lazy: building the app must not require a reachable database.
 * Throwing at import time would fail `next build` on any machine without
 * `DATABASE_URL`, including CI, for routes that never run at build time.
 */
export function getDb(): Database {
  if (cached) return cached

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.',
    )
  }

  cached = create(connectionString)
  return cached
}

export * from './schema'
