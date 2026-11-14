import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ScannedTranscription } from 'remark-scanned-page'

import { HomeLetter } from '@/components/home/home-letter'
import { HomeNavigation } from '@/components/home/home-navigation'
import { BrandMark } from '@/components/ui/brand-mark'
import { ExternalLink } from '@/components/ui/external-link'
import { Icon, type IconName } from '@/components/ui/icon'
import { Reveal } from '@/components/ui/reveal'
import { SegmentTrack } from '@/components/ui/segment-track'
import { HTML_LANG, isLocale, localePath } from '@/lib/i18n/locales'
import { pageLocale, type LocaleParams } from '@/lib/i18n/page'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'

const REPO = 'https://github.com/imnotannamaria/from-anna'
const PACKAGE = 'https://www.npmjs.com/package/remark-scanned-page'

/**
 * The front page in the language of its address, and a pointer to the other
 * one: `hreflang` is how a crawler that sends no language finds Portuguese.
 */
export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : 'en'
  const t = await getTranslations({ locale, namespace: 'meta.home' })
  return {
    title: { absolute: t('title') },
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      locale: locale === 'pt' ? 'pt_BR' : 'en_US',
    },
    alternates: {
      canonical: localePath(locale, '/'),
      languages: {
        [HTML_LANG.en]: localePath('en', '/'),
        [HTML_LANG.pt]: localePath('pt', '/'),
        'x-default': localePath('en', '/'),
      },
    },
  }
}

const STEPS: { key: 'photo' | 'scan' | 'pen' | 'send'; icon: IconName; tone: string }[] = [
  { key: 'photo', icon: 'photo', tone: 'brand' },
  { key: 'scan', icon: 'scan', tone: 'ask' },
  { key: 'pen', icon: 'pen', tone: 'note' },
  { key: 'send', icon: 'send', tone: 'good' },
]

export default async function Home({ params }: LocaleParams) {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: 'home' })
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>

  return (
    <main className="home" id="main-content">
      <HomeNavigation />
      <section id="top" className="home-hero">
        <Reveal className="home-intro">
          <p className="home-badge">
            <Icon name="pen" />
            {t('hero.badge')}
          </p>
          <h1 className="display home-title">
            {t.rich('hero.title', { em })}
          </h1>
          <p className="home-lede">
            {t('hero.lede')}
          </p>
          <div className="home-actions">
            <a className="pill pill--solid" href="#run">
              <Icon name="code" />
              {t('hero.run')}
            </a>
            <a className="pill" href="#package">
              <Icon name="package" />
              {t('hero.package')}
            </a>
          </div>
        </Reveal>
        <Reveal>
          <HomeLetter>
            <ScannedTranscription
              markdown={t.raw('demo.opening')}
              className="letter-prose"
              knownTags={HIGHLIGHT_TAGS}
            />
            <p className="home-sign">{t('demo.sign')}</p>
          </HomeLetter>
        </Reveal>
      </section>

      <Reveal className="home-section">
        <section id="how" aria-labelledby="how-title">
          <h2 className="display home-h2" id="how-title">
            {t.rich('how.title', { em })}
          </h2>
          <ol className="home-steps">
            {STEPS.map((step, index) => (
              <li className="surface" key={step.key}>
                <div className="home-step-top">
                  <span className="icon-tile" data-tone={step.tone}>
                    <Icon name={step.icon} />
                  </span>
                  <span className="meta" aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <h3>{t(`how.${step.key}.title`)}</h3>
                <p>{t(`how.${step.key}.body`)}</p>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal className="home-section">
        <section id="syntax" aria-labelledby="syntax-title">
          <h2 className="display home-h2" id="syntax-title">
            {t.rich('syntax.title', { em })}
          </h2>
          <div className="home-demo">
            <div>
              <p className="meta code-caption">{t('syntax.source')}</p>
              <pre className="home-code" aria-label={t('syntax.sourceLabel')}>
                <code>{t.raw('syntax.sample')}</code>
              </pre>
            </div>
            <div>
              <p className="meta code-caption">{t('syntax.rendered')}</p>
              <div className="home-render" data-revealed="true">
                <ScannedTranscription
                  markdown={t.raw('syntax.sample')}
                  className="letter-prose"
                  knownTags={HIGHLIGHT_TAGS}
                />
              </div>
            </div>
          </div>
          <p className="home-body home-body--quiet">
            {t('syntax.note')}
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
            {t('package.body')}
          </p>
          <pre className="home-code">
            <code>npm install remark-scanned-page</code>
          </pre>
          <div className="home-actions">
            <ExternalLink href={PACKAGE} className="pill pill--solid">
              {t('package.npm')}
              <Icon name="external" />
            </ExternalLink>
            <ExternalLink
              href={`${REPO}/tree/main/packages/remark-scanned-page`}
              className="pill"
            >
              {t('package.source')}
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
            {t.rich('privacy.title', { em })}
          </h2>
          <ul className="privacy-list">
            <li>
              <Icon name="check" />
              {t('privacy.opened')}
            </li>
            <li>
              <Icon name="check" />
              {t('privacy.device')}
            </li>
            <li>
              <Icon name="check" />
              {t('privacy.never')}
            </li>
          </ul>
          <p className="home-body">
            {t('privacy.body')}
          </p>
        </section>
      </Reveal>

      <Reveal className="home-section">
        <section id="run" aria-labelledby="run-title">
          <h2 className="display home-h2" id="run-title">
            {t.rich('run.title', { em })}
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
              <h3>{t('run.setup')}</h3>
              <ul>
                <li>
                  <Icon name="code" />
                  <div>
                    {t('run.db.title')}
                    <span>{t('run.db.body')}</span>
                  </div>
                </li>
                <li>
                  <Icon name="photo" />
                  <div>
                    {t('run.photos.title')}
                    <span>{t('run.photos.body')}</span>
                  </div>
                </li>
                <li>
                  <Icon name="scan" />
                  <div>
                    {t('run.model.title')}
                    <span>{t('run.model.body')}</span>
                  </div>
                </li>
                <li>
                  <Icon name="pen" />
                  <div>
                    {t('run.auth.title')}
                    <span>{t('run.auth.body')}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <p className="home-body home-body--quiet">
            {t.rich('run.note', {
              readme: (chunks) => (
                <ExternalLink href={`${REPO}/blob/main/README.md`}>
                  {chunks}
                </ExternalLink>
              ),
            })}
          </p>
          <div className="home-personal-note surface">
            <p>
              {t.rich('run.personal', { em })}
            </p>
            <ExternalLink href={REPO} className="pill pill--solid">
              {t('run.cta')}
              <Icon name="external" />
            </ExternalLink>
          </div>
        </section>
      </Reveal>

      <footer className="home-foot">
        <a
          href="#top"
          className="wordmark wordmark--mark"
          aria-label={t('foot.top')}
        >
          <BrandMark size={40} />
        </a>
        <p className="meta">{t('foot.line')}</p>
        <nav className="island" aria-label={t('foot.nav')}>
          <SegmentTrack label={t('foot.links')}>
            <ExternalLink href={REPO}>{t('foot.source')}</ExternalLink>
            <ExternalLink href={PACKAGE}>{t('foot.package')}</ExternalLink>
            <ExternalLink href={`${REPO}/blob/main/LICENSE`}>MIT</ExternalLink>
            <ExternalLink href="https://annamaria.app">annamaria.app</ExternalLink>
          </SegmentTrack>
        </nav>
      </footer>
    </main>
  )
}
