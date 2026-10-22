import Image from 'next/image'
import mark from '@/public/from-anna.png'

/** The brand artwork, shared by every brand touchpoint. */
export function BrandMark({
  size = 40,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <Image
      src={mark}
      alt=""
      width={size}
      height={size}
      className={`brand-mark ${className}`}
    />
  )
}
