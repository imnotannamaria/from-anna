import { BrandMark } from '@/components/ui/brand-mark'
import type { Metadata } from 'next'
import { ScannedTranscription } from 'remark-scanned-page'

import { HomeLetter } from '@/components/home/home-letter'
import { HomeNavigation } from '@/components/home/home-navigation'
import { ExternalLink } from '@/components/ui/external-link'
import { Icon, type IconName } from '@/components/ui/icon'
import { Reveal } from '@/components/ui/reveal'
import { SegmentTrack } from '@/components/ui/segment-track'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'

const REPO = 'https://github.com/imnotannamaria/from-anna'
const PACKAGE = 'https://www.npmjs.com/package/remark-scanned-page'
export const metadata: Metadata = {
  title: 'from anna · handwritten letters, published',
  description:
    'Handwritten letters, photographed and published with an accessible transcription. A personal project, open source under MIT.',
  openGraph: {
    title: 'from anna',
    description: 'Ink, paper, a phone camera. Handwritten letters, published.',
  },
}
const OPENING = `Hi. You found the place where my letters live. You will not see any of them here. :mark[Each one has a single link, and I send it to a single person.]{c=important}

The photo is my handwriting. :mark[The text is available to screen readers too.]{c=note}

Try the chips above. They work like in a real letter. :mark[Want to send letters like this?]{c=ask} The code is below.`
const DEMO = `:::theme{label="about the move"}
I packed the books first.
:mark[They were the hardest part.]{c=important}

:mark[I kept the blue mug.]{c=note}
:mark[Do you still have yours?]{c=ask}
:::`
const STEPS: { icon: IconName; tone: string; title: string; body: string }[] = [
  {
    icon: 'photo',
    tone: 'brand',
    title: 'Write and photograph',
    body: 'Several pages, by hand. A phone photo is enough. Upload one photograph for each sheet.',
  },
  {
    icon: 'scan',
    tone: 'ask',
    title: 'A model reads it',
    body: 'A vision model turns the handwriting into text. I check the words against the original photograph.',
  },
  {
    icon: 'pen',
    tone: 'note',
    title: 'Mark what to read first',
    body: 'Correct the transcription, then add highlights in three kinds: important, note and question.',
  },
  {
    icon: 'send',
    tone: 'good',
    title: 'Publish, then know',
    body: 'Send the link. I can see if it was opened and answered with a reaction, without storing anyone’s IP.',
  },
]

