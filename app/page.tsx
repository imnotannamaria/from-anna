import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'from anna',
  description:
    'Handwritten letters, photographed and published, with a transcription you can actually read.',
}

/**
 * The front door.
 *
 * It has one job: say what this is, in the voice the letters are written in.
 * There is no list of letters and there never will be — every link is
 * unguessable and meant for one person, so an index would undo the whole
 * point of the slug.
 *
 * All CSS, no JavaScript. The entrance is one orchestrated reveal staggered
 * by `animation-delay`, which is more felt than a dozen scattered
 * micro-interactions would be.
 */
export default function Home() {
  return (
    <main className="home">
      <div className="home-inner">
        <p className="meta home-line" style={{ animationDelay: '80ms' }}>
          Ink, paper, a scanner
        </p>

        <h1 className="display home-title" style={{ animationDelay: '160ms' }}>
          from&nbsp;<em>anna</em>
        </h1>

        <span
          className="rule home-rule"
          aria-hidden="true"
          style={{ animationDelay: '280ms' }}
        />

        <p className="home-lede" style={{ animationDelay: '360ms' }}>
          I write letters by hand, photograph the pages, and publish them at a
          link meant for one person. The photograph is what you see. The
          transcription underneath it is what you can{' '}
          <mark data-c="important">actually read</mark> — because a picture of
          handwriting is invisible to a screen reader, and a letter nobody can
          read is not a letter.
        </p>

        <p className="home-lede home-lede--quiet" style={{ animationDelay: '460ms' }}>
          If you were sent one, you already have the link. There is no index
          here on purpose: every letter is written for a single person, and a
          list of them would undo that.
        </p>

        <p className="home-foot" style={{ animationDelay: '580ms' }}>
          The highlighting layer is open source, as{' '}
          <a
            href="https://github.com/imnotannamaria/from-anna"
            className="home-link"
          >
            remark-scanned-page
          </a>
          .
        </p>
      </div>
    </main>
  )
}
