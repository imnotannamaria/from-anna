/**
 * The admin gate.
 *
 * Clerk is wired up in the `share` feature (phase 5). Until then this fails
 * closed: an unauthenticated transcription endpoint spends my OpenRouter
 * credit for whoever finds it, so "not built yet" has to mean "denied", never
 * "allowed".
 *
 * The local escape hatch is deliberately awkward. It cannot be switched on in
 * a production build at all, no matter what the environment says.
 */

export type AdminContext = {
  /** True in a production build. */
  isProduction: boolean
  /** `DEV_ADMIN_BYPASS=1`, honoured only outside production. */
  bypassEnabled: boolean
  /** The signed-in user id, once Clerk is wired up. `null` when signed out. */
  userId: string | null
  /** Emails or ids allowed in. Empty means nobody is allowed yet. */
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
 */
export async function requireAdmin(): Promise<void> {
  // TODO(share/phase-5): read the Clerk session here and pass the user id in.
  const context = readAdminContext(null)
  if (!isAdminAllowed(context)) throw new NotAuthorizedError()
}
