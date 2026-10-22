// Owned entrepta v4 SegmentedControl; pill geometry adapted to this app.
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SegmentedOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

interface SegmentedControlProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onChange' | 'defaultValue'
  > {
  /** Two to five choices, always visible. More than that wants a Select. */
  options: readonly SegmentedOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  size?: 'sm' | 'md'
  /** `pill` rounds the track and the indicator all the way. */
  shape?: 'default' | 'pill'
  /**
   * A label longer than its segment is cut with an ellipsis. Turn it off and
   * every segment grows to the longest word instead, so the control gets wider.
   */
  truncate?: boolean
  /** The radio group's name. One is generated if left out. */
  name?: string
  disabled?: boolean
}

const SIZE = {
  sm: { box: 'min-h-9', segment: 'px-1.5 text-[9px] sm:px-2 sm:text-mono-xs' },
  md: { box: 'min-h-10', segment: 'px-3 text-mono-sm' },
} as const

const SHAPE = {
  default: {
    track: 'rounded-[var(--radius-md)]',
    inner: 'rounded-[calc(var(--radius-md)-3px)]',
  },
  pill: { track: 'rounded-full', inner: 'rounded-full' },
} as const

/**
 * One choice out of a few, all in view: expense or income, 3M, 6M or 12M.
 * Picking one clears the other, unlike a FilterPill. Native radio inputs, so
 * the arrow keys move between them and it takes one Tab stop. Name the group
 * with `aria-label` or `aria-labelledby`.
 */
const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(
  (
    {
      options,
      value: valueProp,
      defaultValue,
      onValueChange,
      size = 'md',
      shape = 'pill',
      truncate = true,
      name: nameProp,
      disabled,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const generated = React.useId()
    const name = nameProp ?? generated
    const [own, setOwn] = React.useState(defaultValue)
    const value = valueProp ?? own
    const active = options.findIndex((option) => option.value === value)

    const select = (next: string) => {
      if (valueProp === undefined) setOwn(next)
      onValueChange?.(next)
    }

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-disabled={disabled || undefined}
        className={cn(
          'relative inline-grid min-w-0 max-w-full grid-flow-col auto-cols-fr items-stretch',
          'border border-[var(--border-strong)] bg-[var(--bg-field)] p-0.5',
          SHAPE[shape].track,
          SIZE[size].box,
          disabled && 'pointer-events-none opacity-40',
          className,
        )}
        style={
          {
            '--segments': options.length,
            '--active': Math.max(active, 0),
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {/* Equal segments, so the indicator moves by its own width, in CSS alone. */}
        <span
          aria-hidden
          className={cn(
            'absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/var(--segments))]',
            'translate-x-[calc(var(--active)*100%)]',
            'border border-[var(--border-brand)] bg-[var(--bg-surface-brand)]',
            SHAPE[shape].inner,
            'transition-[translate,opacity] duration-[var(--motion-base)] ease-[var(--ease-out)] motion-reduce:transition-none',
            active === -1 && 'opacity-0',
          )}
        />
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'relative z-[1] flex cursor-pointer select-none items-center justify-center gap-1.5',
              'font-mono whitespace-nowrap',
              truncate && 'min-w-0',
              SHAPE[shape].inner,
              'text-[var(--fg-secondary)] transition-colors duration-[var(--motion-fast)]',
              'hover:text-[var(--fg-primary)] has-[:checked]:text-[var(--fg-primary)]',
              'has-[:focus-visible]:shadow-[0_0_0_2px_var(--fg-brand)]',
              'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40',
              SIZE[size].segment,
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              disabled={disabled || option.disabled}
              onChange={() => select(option.value)}
              className="sr-only"
            />
            <span className={cn(truncate && 'truncate')}>{option.label}</span>
          </label>
        ))}
      </div>
    )
  },
)
SegmentedControl.displayName = 'SegmentedControl'

export { SegmentedControl }
export type { SegmentedControlProps, SegmentedOption }
