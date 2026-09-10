import { SignIn, SignOutButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

import { currentUserId, isAdminAllowed, readAdminContext } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

/**
 * The only door in.
 *
 * It is not linked from anywhere. `/admin` answers 404 to a stranger rather
 * than redirecting here, because a redirect to a sign-in page announces that
 * there is something behind it — the same reason the letter route answers 404
 * instead of 403. This page exists so I can sign in by typing the URL, and
 * that is all it is for.
 *
 * Clerk sends every sign-in back **here** rather than to `/admin`, and this
 * page decides. Sending it straight to `/admin` meant an account that was
 * not allowed in landed on a 404 with no idea what had happened.
 *
 * Nothing about the allowlist is shown — not the variable's name, not an id.
 * Being signed in and being allowed in are different things, and the only
 * useful thing to tell someone who is one and not the other is how to leave.
 */
export default async function AdminSignInPage() {
  const userId = await currentUserId()

  if (userId && isAdminAllowed(readAdminContext(userId))) {
    redirect('/admin')
  }

  if (userId) {
    return (
      <main className="state state--admin">
        <div className="state-inner">
          <p className="meta state-eyebrow">The desk</p>
          <h1 className="display state-title">
            This account <em>can&rsquo;t write here.</em>
          </h1>
          <p className="state-lede">
            You are signed in, but not with an account that has access. If you
            meant to use a different email, sign out and try again.
          </p>
          <p className="state-actions">
            <SignOutButton redirectUrl="/admin/sign-in">
              <button type="button" className="pill pill--solid">
                Sign out and use another email
              </button>
            </SignOutButton>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="state state--admin">
      <div className="state-inner">
        <p className="meta state-eyebrow">The desk</p>
        <h1 className="display state-title">
          Sign in to <em>write.</em>
        </h1>
        <div className="sign-in-frame">
          <SignIn
            routing="path"
            path="/admin/sign-in"
            // Nowhere to sign up to. The card still offers it — Clerk owns
            // that markup — but the allowlist is what an account runs into.
            signUpUrl="/admin/sign-in"
            // Back here, not to /admin: this page is what tells an account
            // that is not allowed in what just happened.
            forceRedirectUrl="/admin/sign-in"
            // Enough to stop it looking like a stranger's form. Clerk owns
            // the rest of the card, and chasing their theming API for a page
            // one person sees a handful of times is not worth the upkeep.
            appearance={{
              variables: {
                colorPrimary: '#b8305f',
                borderRadius: '8px',
                fontFamily: 'Newsreader, Georgia, serif',
              },
            }}
          />
        </div>
      </div>
    </main>
  )
}
