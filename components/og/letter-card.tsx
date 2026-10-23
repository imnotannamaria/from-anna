import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const size = { width: 1200, height: 630 }
const fontData = Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/newsreader-regular.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/newsreader-italic.ttf')),
])

/** Literal sizes/colors: Satori cannot resolve the app's CSS custom properties. */
export async function letterCard(kind: 'site' | 'letter') {
  const [regular, italic] = await fontData
  const mark = `data:image/png;base64,${(await readFile(join(process.cwd(), 'public/from-anna.png'))).toString('base64')}`
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f4f4f2',
          color: '#18181b',
          display: 'flex',
          padding: '54px 66px',
          fontFamily: 'Newsreader',
          backgroundImage:
            'linear-gradient(#e6e6e2 1px, transparent 1px), linear-gradient(90deg, #e6e6e2 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 24,
            top: 24,
            width: 1152,
            height: 582,
            display: 'flex',
            border: '1px solid #e4e4e2',
            borderRadius: 32,
            background: 'rgba(251,251,250,0.92)',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 710,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 40 }}>
            from{' '}
            <span
              style={{ fontStyle: 'italic', color: '#5a4cd6', marginLeft: 10 }}
            >
              anna
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 79,
              lineHeight: 1.03,
              letterSpacing: '-2px',
              marginBottom: 12,
            }}
          >
            <span>{kind === 'site' ? 'Letters I write' : 'A handwritten'}</span>
            <span>{kind === 'site' ? 'by hand.' : 'letter,'}</span>
            <span style={{ color: '#5a4cd6', fontStyle: 'italic' }}>
              {kind === 'site' ? 'For one person each.' : 'just for you.'}
            </span>
          </div>
          <div style={{ display: 'flex', color: '#52525b', fontSize: 23 }}>
            {kind === 'site'
              ? 'Ink, paper, a phone camera. Open source.'
              : 'A little ink. A little paper. Something to keep.'}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders a PNG, not browser HTML. */}
        <img
          src={mark}
          alt=""
          width={570}
          height={570}
          style={{
            position: 'absolute',
            right: -40,
            top: 20,
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Newsreader', data: regular, weight: 400, style: 'normal' },
        { name: 'Newsreader', data: italic, weight: 400, style: 'italic' },
      ],
    },
  )
}
