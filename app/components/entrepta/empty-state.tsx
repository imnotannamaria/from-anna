// Owned entrepta v4 EmptyState; illustration slot and page typography adapted.
import { cva } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center',
  {
    variants: {
      size: {
        sm: 'gap-2.5 px-4 py-6',
        md: 'gap-3 px-6 py-10',
        // a screen of its own: it takes the height it is given and sits in the middle of it
        page: 'w-full gap-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** A drawing above the title. */
  illustration?: React.ReactNode
  eyebrow?: React.ReactNode
  /** What is missing, in the reader's words: "No entries this month". */
  title: React.ReactNode
  /** The next step, not a welcome. */
  description?: React.ReactNode
  /** One action: create or connect when there is nothing yet, clear the filters when a filter found nothing. */
  action?: React.ReactNode
  /** `page` is a screen of its own, such as a 404: centered in the height it gets, with a bigger title. */
  size?: 'sm' | 'md' | 'page'
  /**
   * Makes the title a heading, 1 to 4. A `page` is an h1 unless you say otherwise; set 2 when the
   * page around it already has one. The other sizes keep a plain paragraph.
   */
  headingLevel?: 1 | 2 | 3 | 4
}

/**
 * A list or a widget with nothing in it, or with `size="page"` a whole screen:
 * a 404, an error, something that was removed. It says what is missing and
 * offers the one thing to do about it. No hooks, so a server file can render it.
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      illustration,
      title,
      eyebrow,
      description,
      action,
      size = 'md',
      headingLevel,
      className,
      ...props
    },
    ref,
  ) => {
    const page = size === 'page'
    const Title = headingLevel
      ? (`h${headingLevel}` as const)
      : page
        ? 'h1'
        : 'p'
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ size }), className)}
        {...props}
      >
        {illustration ? (
          <div data-illustration className="flex max-w-full justify-center">
            {illustration}
          </div>
        ) : null}
        {eyebrow ? <p className="meta state-eyebrow">{eyebrow}</p> : null}
        <div
          className={cn(
            'flex flex-col gap-1',
            page ? 'max-w-md gap-3' : 'max-w-sm',
          )}
        >
          <Title
            className={cn(
              'm-0 text-[var(--fg-primary)] [overflow-wrap:anywhere]',
              page ? 'display state-title' : 'font-mono text-mono-md',
            )}
          >
            {title}
          </Title>
          {description ? (
            <p
              className={cn(
                'm-0 font-sans text-[var(--fg-secondary)]',
                page ? 'state-lede' : 'text-body-md',
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {action ? (
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {action}
          </div>
        ) : null}
      </div>
    )
  },
)
EmptyState.displayName = 'EmptyState'

export { EmptyState, emptyStateVariants }
export type { EmptyStateProps }
