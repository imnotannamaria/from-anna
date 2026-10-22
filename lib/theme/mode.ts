/**
 * The colour mode a reader chose, and only that.
 *
 * Light is the first visit and the no-script fallback. An explicit choice is
 * kept in this browser's localStorage and never reaches the server.
 */
export const MODE_KEY = 'from-anna-mode'

/** The canvas of each mode, for the browser chrome (`theme-color`). */
export const THEME_COLOR = { light: '#f4f4f2', dark: '#09090b' } as const

/**
 * Runs in `<head>`, before the body paints, so a saved dark choice is on the
 * page from the first frame.
 *
 * A plain inline script on purpose. `next/script`, even `beforeInteractive`,
 * queues inline code in `self.__next_s` until Next's runtime has loaded,
 * which is after the first paint: every page flashed light for anyone who
 * had chosen dark. ES5 and wrapped in try, because storage can throw.
 */
export const MODE_SCRIPT = `try{var d=localStorage.getItem('${MODE_KEY}')==='dark';document.documentElement.dataset.mode=d?'dark':'light';var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'${THEME_COLOR.dark}':'${THEME_COLOR.light}')}catch(e){}`

/** Keeps the browser chrome the colour of the page. */
export function syncThemeColor(mode: 'dark' | 'light') {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLOR[mode])
}

/**
 * The saved choice, put back on `<html>` if something took it off.
 *
 * The head script normally does this before first paint. But a 404 thrown
 * from inside `/[slug]` renders the root layout again on the client, and the
 * `<html>` it ends up with carries the server's `data-mode="light"`.
 */
export function restoreMode() {
  try {
    const mode = localStorage.getItem(MODE_KEY) === 'dark' ? 'dark' : 'light'
    if (document.documentElement.dataset.mode !== mode) {
      document.documentElement.dataset.mode = mode
      window.dispatchEvent(new Event('from-anna-theme'))
    }
    syncThemeColor(mode)
  } catch {
    // Storage is off: light, which is what the server sent.
  }
}
