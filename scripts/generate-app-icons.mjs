import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createElement } from 'react'

const { ImageResponse } = createRequire(import.meta.url)('next/og')
const mark = `data:image/png;base64,${(await readFile(new URL('../public/from-anna.png', import.meta.url))).toString('base64')}`

// Compose the brand artwork on ink without changing the source bitmap.
// Static metadata files also bypass the letter-session middleware matcher.
for (const [name, size] of [
  ['icon', 64],
  ['apple-icon', 180],
]) {
  const response = new ImageResponse(
    createElement(
      'div',
      {
        style: {
          width: size,
          height: size,
          background: '#18181b',
          borderRadius: size * 0.22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
      },
      createElement('img', {
        src: mark,
        width: size * 1.8,
        height: size * 1.8,
        alt: '',
        style: { position: 'absolute', left: -size * 0.4, top: -size * 0.4 },
      }),
    ),
    { width: size, height: size },
  )
  await writeFile(
    new URL(`../app/${name}.png`, import.meta.url),
    Buffer.from(await response.arrayBuffer()),
  )
}
