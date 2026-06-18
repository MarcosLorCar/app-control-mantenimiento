import { SVGProps } from 'react'

interface NearbyPinIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string
  color?: string
  strokeWidth?: number | string
}

export function NearbyPinIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  ...props
}: NearbyPinIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22.8c-3-3.6-5.2-6-5.2-8.6a5.2 5.2 0 1 1 10.4 0c0 2.6-2.2 5-5.2 8.6Z" />
      <circle cx="12" cy="15" r="1.7" />
      <path d="M6.7 7.4a8.6 8.6 0 0 1 10.6 0" />
      <path d="M4.75 4.9a11.8 11.8 0 0 1 14.5 0" />
    </svg>
  )
}
