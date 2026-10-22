import { letterCard } from '@/components/og/letter-card'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'from anna · letters I write by hand, for one person each'
export default function OpengraphImage() {
  return letterCard('site')
}
