type Props = {
  children: string
  /** Roughly how long the whole line takes, in ms. */
  duration?: number
  delay?: number
  className?: string
}

/**
 * A line that types itself out.
 *
 * All CSS: the width animates in `steps(n)` where n is the character count,
 * which is why the string has to be measured here and handed to the
 * stylesheet. No JavaScript means it works in a `loading.tsx`, which is a
 * file that sometimes exists for four hundred milliseconds and cannot afford
 * to wait for hydration to say anything.
 *
 * The text is in the DOM in full from the first frame — it is clipped, not
 * built up — so a screen reader reads the whole sentence at once rather than
 * one letter at a time, and `prefers-reduced-motion` simply shows it.
 *
 * `ch` assumes a monospace face, which is what the metadata is set in
 * anyway; the caret is a right border that blinks.
 */
export function TypeLine({
  children,
  duration = 1600,
  delay = 0,
  className,
}: Props) {
  return (
    <span
      className={['type-line', className].filter(Boolean).join(' ')}
      style={{
        ['--type-chars' as string]: children.length,
        ['--type-duration' as string]: `${duration}ms`,
        ['--type-delay' as string]: `${delay}ms`,
      }}
    >
      {children}
    </span>
  )
}
