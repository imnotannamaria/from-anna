import type { Metadata } from 'next'

import { ScannedTranscription } from 'remark-scanned-page'

import { ExternalLink } from '@/components/ui/external-link'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'

const REPO = 'https://github.com/imnotannamaria/from-anna'
/** Where you install it from. The source lives at `${REPO}` alongside it. */
const PACKAGE = 'https://www.npmjs.com/package/remark-scanned-page'
const PACKAGE_SOURCE = `${REPO}/tree/main/packages/remark-scanned-page`
const PORTFOLIO = 'https://annamaria.app'

export const metadata: Metadata = {
  title: 'from anna · handwritten letters, published',
  description:
    'I write letters by hand, take a photo of the pages and publish them with a transcription anyone can read. Open source, and the highlighting part is a package.',
  openGraph: {
    title: 'from anna',
    description:
      'Handwritten letters, photographed and published, with a transcription you can actually read.',
  },
}

/**
 * The note on the front door.
 *
 * A letter about the site, rendered by the same package as a real one, which
 * is a better demonstration than a specimen would be and answers the question
 * anyone landing here actually has.
 *
 * Not `aria-hidden`: this is the only place these words appear.
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

/**
 * The demonstration is the real thing: the same package, the same sanitize
 * schema and the same stylesheet a published letter goes through.
 *
 * Every line is short enough not to wrap at 390px. A directive broken across
 * two lines on a phone, with `{c=important}` alone on the second, is what the
 * first version did.
 */
const DEMO = `:::passage
It has been
:mark[a good week]{c=important}.
Most of it was small.
:::

:::theme{label="what I built"}
A page that reads
my handwriting, and
:mark[one thing]{c=note} to note.
:::`

/**
 * The front door.
 *
 * Two jobs: say plainly what this is, and hand over what someone would need
 * to run their own. There is no list of letters and there never will be.
 *
 * Written the way the README and GOAL are: first person, short sentences,
 * no em dashes.
 */
