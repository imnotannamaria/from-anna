// Owned entrepta v4 Accordion; application icon and utility imports adapted.
'use client'

import { Icon } from '@/components/ui/icon'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import * as React from 'react'
import { cn } from '@/lib/utils'
import './accordion.css'

/**
 * Sections that open in place: a category and its entries, a question and its
 * answer. `type="single"` keeps one open, `type="multiple"` lets several.
 * Up and down move between headers, Home and End jump to the ends.
 */
const Accordion = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={cn(
      'flex flex-col border-t border-[var(--border-subtle)]',
      className,
    )}
    {...props}
  />
))
Accordion.displayName = 'Accordion'

const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-[var(--border-subtle)]', className)}
    {...props}
  />
))
AccordionItem.displayName = 'AccordionItem'

interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  /** A value on the right that is part of the header's name, such as an Amount. */
  trailing?: React.ReactNode
  /** Buttons beside the header, outside it, so a click on them does not toggle it. */
  actions?: React.ReactNode
  /** The header's level in the page. */
  headingLevel?: 2 | 3 | 4
}

/**
 * The header. The caret turns, the title shortens before the trailing value
 * does, and the actions sit outside the button, since a button inside a
 * button is neither valid nor reachable.
 */
const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(
  (
    { className, children, trailing, actions, headingLevel = 3, ...props },
    ref,
  ) => {
    const Heading = `h${headingLevel}` as const
    return (
      <AccordionPrimitive.Header asChild>
        <Heading className="m-0 flex items-center gap-2 font-[inherit] text-[length:inherit]">
          <AccordionPrimitive.Trigger
            ref={ref}
            className={cn(
              'pill accordion-trigger group flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] py-2',
              'text-left font-mono text-mono-md text-[var(--fg-primary)]',
              'transition-colors duration-[var(--motion-fast)]',
              className,
            )}
            {...props}
          >
            <Icon
              name="right"
              aria-hidden
              width={12}
              height={12}
              className={cn(
                'shrink-0 text-[var(--fg-muted)] transition-transform duration-[var(--motion-slow)] ease-[var(--ease-in-out)]',
                'group-hover:text-[var(--fg-secondary)] group-data-[state=open]:rotate-90',
              )}
            />
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              {children}
            </span>
            {trailing ? <span className="shrink-0">{trailing}</span> : null}
          </AccordionPrimitive.Trigger>
          {actions ? (
            <span className="flex shrink-0 items-center gap-1">{actions}</span>
          ) : null}
        </Heading>
      </AccordionPrimitive.Header>
    )
  },
)
AccordionTrigger.displayName = 'AccordionTrigger'

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="motion-collapse [--collapse-height:var(--radix-accordion-content-height)]"
    {...props}
  >
    {/* padding inside, so the height animation starts from a true zero */}
    <div
      className={cn(
        'pb-4 pl-[22px] font-sans text-body-md text-[var(--fg-secondary)]',
        className,
      )}
    >
      {children}
    </div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
export type { AccordionTriggerProps }
