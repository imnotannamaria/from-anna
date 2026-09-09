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
const CSS = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)

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

function blockFor(selector: string): Map<string, string> {
  // The block that actually declares the highlight tokens, not every :root.
  const pattern = new RegExp(
    `${selector}\\s*\\{([^}]*--hl-important[^}]*)\\}`,
    'm',
  )
  const match = CSS.match(pattern)
  if (!match) throw new Error(`No highlight block for ${selector}`)
  return collectVars(match[1])
}

const globals = collectVars(CSS)
const darkHighlights = blockFor(':root')
const lightHighlights = blockFor(':root\\[data-mode="light"\\]')

const modes = [
  { name: 'dark', highlights: darkHighlights, fg: resolve(globals, '--fg-primary') },
  // The light block redeclares --fg-primary, and `collectVars` keeps the last
  // declaration, so this is read from the light-mode block directly.
  {
    name: 'light',
    highlights: lightHighlights,
    fg: '#09090b',
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

    it(`${mode.name}: every highlight is visible against the canvas`, () => {
      // A fill indistinguishable from the page is not a highlight.
      const canvas = mode.name === 'dark' ? resolve(globals, '--bg-canvas') : '#fafafa'
      for (const tag of TAGS) {
        const fill = mode.highlights.get(`--hl-${tag}`)!
        expect(
          contrastRatio(canvas, fill),
          `${mode.name} ${tag} against canvas`,
        ).toBeGreaterThan(1.2)
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

    expect(styles.every(Boolean), 'every tag needs a decoration style').toBe(true)
    expect(new Set(styles).size, `styles were ${styles.join(', ')}`).toBe(3)
  })

  it('keeps the two rules that fail silently', () => {
    const base = PACKAGE_CSS.match(/mark\[data-c\]\s*\{([^}]*)\}/m)?.[1] ?? ''

    // Black text on a dark fill in dark mode.
    expect(base).toMatch(/color:\s*inherit/)
    // Padding only on the first and last line of a wrapped highlight.
    expect(base).toMatch(/box-decoration-break:\s*clone/)
  })
})
