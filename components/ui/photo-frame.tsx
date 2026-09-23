'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** A server-rendered `<ScannedPhoto>`. The frame never builds the image. */
  children: React.ReactNode
  className?: string
  /**
   * Start fetching now, while nobody is looking at it yet.
   *
   * The photograph is the back of a sheet, which is `display: none` until it
   * is turned over, and a lazy image that is not laid out is never fetched.
   * So the download used to start at the tap on "View original photo", from
   * a Function reading a private store, and the reader watched a blank frame.
   * Warming the sheet that is open lets it arrive while the words are read.
   */
  warm?: boolean
}

/**
 * A photograph that says it is on its way, and says so when it did not come.
 *
 * The state is written straight onto the frame as `data-state`, never through
 * React, and only once mounted: with no script the attribute never exists and
 * the photograph is exactly what the server sent. A skeleton that depends on
 * a script to go away would be the kind of wall this project does not build.
 */
export function PhotoFrame({ children, className, warm = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frame = ref.current
    const img = frame?.querySelector('img')
    if (!frame || !img) return

    const settle = () => {
      frame.dataset.state = img.naturalWidth > 0 ? 'loaded' : 'failed'
    }

    // Already here, from the cache or from before hydration: no skeleton,
    // and no entrance either, because nothing arrived.
    if (img.complete && img.currentSrc) {
      frame.dataset.state = img.naturalWidth > 0 ? 'ready' : 'failed'
    } else {
      frame.dataset.state = 'loading'
    }

    img.addEventListener('load', settle)
    img.addEventListener('error', settle)
    return () => {
      img.removeEventListener('load', settle)
      img.removeEventListener('error', settle)
    }
  }, [])

  useEffect(() => {
    if (!warm) return
    const img = ref.current?.querySelector('img')
    if (!img || img.loading === 'eager') return

    // Changing `loading` to eager resumes a deferred lazy image, laid out or
    // not. Idle first, so it never competes with the opening itself.
    const start = () => {
      img.loading = 'eager'
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = setTimeout(start, 300)
    return () => clearTimeout(timer)
  }, [warm])

  const retry = () => {
    const frame = ref.current
    const img = frame?.querySelector('img')
    if (!frame || !img) return
    const src = img.currentSrc || img.src
    frame.dataset.state = 'loading'
    // A failed URL is remembered as failed, so the retry has to be a new one.
    // The route ignores the extra parameter.
    img.removeAttribute('srcset')
    img.loading = 'eager'
    img.src = `${src}${src.includes('?') ? '&' : '?'}retry=${Date.now()}`
  }

  return (
    <div
      ref={ref}
      className={['photo-frame', className].filter(Boolean).join(' ')}
    >
      {children}
      {/* Hidden unless `data-state` says otherwise, so it is not in the way
          with no script. The loading line is `aria-hidden` like every other
          skeleton here; the photograph's own alt text is what a screen
          reader gets. */}
      <div className="photo-frame-status" data-for="loading" aria-hidden="true">
        <span className="meta">Loading the photograph…</span>
      </div>
      <div className="photo-frame-status" data-for="failed">
        <p>The photograph didn’t load.</p>
        <button type="button" className="pill" onClick={retry}>
          Try again
        </button>
      </div>
    </div>
  )
}
