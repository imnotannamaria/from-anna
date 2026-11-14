import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

import { EmptyState } from '@/app/components/entrepta/empty-state'
import { BrandMark } from '@/components/ui/brand-mark'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TypeLine } from '@/components/ui/type-line'
import { isLocale, localePath } from '@/lib/i18n/locales'

/**
 * The 404.
 *
 * This is what a wrong link gets, and it is also what an unpublished letter,
 * an expired one, and someone else's letter get. **It must read the same for
 * all four.** Anything that distinguishes "never existed" from "not yours"
 * hands back the one fact the unguessable slug exists to withhold — which is
 * also why the letter route answers 404 rather than 403.
 *
 * So the page says nothing about what was asked for. It is a blank sheet,
 * which is the honest picture of the situation and happens to be the right
 * one for a site made of letters.
 *
 * One component for both roots: the site's, in the language the address was
 * written in, and the desk's, in English. A not-found page gets no props and no
 * language when its metadata is resolved, so its tab is titled by the layout:
 * the name of the site, which is the same in both languages. Next adds
 * `noindex` to a 404 itself.
 */
export async function NotFoundView() {
  const t = await getTranslations('states.notFound')
  const locale = await getLocale()

  return (
    <main id="main-content" className="state">
      <div className="state-inner">
        <ThemeToggle />
        <EmptyState
          size="page"
          illustration={<BrandMark size={90} />}
          eyebrow={<TypeLine duration={1400}>{t('eyebrow')}</TypeLine>}
          title={t.rich('title', { em: (chunks) => <em>{chunks}</em> })}
          description={t('body')}
          action={
            <Link
              href={localePath(isLocale(locale) ? locale : 'en', '/')}
              className="pill"
            >
              {t('action')}
            </Link>
          }
        />
      </div>
    </main>
  )
}
