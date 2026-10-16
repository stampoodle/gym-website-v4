type LogoProps = {
  withWordmark?: boolean
  size?: number
}

// A simple, geometric mark: an ascending bar chart folded into a chevron —
// reads as "progress" rather than "barbell", which keeps it sleek and
// premium instead of a hardcore-gym cliché.
export default function Logo({ withWordmark = true, size = 22 }: LogoProps) {
  return (
    <span className="logo">
      <svg
        className="logo__mark"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect x="2" y="14" width="4" height="8" rx="1" fill="currentColor" opacity="0.55" />
        <rect x="10" y="9" width="4" height="13" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="18" y="2" width="4" height="20" rx="1" fill="currentColor" />
      </svg>
      {withWordmark && <span className="logo__word">GYM TRAINA</span>}
    </span>
  )
}
