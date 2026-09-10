import type { Metadata } from 'next'

import { ScannedTranscription } from 'remark-scanned-page'

import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'

const REPO = 'https://github.com/imnotannamaria/from-anna'
const PACKAGE = `${REPO}/tree/main/packages/remark-scanned-page`
const PORTFOLIO = 'https://annamaria.app'

export const metadata: Metadata = {
  title: 'from anna — handwritten letters, published',
  description:
    'Write a letter by hand, photograph the pages, and publish them at an unguessable link with a transcription anyone can read. Open source; the highlighting layer is a package.',
  openGraph: {
    title: 'from anna',
    description:
      'Handwritten letters, photographed and published, with a transcription you can actually read.',
  },
}

/**
 * The demonstration is the real thing.
 *
 * This markdown goes through the same package, the same sanitize schema and
 * the same stylesheet a published letter does. A screenshot would drift from
 * the code the first time either changed; this cannot.
 */
/**
 * The note on the front door.
 *
 * It is a letter about the site, rendered by the same package as a real one —
 * which is a better demonstration than a specimen would be, and it answers
 * the question anyone landing here actually has.
 *
 * Not `aria-hidden`, unlike the opening photograph on a letter page: this is
 * the only place these words appear, so hiding them would hide content.
 */
const OPENING = `Hi, whoever is testing this site. I'm Anna,
and I built it because:

A few days ago I got a notebook and realised it
had been a while since I had actually
:mark[WRITTEN SOMETHING BY HAND]{c=important} (lol).

:::theme{label="and it matters more now"}
With AI in the middle of how most things get
made, I think a handwritten letter
:mark[means even more]{c=note} than it used to.
:::`

const DEMO = `:::passage
It has :mark[one of the better weeks]{c=important}
in a while, and most of it was small.
:::

:::theme{label="what I actually built"}
A page that photographs itself and,
with :mark[one thing worth noting]{c=note}
in the middle, transcribes it.
:::`

/**
 * The front door.
 *
 * It has two jobs: say plainly what this is, and hand over everything someone
 * would need to run their own. There is no list of letters and there never
 * will be — every link is unguessable and meant for one person, so an index
 * would undo the whole point of the slug.
 *
 * All CSS, no JavaScript. The entrance is one orchestrated reveal staggered
 * by `animation-delay`, which is more felt than a dozen scattered
 * micro-interactions would be.
 */
