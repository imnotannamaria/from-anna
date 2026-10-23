import { letterCard } from '@/components/og/letter-card'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'from anna · a handwritten letter, just for you'

/** No lookup, photo, recipient or letter text: third-party previews outlive access. */
export default function OpengraphImage() {
  return letterCard('letter')
}