export default function Home() {
  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-inner">
          <p className="meta home-line" style={{ animationDelay: '80ms' }}>
            Ink, paper, a phone camera
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
            I write letters by hand, take a photo of the pages, and publish them
            at a link meant for one person. The photo is what you see. The
            transcription is what you can{' '}
            <mark data-c="important">actually read</mark>, because a picture of
            handwriting is invisible to a screen reader. And a letter nobody can
            read isn&rsquo;t much of a letter.
          </p>

          <p className="home-actions" style={{ animationDelay: '480ms' }}>
            <ExternalLink href={REPO} className="pill pill--solid">
              Read the source <span aria-hidden="true">→</span>
            </ExternalLink>
            <ExternalLink href={PACKAGE} className="pill">
              The package
            </ExternalLink>
          </p>

          <p className="meta home-quiet" style={{ animationDelay: '600ms' }}>
            No index here, on purpose · MIT
          </p>
        </div>

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
              Anna ·{' '}
              <ExternalLink href={PORTFOLIO} className="home-link">
                annamaria.app
              </ExternalLink>
            </p>
          </div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="how">
        <p className="meta">How it works</p>
        <h2 className="display home-h2" id="how">
          Four steps. Only the second one is clever.
        </h2>

        <ol className="home-steps">
          <li>
            <span className="meta home-step-n" aria-hidden="true">
              01
            </span>
            <h3 className="home-step-h">Write it by hand</h3>
            <p>
              In a notebook, with a pen. Then I take a photo of each page and
              upload them. They get resized right here in the browser, so
              nothing huge ever gets sent. Photos straight off an iPhone work
              too.
            </p>
          </li>
          <li>
            <span className="meta home-step-n" aria-hidden="true">
              02
            </span>
            <h3 className="home-step-h">A vision model reads it</h3>
            <p>
              All the pages go to the model in one call, and it sends back plain
              markdown, one block per page. Reading handwriting is the expensive
              part. The scary part is a model inventing a word that looks right,
              so I always check the transcription against the photo.
            </p>
          </li>
          <li>
            <span className="meta home-step-n" aria-hidden="true">
              03
            </span>
            <h3 className="home-step-h">Mark what to read first</h3>
            <p>
              The highlights live inside the markdown itself. No table of
              positions, nothing to keep in sync, so fixing a comma can&rsquo;t
              break them.
            </p>
          </li>
          <li>
            <span className="meta home-step-n" aria-hidden="true">
              04
            </span>
            <h3 className="home-step-h">Publish, and find out</h3>
            <p>
              Each letter gets its own link. I get one number when someone opens
              it and another when they reach the end. That&rsquo;s all that gets
              counted. No IP, ever.
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
          The obvious way is plain text in a database with the highlights saved
          as positions. That breaks the first time you fix a comma, and a
          handwritten transcription is going to get fixed a lot.
        </p>

        <div className="home-demo">
          <pre className="home-code" aria-label="Markdown source">
            <code>{DEMO}</code>
          </pre>

          <div className="home-render" data-revealed="true">
            <ScannedTranscription
              markdown={DEMO}
              className="letter-prose"
              knownTags={HIGHLIGHT_TAGS}
            />
          </div>
        </div>

        <p className="home-body home-body--quiet">
          Every tag has a colour and its own underline (solid, dotted or wavy),
          so you can still tell them apart in black and white. The contrast is
          checked against the highlight itself, not the page, by a test that
          reads the stylesheet.
        </p>
      </section>

      <section className="home-section" aria-labelledby="package">
        <p className="meta">The reusable half</p>
        <h2 className="display home-h2" id="package">
          <em>remark-scanned-page</em>
        </h2>
        <p className="home-body">
          Taking a photo and calling a model isn&rsquo;t really a library. A
          highlight layer with an accessible fallback is. Anyone publishing a
          journal, a sketchbook, class notes or a zine has the same problem, so
          that half became a package: the remark plugin, the sanitize schema,
          the stylesheet and the React component. It doesn&rsquo;t care what
          your tags are called.
        </p>
        <p className="home-body">
          It lives in this same repo, so there&rsquo;s only ever one copy of it,
          and it publishes from here too.
        </p>

        <pre className="home-code home-code--wide">
          <code>npm install remark-scanned-page</code>
        </pre>

        <p className="home-actions">
          <ExternalLink href={PACKAGE} className="pill pill--solid">
            On npm <span aria-hidden="true">→</span>
          </ExternalLink>
          <ExternalLink href={PACKAGE_SOURCE} className="pill">
            Its source
          </ExternalLink>
        </p>
      </section>

      <section className="home-section" aria-labelledby="run">
        <p className="meta">Run your own</p>
        <h2 className="display home-h2" id="run">
          It&rsquo;s a Next app. Clone it.
        </h2>

        <pre className="home-code home-code--wide">
          <code>{`git clone ${REPO}
cd from-anna
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev`}</code>
        </pre>

        <p className="home-body">
          You&rsquo;ll need a Postgres database, a <strong>private</strong>{' '}
          Vercel Blob store, an OpenRouter key and a Clerk app. The blob store
          has to be private because the photo is the letter. A public URL would
          keep working after the letter is unpublished or expired.
        </p>

        <p className="home-body">
          One setting before your first model call:{' '}
          <strong>
            restrict routing to providers that don&rsquo;t train on your data
          </strong>
          . Some free models say right in their description that prompts can be
          used for training, and what you&rsquo;re sending is a photo of a
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
            There&rsquo;s no sign up here, and there won&rsquo;t be. Every letter
            costs a model call and a bit of storage, and doing that for other
            people turns a notebook into a bill and a support inbox. So this one
            stays personal.
          </p>
          <p className="home-body">
            The code is a different story. All of it is open source under MIT:
            the app, the pipeline, the package. If you want this, take it and run
            it. Then it&rsquo;s yours, not an account on something of mine. :)
          </p>
          <p className="home-actions">
            <ExternalLink href={REPO} className="pill pill--solid">
              Read the source <span aria-hidden="true">→</span>
            </ExternalLink>
            <ExternalLink href={`${REPO}/tree/main/docs`} className="pill">
              Why it&rsquo;s built this way
            </ExternalLink>
          </p>
        </div>
      </section>

      <footer className="home-foot">
        <p className="meta">
          <ExternalLink href={REPO} className="home-link">
            source
          </ExternalLink>
          <span aria-hidden="true"> · </span>
          <ExternalLink href={PACKAGE} className="home-link">
            remark-scanned-page
          </ExternalLink>
          <span aria-hidden="true"> · </span>
          <ExternalLink href={`${REPO}/blob/main/LICENSE`} className="home-link">
            MIT
          </ExternalLink>
          <span aria-hidden="true"> · </span>
          <ExternalLink href={PORTFOLIO} className="home-link">
            anna
          </ExternalLink>
        </p>
      </footer>
    </main>
  )
}
