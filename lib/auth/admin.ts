import { auth } from '@clerk/nextjs/server'

/**
 * The admin gate.
 *
 * It fails closed, and that is the whole design: an unauthenticated
 * transcription endpoint spends my OpenRouter credit for whoever finds it, so
 * anything unresolved has to mean "denied", never "allowed".
 *
 * The local escape hatch is deliberately awkward. It cannot be switched on in
 * a production build at all, no matter what the environment says.
 */

export type AdminContext = {
  /** True in a production build. */
  isProduction: boolean
  /** `DEV_ADMIN_BYPASS=1`, honoured only outside production. */
  bypassEnabled: boolean
  /** The signed-in Clerk user id. `null` when signed out. */
  userId: string | null
  /** Clerk user ids allowed in. Empty means nobody is allowed yet. */
  allowlist: string[]
}

/**
 * Pure decision, so the rule can be tested without a request.
 *
 * Signed in is not the same as authorized: the allowlist is what decides.
 */
export function isAdminAllowed(context: AdminContext): boolean {
  if (context.isProduction) {
    // The bypass does not exist in production. Not "is discouraged" — the
    // flag is never read on this branch.
    if (!context.userId) return false
    return context.allowlist.includes(context.userId)
  }

  if (context.bypassEnabled) return true
  if (!context.userId) return false
  return context.allowlist.includes(context.userId)
}

export function readAdminContext(userId: string | null = null): AdminContext {
  return {
    isProduction: process.env.NODE_ENV === 'production',
    bypassEnabled: process.env.DEV_ADMIN_BYPASS === '1',
    userId,
    allowlist: (process.env.ADMIN_USER_IDS ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  }
}

export class NotAuthorizedError extends Error {
  constructor() {
    super('Not authorized')
    this.name = 'NotAuthorizedError'
  }
}

/**
 * Throws unless the caller is allowed into an admin surface.
 *
 * Callers turn this into a **404**, never a 403 — a 403 confirms the thing
 * exists.
 *
 * `auth()` only has something to read because `proxy.ts` runs Clerk's
 * middleware first. That middleware is not the gate, though: this call is,
 * and it happens in every admin page and every admin route handler. A matcher
 * that quietly stopped matching would make `userId` null, which denies.
 */
export async function requireAdmin(): Promise<void> {
  const { userId } = await auth()
  const context = readAdminContext(userId)
  if (!isAdminAllowed(context)) throw new NotAuthorizedError()
}

/**
 * The signed-in user id, whether or not they are allowed in.
 *
 * Only the sign-in page uses this, to tell "signed in and allowed" (sent on
 * to the desk) from "signed in and not" (offered a way to sign out). It never
 * displays the id: that page is public.
 */
export async function currentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
