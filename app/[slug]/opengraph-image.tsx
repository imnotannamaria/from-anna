import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'A handwritten letter'

/**
 * The link preview.
 *
 * **None of the letter's text goes in here, and neither does the photograph.**
 * A preview is fetched by whatever app the link is pasted into, cached by
 * that third party, and shown to anyone who can see the message. It outlives
 * unpublishing and it outlives `expiresAt`, which is exactly what the private
 * Blob store exists to prevent everywhere else.
 *
 * So the card says a letter exists and nothing about what it says.
 *
 * There is no `params` lookup on purpose: the image is identical for every
 * letter, which means it is also one cached asset rather than one render per
 * slug.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          background: '#09090b',
          color: '#fafafa',
          // satori does not resolve CSS custom properties: a var() here
          // renders at size zero. Every value is a literal.
          fontSize: 64,
        }}
      >
        <div style={{ fontSize: 72, letterSpacing: '-0.02em' }}>from anna</div>
        <div style={{ fontSize: 30, color: '#a1a1aa' }}>
          A handwritten letter
        </div>
        <div
          style={{
            width: 120,
            height: 2,
            background: '#e85a8a',
          }}
        />
      </div>
    ),
    size,
  )
}
