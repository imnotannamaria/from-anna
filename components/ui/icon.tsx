import type { SVGProps } from 'react'

const paths = {
  moon: <path d="M13.5 9.3A5.8 5.8 0 0 1 6.7 2.5a5.8 5.8 0 1 0 6.8 6.8Z" />,
  sun: (
    <>
      <circle cx="8" cy="8" r="2.7" />
      <path d="M8 1v1.3M8 13.7V15M1 8h1.3M13.7 8H15M3 3l.9.9M12.1 12.1l.9.9M3 13l.9-.9M12.1 3.9l.9-.9" />
    </>
  ),
  envelope: (
    <>
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="m2.5 4.5 5.5 4 5.5-4" />
    </>
  ),
  pen: (
    <>
      <path d="m10.5 2.5 3 3L6 13H3v-3Z" />
      <path d="m9 4 3 3" />
    </>
  ),
  photo: (
    <>
      <rect x="2" y="3" width="12" height="10" rx="2" />
      <circle cx="5.5" cy="6.5" r="1" />
      <path d="m2.5 11 3.5-3.5 3 3 1.5-1.5 3 3" />
    </>
  ),
  text: <path d="M3 4h10M3 8h10M3 12h6" />,
  scan: <path d="M2 5V3h2M12 3h2v2M14 11v2h-2M4 13H2v-2M5 6.5h6M5 9.5h4" />,
  code: <path d="m5.5 5-3 3 3 3m5-6 3 3-3 3M9 3.5 7 12.5" />,
  package: (
    <>
      <path d="m8 1.8 6 3.2v6l-6 3.2L2 11V5Z" />
      <path d="m2 5 6 3.2L14 5M8 8.2v6" />
    </>
  ),
  send: <path d="M14 2 7 9m7-7L9.5 14 7 9 2 6.5Z" />,
  star: (
    <path d="m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6Z" />
  ),
  ask: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M6.3 6.2a1.8 1.8 0 0 1 3.4.8c0 1.2-1.7 1.5-1.7 2.6M8 11.6v.01" />
    </>
  ),
  check: <path d="m3 8.5 3 3 7-7" />,
  close: <path d="m4 4 8 8m0-8-8 8" />,
  left: <path d="m10 3-5 5 5 5" />,
  right: <path d="m6 3 5 5-5 5" />,
  external: <path d="M9 3h4v4m0-4L7.5 8.5M11 9.5V13H3V5h3.5" />,
  refresh: <path d="M13.5 6A5.5 5.5 0 1 0 14 9M10 6h4V2" />,
  clock: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" />
    </>
  ),
  eye: (
    <>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="2" />
    </>
  ),
  plus: <path d="M8 3v10M3 8h10" />,
  react: (
    <>
      <path d="M13.6 8.6A5.6 5.6 0 1 1 7.4 2.4" />
      <path d="M5.6 9.6c.6.9 1.4 1.4 2.4 1.4s1.8-.5 2.4-1.4M5.9 6.6v.01M9.7 6.6v.01" />
      <path d="M12.3 1.2v4.2M10.2 3.3h4.2" />
    </>
  ),
} satisfies Record<string, React.ReactNode>

export type IconName = keyof typeof paths
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
