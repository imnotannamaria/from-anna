import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

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
 * There is no sign-up. Clerk will happily create an account for anyone who
 * gets this far, and it will not help them: `ADMIN_USER_IDS` is what decides,
 * and being signed in is not being allowed in.
 */
export default async function AdminSignInPage() {
  const userId = await currentUserId()
  const allowed = isAdminAllowed(readAdminContext(userId))

  if (userId && allowed) {
    return (
      <main className="state state--admin">
        <div className="state-inner">
          <p className="meta state-eyebrow">Signed in</p>
          <h1 className="display state-title">
            You are <em>already in.</em>
          </h1>
          <p className="state-actions">
            <Link href="/admin" className="pill pill--solid">
              The desk <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </main>
    )
  }

  if (userId && !allowed) {
    /*
      The bootstrap problem, and the only place it can be solved.

      The allowlist is a list of Clerk user ids, and nobody knows their own
      until they have signed in once. So the id is shown here — to the person
      it belongs to, and to nobody else. It is not a secret: on its own it
      opens nothing, and it is useless to anyone who cannot also edit the
      environment.
    */
    return (
      <main className="state state--admin">
        <div className="state-inner">
          <p className="meta state-eyebrow">Signed in, not allowed</p>
          <h1 className="display state-title">
            Signed in is not <em>allowed in.</em>
          </h1>
          <p className="state-lede">
            Being able to sign in and being on the list are two different
            things, on purpose. Put this id in <code>ADMIN_USER_IDS</code> and
            reload — locally in <code>.env.local</code>, and again in the
            project settings for a deployment, because a Clerk development
            instance and a production one issue different ids.
          </p>
          <pre className="home-code home-code--wide">
            <code>ADMIN_USER_IDS={userId}</code>
          </pre>
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
            forceRedirectUrl="/admin"
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
