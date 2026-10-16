import { useId } from 'react'
import { RANKS, type RankDef } from '../lib/ranks'
import type { RankId } from '../types'

type RankBadgeProps = {
  rankId: RankId
  size?: number
  showLabel?: boolean
}

const METAL_RANKS = new Set<RankId>(['bronze', 'silver', 'gold'])

function MetalBadge({ rank, size, gradId }: { rank: RankDef; size: number; gradId: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={rank.colors[0]} />
          <stop offset="100%" stopColor={rank.colors[1]} />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
      <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
      <path
        d="M14 18c3-5 8-8 10-8"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GemBadge({ rank, size, gradId, dark }: { rank: RankDef; size: number; gradId: string; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={rank.colors[0]} />
          <stop offset="100%" stopColor={rank.colors[1]} />
        </linearGradient>
        <linearGradient id="darkOpalShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7b5fff" />
          <stop offset="35%" stopColor="#36e2c4" />
          <stop offset="70%" stopColor="#ff5fb0" />
          <stop offset="100%" stopColor="#7b5fff" />
        </linearGradient>
      </defs>
      {/* Faceted gem: a hexagonal body with a top table and side facets. */}
      <polygon points="24,4 40,16 34,44 14,44 8,16" fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.3)" strokeWidth="0.75" />
      <polygon points="24,4 32,16 16,16" fill="rgba(255,255,255,0.35)" />
      <polygon points="8,16 16,16 14,44" fill="rgba(255,255,255,0.12)" />
      <polygon points="40,16 32,16 34,44" fill="rgba(0,0,0,0.18)" />
      <polygon points="16,16 32,16 34,44 14,44" fill="rgba(255,255,255,0.05)" />
      {dark && (
        <polygon
          points="24,4 40,16 34,44 14,44 8,16"
          fill="url(#darkOpalShine)"
          opacity="0.38"
        />
      )}
    </svg>
  )
}

export default function RankBadge({ rankId, size = 28, showLabel = false }: RankBadgeProps) {
  const rank = RANKS.find((r) => r.id === rankId) ?? RANKS[0]
  const uid = useId()
  const gradId = `rank-grad-${rank.id}-${uid}`

  return (
    <span className="rank-badge" title={rank.name}>
      {METAL_RANKS.has(rank.id) ? (
        <MetalBadge rank={rank} size={size} gradId={gradId} />
      ) : (
        <GemBadge rank={rank} size={size} gradId={gradId} dark={rank.id === 'darkOpal'} />
      )}
      {showLabel && <span className="rank-badge__label">{rank.name}</span>}
    </span>
  )
}