export default function Home() {
  return (
    <main className="home" id="main-content">
      <HomeNavigation />
      <section id="top" className="home-hero">
        <Reveal className="home-intro">
          <p className="home-badge">
            <Icon name="pen" />
            open source · handwritten
          </p>
          <h1 className="display home-title">
            Letters I write by hand, <em>for one person each.</em>
          </h1>
          <p className="home-lede">
            I write in a notebook and photograph the pages. A model reads my
            handwriting. I fix what it got wrong, mark what matters and send one
            link.
          </p>
          <div className="home-actions">
            <a className="pill pill--solid" href="#run">
              <Icon name="code" />
              Run your own
            </a>
            <a className="pill" href="#package">
              <Icon name="package" />
              See the package
            </a>
          </div>
        </Reveal>
        <Reveal>
          <HomeLetter>
            <ScannedTranscription
              markdown={OPENING}
              className="letter-prose"
              knownTags={HIGHLIGHT_TAGS}
            />
            <p className="home-sign">Anna</p>
          </HomeLetter>
        </Reveal>
      </section>

      <Reveal className="home-section">
        <section id="how" aria-labelledby="how-title">
          <h2 className="display home-h2" id="how-title">
            Four steps, <em>one notebook.</em>
          </h2>
          <ol className="home-steps">
            {STEPS.map((step, index) => (
              <li className="surface" key={step.title}>
                <div className="home-step-top">
                  <span className="icon-tile" data-tone={step.tone}>
                    <Icon name={step.icon} />
                  </span>
                  <span className="meta" aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal className="home-section">
        <section id="syntax" aria-labelledby="syntax-title">
          <h2 className="display home-h2" id="syntax-title">
            Markdown in, <em>marked text out.</em>
          </h2>
          <div className="home-demo">
            <div>
              <p className="meta code-caption">Source · letter.md</p>
              <pre className="home-code" aria-label="Markdown source">
                <code>{DEMO}</code>
              </pre>
            </div>
            <div>
              <p className="meta code-caption">Rendered</p>
              <div className="home-render" data-revealed="true">
                <ScannedTranscription
                  markdown={DEMO}
                  className="letter-prose"
                  knownTags={HIGHLIGHT_TAGS}
                />
              </div>
            </div>
          </div>
          <p className="home-body home-body--quiet">
            The marks live in the markdown, so fixing a comma cannot shift them
            away from the words. Every kind has a color and its own underline
            style. The distinction survives in black and white, too.
          </p>
        </section>
      </Reveal>

      <Reveal className="home-section home-package-grid">
        <section
          id="package"
          className="surface home-package"
          aria-labelledby="package-title"
        >
          <span className="icon-tile" data-tone="ask">
            <Icon name="package" />
          </span>
          <h2 className="display home-h2" id="package-title">
            remark-scanned-page
          </h2>
          <p className="home-body">
            The reusable half: a remark plugin, a sanitize schema, a stylesheet
            and a React component. For journals, sketchbooks, class notes or
            letters. It does not choose your tags for you.
          </p>
          <pre className="home-code">
            <code>npm install remark-scanned-page</code>
          </pre>
          <div className="home-actions">
            <ExternalLink href={PACKAGE} className="pill pill--solid">
              On npm
              <Icon name="external" />
            </ExternalLink>
            <ExternalLink
              href={`${REPO}/tree/main/packages/remark-scanned-page`}
              className="pill"
            >
              Source
            </ExternalLink>
          </div>
        </section>
        <section
          className="surface home-privacy"
          aria-labelledby="privacy-title"
        >
          <span className="icon-tile" data-tone="good">
            <Icon name="check" />
          </span>
          <h2 className="display home-h2" id="privacy-title">
            What I count, <em>and what I don’t.</em>
          </h2>
          <ul className="privacy-list">
            <li>
              <Icon name="check" />
              Opened, reacted to, where it came from
            </li>
            <li>
              <Icon name="check" />
              Country and device type
            </li>
            <li>
              <Icon name="check" />
              No IPs, public accounts or letter previews
            </li>
          </ul>
          <p className="home-body">
            The letter stays out of search engines and link-preview images.
            There is no public list to browse.
          </p>
        </section>
      </Reveal>

      <Reveal className="home-section">
        <section id="run" aria-labelledby="run-title">
          <h2 className="display home-h2" id="run-title">
            Clone it. <em>It’s yours.</em>
          </h2>
          <div className="home-demo home-demo--run">
            <pre className="home-code">
              <code>{`git clone ${REPO}
cd from-anna
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev`}</code>
            </pre>
            <div className="home-setup">
              <h3>What you configure</h3>
              <ul>
                <li>
                  <Icon name="code" />
                  <div>
                    Database
                    <span>A Postgres database for letters and read events</span>
                  </div>
                </li>
                <li>
                  <Icon name="photo" />
                  <div>
                    Photo storage
                    <span>A private Vercel Blob store for the pages</span>
                  </div>
                </li>
                <li>
                  <Icon name="scan" />
                  <div>
                    Model key
                    <span>OpenRouter, for reading the handwriting</span>
                  </div>
                </li>
                <li>
                  <Icon name="pen" />
                  <div>
                    Auth<span>Clerk keys and an explicit author allowlist</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <p className="home-body home-body--quiet">
            Before transcribing, restrict model routing to providers that do not
            train on your data. Setup and environment variables are in the{' '}
            <ExternalLink href={`${REPO}/blob/main/README.md`}>
              README
            </ExternalLink>
            .
          </p>
          <div className="home-personal-note surface">
            <p>
              There is no sign up here. <em>This one is mine.</em> The code is
              free to clone.
            </p>
            <ExternalLink href={REPO} className="pill pill--solid">
              Get the code
              <Icon name="external" />
            </ExternalLink>
          </div>
        </section>
      </Reveal>

      <footer className="home-foot">
        <a
          href="#top"
          className="wordmark wordmark--mark"
          aria-label="from anna, back to top"
        >
          <BrandMark size={40} />
        </a>
        <p className="meta">written by hand, read on a screen</p>
        <nav className="island" aria-label="Footer">
          <SegmentTrack label="Project links">
            <ExternalLink href={REPO}>Source</ExternalLink>
            <ExternalLink href={PACKAGE}>Package</ExternalLink>
            <ExternalLink href={`${REPO}/blob/main/LICENSE`}>MIT</ExternalLink>
            <ExternalLink href="https://annamaria.app">annamaria.app</ExternalLink>
          </SegmentTrack>
        </nav>
      </footer>
    </main>
  )
}
