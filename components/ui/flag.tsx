import type { Locale } from '@/lib/i18n/locales'

/**
 * A language, as its flag. SVG and not emoji: Windows does not draw flag
 * emoji, it prints the letters "BR" and "US" instead.
 *
 * The colours are the flags' own, fixed on purpose. They are not an accent of
 * the page, so they do not derive from a token. English is the US flag.
 *
 * Always decorative: whatever carries it says the language in words.
 */
export function Flag({ locale, size = 18 }: { locale: Locale; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={Math.round(size * 0.7)}
      viewBox="0 0 20 14"
      className="flag"
    >
      {locale === 'pt' ? (
        <>
          <rect width="20" height="14" fill="#009c3b" />
          <path d="M10 1.7 18.2 7 10 12.3 1.8 7z" fill="#ffdf00" />
          <circle cx="10" cy="7" r="3" fill="#002776" />
        </>
      ) : (
        <>
          <rect width="20" height="14" fill="#ffffff" />
          <path
            d="M0 0h20v2H0zM0 4h20v2H0zM0 8h20v2H0zM0 12h20v2H0z"
            fill="#b22234"
          />
          <rect width="9" height="8" fill="#3c3b6e" />
        </>
      )}
    </svg>
  )
}