export default function Home() {
  return (
    <main className="home">
      <section className="home-hero">
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

          <p className="home-actions" style={{ animationDelay: '480ms' }}>
            <a href={REPO} className="pill pill--solid">
              Read the source <span aria-hidden="true">→</span>
            </a>
            <a href={PACKAGE} className="pill">
              The package
            </a>
          </p>

          <p className="meta home-quiet" style={{ animationDelay: '600ms' }}>
            No index here, on purpose · MIT
          </p>
        </div>

        {/*
          A stack of sheets with a note on top of it — laid out as a letter,
          rendered by the same package a real one goes through, and saying the
          thing anyone landing here actually wants to know.

          Read by everyone, unlike the opening photograph on a letter page:
          this is the only place these words appear.
        */}
        <div className="home-stack">
          <div className="home-stack-sheet" data-revealed="true">
            <p className="home-stack-mark">
              from anna <em>to you</em>
            </p>
            <ScannedTranscription
              markdown={OPENING}
              className="letter-prose"
              knownTags={HIGHLIGHT_TAGS}
            />
            <p className="home-sign">
              — Anna,{' '}
              <a href={PORTFOLIO} className="home-link">
                annamaria.app
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="how">
        <p className="meta">How it works</p>
        <h2 className="display home-h2" id="how">
          Four steps, and the second one is the only clever part.
        </h2>

        <ol className="home-steps">
          <li>
            <span className="meta home-step-n" aria-hidden="true">
              01
            </span>
            <h3 className="home-step-h">Write it by hand</h3>
            <p>
              In a notebook, with a pen. Photograph each sheet and upload the
              photos; they are resized and re-encoded in the browser before
              they leave it, so nothing full-resolution ever travels.
            </p>
          </li>
          <li>
            <span className="meta home-step-n" aria-hidden="true">
              02
            </span>
            <h3 className="home-step-h">A vision model reads it</h3>
            <p>
              One call with every sheet in it returns plain markdown, split on{' '}
              <code>---</code>. Recognising cursive is the expensive part of
              the pipeline, and the dangerous failure is a model inventing a
              plausible word — so checking the transcription against the photo
              is a required step, not an optional one.
            </p>
          </li>
          <li>
            <span className="meta home-step-n" aria-hidden="true">
              03
            </span>
            <h3 className="home-step-h">Mark what to read first</h3>
            <p>
              Highlights are written into the markdown itself, as directives.
              No table of offsets, no join — the <code>.md</code> file carries
              everything, so fixing a comma cannot break the highlighting.
            </p>
          </li>
          <li>
            <span className="meta home-step-n" aria-hidden="true">
              04
            </span>
            <h3 className="home-step-h">Publish, and find out</h3>
            <p>
              The link is three readable words plus a random token: sayable out
              loud, and not something anyone can stumble onto. One row per
              opening, one mark when the last block is reached. No IP, ever.
            </p>
          </li>
        </ol>
      </section>

      <section className="home-section" aria-labelledby="syntax">
        <p className="meta">The syntax</p>
        <h2 className="display home-h2" id="syntax">
          The highlighting lives inside the markdown.
        </h2>
        <p className="home-body">
          The obvious alternative is plain text in a database with the
          annotations stored as offsets. It breaks the first time you fix a
          comma, and a transcription of handwriting exists to be corrected.
        </p>

        <div className="home-demo">
          <pre className="home-code" aria-label="Markdown source">
            <code>{DEMO}</code>
          </pre>

          {/*
            Rendered here by the same package, through the same sanitize
            schema, with the same stylesheet a published letter uses.
            `data-revealed` because there is no scroll observer on this page:
            the highlights are simply painted.
          */}
          <div className="home-render" data-revealed="true">
            <ScannedTranscription
              markdown={DEMO}
              className="letter-prose"
              knownTags={HIGHLIGHT_TAGS}
            />
          </div>
        </div>

        <p className="home-body home-body--quiet">
          Every tag carries a colour <em>and</em> its own underline — solid,
          dotted, wavy — so the distinction survives in greyscale. Contrast is
          measured against the highlight fill rather than the page, in both
          themes, by a test that parses the stylesheet.
        </p>
      </section>

      <section className="home-section" aria-labelledby="package">
        <p className="meta">The reusable half</p>
        <h2 className="display home-h2" id="package">
          <em>remark-scanned-page</em>
        </h2>
        <p className="home-body">
          Photographing a page and calling a vision model does not generalise
          into a library. A highlight layer with an accessible fallback does —
          anyone publishing a journal, a sketchbook, class notes or a zine has
          the same problem. So that half is a package: the remark plugin, the
          sanitize schema, the stylesheet and the React component, with no
          opinion at all about what your tags are called.
        </p>
        <p className="home-body">
          It lives in this repository as a workspace, which is what makes a
          second copy of the pipeline impossible rather than merely
          discouraged. It is not on npm yet.
        </p>
        <p className="home-actions">
          <a href={PACKAGE} className="pill">
            The package <span aria-hidden="true">→</span>
          </a>
        </p>
      </section>

      <section className="home-section" aria-labelledby="run">
        <p className="meta">Run your own</p>
        <h2 className="display home-h2" id="run">
          It is a Next app. Clone it.
        </h2>

        <pre className="home-code home-code--wide">
          <code>{`git clone ${REPO}
cd from-anna
npm install
cp .env.example .env.local   # fill it in
npm run db:migrate
npm run dev`}</code>
        </pre>

        <p className="home-body">
          You will need a Postgres database, a <strong>private</strong> Vercel
          Blob store, an OpenRouter key and a Clerk application. The photograph
          is the letter&rsquo;s content, which is why the blob store has to be
          private: a public URL would outlive both unpublishing and expiry, and
          the letter page would 404 while the photograph stayed reachable
          forever.
        </p>

        <p className="home-body">
          One setting comes before your first model call:{' '}
          <strong>
            restrict routing to providers that do not train on your input and
            output
          </strong>
          . Several free models say in their own description that prompts may
          be used for training, and what you are sending is a photograph of a
          personal letter.
        </p>
      </section>

      <section className="home-note" aria-labelledby="note">
        <div className="home-note-inner">
          <p className="meta">A note</p>
          <p className="display home-note-line" id="note">
            This one is mine. <em>Yours is a clone away.</em>
          </p>
          <p className="home-body">
            There is no sign-up here and there is not going to be one. Every
            letter costs a model call and a little storage, and running that
            for other people is a bill and a support inbox rather than a
            notebook — so this instance stays personal.
          </p>
          <p className="home-body">
            The code is another matter. All of it is open source under MIT: the
            app, the pipeline, the package. If you want this, take it and run
            it, and it is yours rather than an account on something of mine.
          </p>
          <p className="home-actions">
            <a href={REPO} className="pill pill--solid">
              Read the source <span aria-hidden="true">→</span>
            </a>
            <a href={`${REPO}/tree/main/docs`} className="pill">
              Why it is the way it is
            </a>
          </p>
        </div>
      </section>

      <footer className="home-foot">
        <p className="meta">
          <a href={REPO} className="home-link">
            source
          </a>
          <span aria-hidden="true"> · </span>
          <a href={PACKAGE} className="home-link">
            remark-scanned-page
          </a>
          <span aria-hidden="true"> · </span>
          <a href={`${REPO}/blob/main/LICENSE`} className="home-link">
            MIT
          </a>
          <span aria-hidden="true"> · </span>
          <a href={PORTFOLIO} className="home-link">
            anna
          </a>
        </p>
      </footer>
    </main>
  )
}
