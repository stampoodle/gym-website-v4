import type { RankId } from '../types'

export type RankDef = {
  id: RankId
  name: string
  emoji: string
  /** XP needed to reach this rank. Dark Opal ignores this — see
   * computeRank — and is reachable only at 100% achievement completion. */
  xpRequired: number
  /** Two-stop gradient used by RankBadge, roughly light -> dark. */
  colors: [string, string]
}

export const RANKS: RankDef[] = [
  { id: 'bronze', name: 'Bronze', emoji: '\u{1F949}', xpRequired: 0, colors: ['#d9a066', '#8a5a2b'] },
  { id: 'silver', name: 'Silver', emoji: '\u{1F948}', xpRequired: 2500, colors: ['#e7e9ec', '#9aa0a6'] },
  { id: 'gold', name: 'Gold', emoji: '\u{1F947}', xpRequired: 8000, colors: ['#ffd978', '#c9941f'] },
  { id: 'emerald', name: 'Emerald', emoji: '\u{1F49A}', xpRequired: 18000, colors: ['#5fe3a1', '#0f9d58'] },
  { id: 'sapphire', name: 'Sapphire', emoji: '\u{1F499}', xpRequired: 32000, colors: ['#6fa8ff', '#1a4fd6'] },
  { id: 'ruby', name: 'Ruby', emoji: '\u2764\uFE0F', xpRequired: 52000, colors: ['#ff6b81', '#b0143d'] },
  { id: 'diamond', name: 'Diamond', emoji: '\u{1F48E}', xpRequired: 80000, colors: ['#bdfcff', '#49c7d6'] },
  { id: 'opal', name: 'Opal', emoji: '\u{1F7E0}', xpRequired: 115000, colors: ['#ffb37a', '#e05fb0'] },
  { id: 'darkOpal', name: 'Dark Opal', emoji: '\u26AB', xpRequired: Infinity, colors: ['#241a33', '#050308'] },
]

export type RankStatus = {
  current: RankDef
  next: RankDef | null
  xp: number
  xpIntoCurrent: number
  xpToNext: number | null
  progressRatio: number // 0..1 toward next rank, or 1 if maxed/Dark Opal
}

/**
 * Dark Opal is deliberately not just a higher XP threshold — it's locked
 * until every achievement in the game is unlocked, per the brief. Every
 * other rank is a straightforward XP threshold.
 */
export function computeRank(
  xp: number,
  unlockedCount: number,
  totalAchievements: number,
): RankStatus {
  const hasEverything = totalAchievements > 0 && unlockedCount >= totalAchievements

  if (hasEverything) {
    const darkOpal = RANKS[RANKS.length - 1]
    return {
      current: darkOpal,
      next: null,
      xp,
      xpIntoCurrent: 0,
      xpToNext: null,
      progressRatio: 1,
    }
  }

  // Walk the non-Dark-Opal ranks by XP threshold.
  const eligible = RANKS.slice(0, -1)
  let currentIndex = 0
  for (let i = 0; i < eligible.length; i++) {
    if (xp >= eligible[i].xpRequired) currentIndex = i
  }
  const current = eligible[currentIndex]
  const next = eligible[currentIndex + 1] ?? RANKS[RANKS.length - 1] // Opal's "next" visually points at Dark Opal

  const xpIntoCurrent = xp - current.xpRequired
  const span = next.xpRequired === Infinity ? null : next.xpRequired - current.xpRequired
  const xpToNext = span === null ? null : Math.max(0, next.xpRequired - xp)
  const progressRatio = span && span > 0 ? Math.min(1, xpIntoCurrent / span) : 0

  return { current, next, xp, xpIntoCurrent, xpToNext, progressRatio }
}
