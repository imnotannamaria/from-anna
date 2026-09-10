type Props = {
  href: string
  className?: string
  children: React.ReactNode
}

/**
 * A link that leaves the site, and says so.
 *
 * Everything here opens in a new tab, because none of these are places you go
 * *instead* of this page — they are the repository, the package and my own
 * site, all of which someone opens while still reading. Losing the page you
 * were on to a GitHub tab is a small annoyance a link can avoid.
 *
 * `rel="noopener"`, and deliberately **not** `noreferrer`. `noopener` is the
 * one that matters: without it the opened page gets a handle on this one
 * through `window.opener`. `noreferrer` would additionally strip the Referer
 * header, which is how the other end sees that the visit came from here —
 * and that is a thing worth keeping rather than a thing to close.
 *
 * The note is `sr-only` rather than an icon. A new tab is a change of context
 * that nobody asked for, and someone who cannot see the tab bar has no other
 * way of finding out it happened.
 */
export function ExternalLink({ href, className, children }: Props) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
