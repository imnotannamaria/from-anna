import { useId } from 'react'

type Props = { recipient: string | null; sentOn?: string | null }

const W = 324
const H = 200
const edge = Array.from({ length: 55 }, (_, i) => {
  const x = (W / 54) * i
  const y = 25 + Math.sin(i * 2.399) * 2.1 + Math.sin(i * 1.13) * 1.4
  return `${x.toFixed(1)},${y.toFixed(1)}`
}).join(' ')

/** Independent paper layers: the insert never inherits the envelope's exit. */
export function Envelope({ recipient, sentOn = null }: Props) {
  const id = useId().replaceAll(':', '')
  return (
    <div className="envelope" aria-hidden="true">
      <div className="envelope-body">
        <div className="envelope-pocket" />
        <div className="envelope-fold">
          <span />
          <span />
          <span />
        </div>
        <div className="envelope-front">
          <svg
            className="envelope-art"
            viewBox={`0 0 ${W} ${H}`}
            focusable="false"
          >
            <defs>
              <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0.7" y2="1">
                <stop className="envelope-paper-light" />
                <stop offset="1" className="envelope-paper-dark" />
              </linearGradient>
              <pattern
                id={`${id}-fiber`}
                width="5"
                height="7"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M1 1h.5M3 4h.7"
                  stroke="currentColor"
                  strokeWidth=".4"
                  opacity=".1"
                />
              </pattern>
              <mask id={`${id}-stamp`}>
                <rect x="247" y="40" width="48" height="59" fill="white" />
                {Array.from({ length: 9 }, (_, i) => (
                  <g key={i} fill="black">
                    <circle cx={247 + i * 6} cy="40" r="2" />
                    <circle cx={247 + i * 6} cy="99" r="2" />
                    <circle cx="247" cy={40 + i * 7.4} r="2" />
                    <circle cx="295" cy={40 + i * 7.4} r="2" />
                  </g>
                ))}
              </mask>
            </defs>
            <polygon
              points={`0,200 ${edge} 324,200`}
              fill={`url(#${id}-paper)`}
            />
            <polygon
              points={`0,200 ${edge} 324,200`}
              fill={`url(#${id}-fiber)`}
            />
            <path
              d="M0 200 122 133M324 200 222 140"
              className="envelope-seam"
            />
            <path d="M0 199 162 151 324 199" className="envelope-seam" />
            <g transform="rotate(7 271 70)" mask={`url(#${id}-stamp)`}>
              <rect
                x="247"
                y="40"
                width="48"
                height="59"
                className="envelope-stamp"
              />
              <rect
                x="252"
                y="45"
                width="38"
                height="49"
                className="envelope-stamp-inner"
              />
              <g className="envelope-flower">
                <path d="M271 85V64m0 12c-12 0-14-8-14-8 12-1 14 8 14 8Zm0 5c11-1 13-9 13-9-11 0-13 9-13 9Z" />
                <path d="M271 66c-13-1-11-12-6-10-2-11 10-11 9-1 8-5 11 8-3 11Z" />
              </g>
              <text
                x="271"
                y="92"
                className="envelope-stamp-type"
                textAnchor="middle"
              >
                a · post
              </text>
            </g>
            <g className="envelope-postmark" transform="rotate(-12 235 77)">
              <circle cx="235" cy="77" r="23" />
              <circle cx="235" cy="77" r="19" />
              <path d="M246 67q8-5 17 0t18 0t18 0M245 73q9-5 18 0t18 0t18 0M245 79q9-5 18 0t18 0t18 0M246 85q8-5 17 0t18 0t18 0" />
              <text x="235" y="73" textAnchor="middle">
                SENT WITH
              </text>
              <text x="235" y="83" textAnchor="middle">
                care
              </text>
            </g>
          </svg>
          <div
            className="envelope-address"
            data-name-length={
              (recipient?.length ?? 0) > 50
                ? 'long'
                : (recipient?.length ?? 0) > 24
                  ? 'medium'
                  : 'short'
            }
          >
            <p className="envelope-to">to {recipient ?? 'you'}</p>
            {sentOn && <p className="envelope-date">{sentOn}</p>}
          </div>
          <span className="envelope-sender">from anna</span>
        </div>
        <svg className="envelope-tear" viewBox="0 0 324 32" focusable="false">
          <polygon
            points={`0,0 324,0 ${edge.split(' ').reverse().join(' ')}`}
            className="envelope-face"
          />
          <path d="M8 18H316" className="envelope-perforation" />
        </svg>
      </div>
    </div>
  )
}
