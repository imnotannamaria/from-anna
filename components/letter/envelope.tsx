import { BrandMark } from '@/components/ui/brand-mark'

type Props = { recipient: string | null; sentOn?: string | null }

/**
 * The sealed letter: an envelope with two faces.
 *
 * The front is what arrives — the address, a stamp and a postmark — and it is
 * the whole page until the letter is opened. Opening turns it over to the
 * back, where the flap lifts and the letter rises out. The front and the back
 * are separate faces of one card, so the address is never on the same side
 * as the seal, the way a real envelope is.
 *
 * Decoration only. The name of the page is a heading and the control is the
 * link around this, both in `EnvelopeStage`; nothing here is read out.
 */
export function Envelope({ recipient, sentOn = null }: Props) {
  const address = recipient?.trim() || 'you'
  const [month, year] = (sentOn ?? '').split(' ')

  return (
    <div className="envelope" aria-hidden="true">
      <div className="envelope-turn">
        <div className="envelope-face envelope-face--front">
          <svg
            className="envelope-art"
            viewBox="0 0 400 260"
            preserveAspectRatio="none"
            focusable="false"
          >
            <rect x="0.5" y="0.5" width="399" height="259" rx="3" className="envelope-paper" />
            {/* The folds of the back, faintly through the paper. */}
            <path d="M2 258 200 150 398 258M2 2l168 136M398 2 230 138" className="envelope-crease" />
          </svg>

          <span className="envelope-stamp">
            <span className="envelope-stamp-inner">
              <BrandMark size={34} />
              <span>by hand</span>
            </span>
          </span>

          <svg className="envelope-postmark" viewBox="0 0 150 64" focusable="false">
            <circle cx="32" cy="32" r="27" />
            <circle cx="32" cy="32" r="22" />
            <path d="M62 20c13-10 25 10 38 0s25 10 38 0M62 32c13-10 25 10 38 0s25 10 38 0M62 44c13-10 25 10 38 0s25 10 38 0" />
            <text x="32" y="30" textAnchor="middle">
              {month ? month.slice(0, 3).toUpperCase() : 'BY'}
            </text>
            <text x="32" y="40" textAnchor="middle">
              {year ?? 'HAND'}
            </text>
          </svg>

          <span
            className="envelope-address"
            data-long={address.length > 22 || undefined}
          >
            <span className="envelope-address-to">to</span>
            <span className="envelope-addressee">{address}</span>
            <span className="envelope-address-line" />
            <span className="envelope-address-line envelope-address-line--short" />
          </span>

          <span className="envelope-edge" />
        </div>

        <div className="envelope-face envelope-face--back">
          {/*
            The inside of the envelope. Without it the space the letter leaves
            as it rises, and the corners the flap uncovers as it turns, were
            holes onto the page behind.
          */}
          <svg
            className="envelope-art envelope-inside"
            viewBox="0 0 400 260"
            preserveAspectRatio="none"
            focusable="false"
          >
            <rect x="0.5" y="0.5" width="399" height="259" rx="3" />
          </svg>

          <div className="envelope-fold">
            <span className="envelope-fold-date">{sentOn ?? ''}</span>
            <span className="envelope-fold-hand">for {address}</span>
            <span className="envelope-fold-rule" />
            <span className="envelope-fold-rule" />
            <span className="envelope-fold-rule envelope-fold-rule--short" />
          </div>

          <svg
            className="envelope-art envelope-pocket"
            viewBox="0 0 400 260"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d="M0 3V257q0 3 3 3h394q3 0 3-3V3L200 150Z" className="envelope-paper" />
            <path d="M0 3 172 132M400 3 228 132M4 256 200 146 396 256" className="envelope-crease" />
          </svg>

          {/* One flap, hinged on the top edge: it turns over rather than
              vanishing on one side and reappearing on the other. */}
          <svg
            className="envelope-flap"
            viewBox="0 0 400 160"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d="M3 0H397Q400 0 400 3L212 150Q200 158 188 150L0 3Q0 0 3 0Z" />
          </svg>

          <span className="envelope-seal">
            <span>a</span>
          </span>
        </div>
      </div>
    </div>
  )
}
