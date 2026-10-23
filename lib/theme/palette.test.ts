import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { AA_NORMAL, contrastRatio } from 'remark-scanned-page'

/**
 * Reads the real stylesheet rather than a copy of its values.
 *
 * A test that restates the palette in TypeScript passes forever while the CSS
 * drifts. This one fails when someone edits `globals.css`, which is the only
 * version that ships.
 */

/**
 * Comments are stripped first. Prose in a comment can contain something that
 * looks exactly like a declaration — this file's own commentary mentions
 * `--bg-canvas:` mid-sentence, and parsing it as a value produced a colour of
 * three paragraphs of English.
 */
const CSS = readFileSync(
  join(process.cwd(), 'app/globals.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '')

/** The structural rules ship with the package; only the colours are ours. */
const PACKAGE_CSS = readFileSync(
  join(process.cwd(), 'packages/remark-scanned-page/styles/scanned-page.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '')

const TAGS = ['important', 'note', 'ask', 'unknown'] as const

/** Every `--name: value` in the file, last declaration winning. */
function collectVars(css: string): Map<string, string> {
  const vars = new Map<string, string>()
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(match[1], match[2].trim())
  }
  return vars
}

/** Resolve `var(--x)` chains down to a literal value. */
function resolve(vars: Map<string, string>, name: string, depth = 0): string {
  const value = vars.get(name)
  if (value === undefined) throw new Error(`${name} is not declared`)
  if (depth > 10) throw new Error(`${name} resolves in a loop`)

  const indirect = value.match(/^var\((--[\w-]+)\)$/)
  return indirect ? resolve(vars, indirect[1], depth + 1) : value
}

/** Every block matching `selector` that also declares `contains`. */
function blocksWith(selector: string, contains: string): Map<string, string>[] {
  const pattern = new RegExp(
    `${selector}\\s*\\{([^}]*${contains}[^}]*)\\}`,
    'gm',
  )
  // Attribute quote style is formatting, not a change to the palette.
  const source = CSS.replace(
    /\[data-mode=(['"])light\1\]/g,
    '[data-mode="light"]',
  )
  return [...source.matchAll(pattern)].map((match) => collectVars(match[1]))
}

/**
 * Read a token as the browser would: the last declaration in the file wins.
 *
 * Resolving `--fg-primary` from a flat map of the whole stylesheet is what
 * this replaced, and it was wrong the moment a second block redeclared it —
 * the dark palette ended up measured against the light theme's ink, and the
 * test failed on a palette that was fine.
 */
function tokenIn(
  selector: string,
  name: string,
  vars: Map<string, string>,
): string {
  const blocks = blocksWith(selector, name)
  const last = blocks.at(-1)
  if (!last) throw new Error(`No block ${selector} declaring ${name}`)
  const value = last.get(name)!
  const indirect = value.match(/^var\((--[\w-]+)\)$/)
  return indirect ? resolve(vars, indirect[1]) : value
}

const globals = collectVars(CSS)
const darkHighlights = blocksWith(':root', '--hl-important').at(-1)!
const lightHighlights = blocksWith(
  ':root\\[data-mode="light"\\]',
  '--hl-important',
).at(-1)!

const modes = [
  {
    name: 'dark',
    highlights: darkHighlights,
    fg: tokenIn(':root', '--fg-primary', globals),
    canvas: tokenIn(':root', '--bg-canvas', globals),
  },
  {
    name: 'light',
    highlights: lightHighlights,
    fg: tokenIn(':root\\[data-mode="light"\\]', '--fg-primary', globals),
    canvas: tokenIn(':root\\[data-mode="light"\\]', '--bg-canvas', globals),
  },
] as const

describe('highlight palette', () => {
  it('declares every tag in both modes', () => {
    for (const tag of TAGS) {
      expect(darkHighlights.has(`--hl-${tag}`), `dark --hl-${tag}`).toBe(true)
      expect(lightHighlights.has(`--hl-${tag}`), `light --hl-${tag}`).toBe(true)
    }
  })

  for (const mode of modes) {
    for (const tag of TAGS) {
      it(`${mode.name}: ${tag} text passes AA against the highlight fill`, () => {
        const fill = mode.highlights.get(`--hl-${tag}`)!
        const ratio = contrastRatio(mode.fg, fill)

        // Measured against the fill, not the canvas: the mark paints over the
        // page, so canvas contrast proves nothing about the words on top.
        expect(
          ratio,
          `${mode.name} ${tag}: ${mode.fg} on ${fill} is ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(AA_NORMAL)
      })
    }

    it(`${mode.name}: every highlight has a visible fill or a contrasting underline`, () => {
      // The pastel fills carry saturated, distinct underlines. When a
      // fill is subtle, its underline must remain visible against both grounds.
      const canvas = mode.canvas
      for (const tag of TAGS) {
        const fill = mode.highlights.get(`--hl-${tag}`)!
        const fillContrast = contrastRatio(canvas, fill)
        if (fillContrast > 1.2) continue
        expect(mode.name, 'Only the light palette uses pastel fills').toBe(
          'light',
        )
        const underlineToken = {
          important: '--status-error',
          note: '--status-warning',
          ask: '--status-info',
          unknown: '--fg-primary',
        }[tag]
        const ink = resolve(globals, underlineToken)
        const readingCSS = readFileSync(
          join(process.cwd(), 'app/styles/reading.css'),
          'utf8',
        )
        expect(readingCSS).toContain(
          `text-decoration-color: var(${underlineToken})`,
        )
        expect(
          contrastRatio(ink, fill),
          `${tag} underline against fill`,
        ).toBeGreaterThanOrEqual(3)
        expect(
          contrastRatio(ink, canvas),
          `${tag} underline against canvas`,
        ).toBeGreaterThanOrEqual(3)
      }
    })
  }

  // The structure lives in the package now, so what this file guards is the
  // palette: the part that belongs to this project and that the package
  // deliberately refuses to choose.
  it('gives each tag its own underline style, not just a colour', () => {
    // The fills for `important` and `ask` sit within 0.01 of each other in
    // relative luminance. In greyscale they are the same swatch, so if this
    // ever collapses to one style the tags stop being distinguishable at all.
    const styles = ['important', 'note', 'ask'].map((tag) => {
      const rule = PACKAGE_CSS.match(
        new RegExp(`mark\\[data-c='${tag}'\\]\\s*\\{([^}]*)\\}`, 'm'),
      )
      expect(rule, `no rule for ${tag}`).not.toBeNull()
      return rule![1].match(/text-decoration-style:\s*([\w-]+)/)?.[1]
    })

    expect(styles.every(Boolean), 'every tag needs a decoration style').toBe(
      true,
    )
    expect(new Set(styles).size, `styles were ${styles.join(', ')}`).toBe(3)
  })

  for (const mode of modes) {
    it(`${mode.name}: a dimmed highlight still carries its words`, () => {
      // The legend filter takes the colour away, never the text. If this
      // ever drops below AA, filtering makes half the letter unreadable —
      // which is a strange price for a way of re-reading it.
      const dimmed = mode.highlights.get('--hl-dimmed')
      expect(dimmed, `${mode.name} --hl-dimmed`).toBeDefined()

      const ratio = contrastRatio(mode.fg, dimmed!)
      expect(
        ratio,
        `${mode.name} dimmed: ${mode.fg} on ${dimmed} is ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(AA_NORMAL)
    })

    it(`${mode.name}: a dimmed highlight recedes further than any live one`, () => {
      // The point of dimming is that the filtered-out tags stop competing.
      // A dimmed fill that stands out more than a real one inverts that.
      const dimmed = contrastRatio(
        mode.canvas,
        mode.highlights.get('--hl-dimmed')!,
      )
      for (const tag of ['important', 'note', 'ask'] as const) {
        const live = contrastRatio(
          mode.canvas,
          mode.highlights.get(`--hl-${tag}`)!,
        )
        expect(dimmed, `${tag} vs dimmed against canvas`).toBeLessThan(live)
      }
    })
  }

  it('keeps the two rules that fail silently', () => {
    const base = PACKAGE_CSS.match(/mark\[data-c\]\s*\{([^}]*)\}/m)?.[1] ?? ''

    // Black text on a dark fill in dark mode.
    expect(base).toMatch(/color:\s*inherit/)
    // Padding only on the first and last line of a wrapped highlight.
    expect(base).toMatch(/box-decoration-break:\s*clone/)
  })
})

/**
 * The rest of the reading surface.
 *
 * The highlights were never the only pair on the page. The metadata labels
 * are 11px and sit on paper rather than white, and a reaction the reader has
 * chosen sits on a blush fill, which is a different ground and therefore a
 * different measurement.
 * The app runs in light mode, so light is what these check.
 */
describe('the paper surface', () => {
  const LIGHT = ':root\\[data-mode="light"\\]'
  const canvas = tokenIn(LIGHT, '--bg-canvas', globals)
  const muted = tokenIn(LIGHT, '--fg-muted', globals)
  const brand = tokenIn(LIGHT, '--fg-brand', globals)
  const surface = tokenIn(LIGHT, '--bg-surface', globals)

  /** Flatten an `rgba()` onto an opaque background, the way the screen does. */
  function over(rgba: string, background: string): string {
    const parts = rgba.match(/rgba?\(([^)]+)\)/)
    if (!parts) throw new Error(`${rgba} is not an rgba() value`)
    const [r, g, b, a = '1'] = parts[1].split(',').map((n) => Number(n.trim()))

    const base = background.replace('#', '')
    const channel = (i: number) => parseInt(base.slice(i * 2, i * 2 + 2), 16)
    const mix = (top: number, bottom: number) =>
      Math.round(top * Number(a) + bottom * (1 - Number(a)))

    return `#${[mix(r, channel(0)), mix(g, channel(1)), mix(b, channel(2))]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')}`
  }

  const blush = over(tokenIn(LIGHT, '--bg-surface-brand', globals), canvas)

  it('the muted label colour reaches AA on paper', () => {
    // Every `.meta` label in the project is 11px, which is normal text by
    // WCAG's reckoning. Paper is warmer and lighter than white, so a muted
    // grey tuned against white lands short here.
    const ratio = contrastRatio(muted, canvas)
    expect(
      ratio,
      `${muted} on ${canvas} is ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('a chosen reaction is measured against the blush, not the paper', () => {
    // The fill changes the background, so the text on it is a different pair.
    for (const [name, colour] of [
      ['body', tokenIn(LIGHT, '--fg-primary', globals)],
      ['a chosen reaction', tokenIn(LIGHT, '--fg-brand-text', globals)],
    ] as const) {
      const ratio = contrastRatio(colour, blush)
      expect(
        ratio,
        `${name}: ${colour} on ${blush} is ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(AA_NORMAL)
    }
  })

  it('a chosen reaction reads on the blush in the dark palette too', () => {
    const darkCanvas = tokenIn(':root', '--bg-canvas', globals)
    const darkBlush = over(
      tokenIn(':root', '--bg-surface-brand', globals),
      darkCanvas,
    )
    const colour = tokenIn(':root', '--fg-brand-text', globals)
    const ratio = contrastRatio(colour, darkBlush)
    expect(
      ratio,
      `${colour} on ${darkBlush} is ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('the solid button reads against its own fill', () => {
    // The solid pill is paper-coloured text on brand, which is the one place
    // in the project where the brand colour is a background.
    const ratio = contrastRatio(surface, brand)
    expect(
      ratio,
      `${surface} on ${brand} is ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(AA_NORMAL)
  })
})

/** Guard actual foreground roles now that both modes are user-selectable. */
describe('selectable entrepta modes', () => {
  const root = blocksWith(':root', '--bg-canvas').at(-1)!
  const light = blocksWith(':root\\[data-mode="light"\\]', '--bg-canvas').at(
    -1,
  )!
  const composite = (fill: string, background: string) => {
    if (fill.startsWith('#')) return fill
    const channels = fill
      .match(/rgba\(([^)]+)\)/)![1]
      .split(',')
      .map(Number)
    return (
      '#' +
      channels
        .slice(0, 3)
        .map((value, index) =>
          Math.round(
            value * channels[3] +
              parseInt(background.slice(1 + index * 2, 3 + index * 2), 16) *
                (1 - channels[3]),
          )
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
    )
  }
  for (const [name, vars] of [
    ['dark', root],
    ['light', new Map([...root, ...light])],
  ] as const) {
    const get = (token: string) => resolve(vars, token)
    for (const foreground of [
      '--fg-primary',
      '--fg-secondary',
      '--fg-muted',
      '--fg-brand-text',
    ]) {
      for (const surface of [
        '--bg-canvas',
        '--bg-card',
        '--bg-overlay',
        '--bg-inset',
        '--bg-field',
        '--bg-surface',
        '--bg-surface-elevated',
      ]) {
        it(`${name}: ${foreground} reads on ${surface}`, () => {
          expect(
            contrastRatio(
              get(foreground),
              composite(get(surface), get('--bg-card')),
            ),
          ).toBeGreaterThanOrEqual(AA_NORMAL)
        })
      }
    }
    it(`${name}: envelope ink reads on its paper stock`, () => {
      expect(
        contrastRatio(get('--envelope-ink'), get('--envelope-paper')),
      ).toBeGreaterThanOrEqual(AA_NORMAL)
    })
    it(`${name}: primary action uses its on-brand ink`, () => {
      expect(
        contrastRatio(get('--fg-on-brand'), get('--fg-brand')),
      ).toBeGreaterThanOrEqual(AA_NORMAL)
    })
    for (const status of ['success', 'warning', 'error', 'info']) {
      it(`${name}: ${status} text reads on its soft surface`, () => {
        const ground = composite(
          get(`--status-${status}-soft`),
          get('--bg-surface'),
        )
        expect(
          contrastRatio(get(`--status-${status}`), ground),
        ).toBeGreaterThanOrEqual(AA_NORMAL)
        expect(
          contrastRatio(get('--fg-primary'), ground),
        ).toBeGreaterThanOrEqual(AA_NORMAL)
      })
    }
    for (const [tag, status] of [
      ['important', 'error'],
      ['note', 'warning'],
      ['ask', 'info'],
    ]) {
      it(`${name}: ${tag} legend reads on the actual fill`, () => {
        expect(
          contrastRatio(get(`--status-${status}`), get(`--hl-${tag}`)),
        ).toBeGreaterThanOrEqual(AA_NORMAL)
      })
    }
  }
})
