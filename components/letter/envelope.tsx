import { BrandMark } from '@/components/ui/brand-mark'

/** A paper object, rather than another chrome card. All private text stays in the letter. */
export function Envelope({ recipient }: { recipient: string | null }) {
  const address = recipient?.trim() || 'you'
  return (
    <div className="envelope" aria-hidden="true">
      <span className="envelope-shadow" />
      <div className="envelope-body">
        <div className="envelope-pocket" />
        <div className="envelope-fold">
          <span />
          <span />
          <span />
        </div>
        <svg className="envelope-flap" viewBox="0 0 320 120" focusable="false">
          <path d="M0 0 160 114 320 0Z" />
          <path className="envelope-flap-stitch" d="m12 7 148 105L308 7" />
        </svg>
        <svg
          className="envelope-front"
          viewBox="0 0 320 210"
          preserveAspectRatio="none"
          focusable="false"
        >
          <path d="M0 210V64l160 54L320 64v146Z" />
          <path d="m0 210 116-78m204 78-116-78" />
        </svg>
        <div
          className="envelope-address"
          data-long={address.length > 26 || undefined}
        >
          <span>to</span>
          <span className="envelope-addressee">{address},</span>
        </div>
        <span className="envelope-postage">
          <span className="envelope-postage-inner">
            <BrandMark size={40} />
            <span>from anna</span>
          </span>
        </span>
        <svg
          className="envelope-postmark"
          viewBox="0 0 130 55"
          focusable="false"
        >
          <circle cx="29" cy="27" r="23" />
          <circle cx="29" cy="27" r="19" />
          <path d="M51 17c12-10 22 10 34 0s22 10 34 0M51 27c12-10 22 10 34 0s22 10 34 0M51 37c12-10 22 10 34 0s22 10 34 0" />
          <text x="29" y="24" textAnchor="middle">
            BY HAND
          </text>
          <text x="29" y="32" textAnchor="middle">
            WITH CARE
          </text>
        </svg>
        <span className="envelope-edge" />
        <span className="envelope-seal">
          <span>a</span>
        </span>
      </div>
    </div>
  )
}
