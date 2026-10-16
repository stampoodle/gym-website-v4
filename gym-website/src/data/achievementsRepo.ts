import type { AchievementUnlockRecord } from '../types'

// Permanent unlock records live here, separate from workout data. Once an
// achievement is unlocked it stays unlocked forever — even if the workout
// data that triggered it is later edited or removed — so this store only
// ever grows, it's never recalculated from scratch.
const UNLOCKS_KEY = 'gymtraina_achievement_unlocks_v1'
// Which unlocked achievements the person has already been shown the
// "Achievement Unlocked" modal for, so we don't replay it every visit.
const SEEN_KEY = 'gymtraina_achievement_seen_v1'

type UnlockMap = Record<string, AchievementUnlockRecord>

export function getUnlocks(): UnlockMap {
  try {
    const raw = localStorage.getItem(UNLOCKS_KEY)
    if (raw) return JSON.parse(raw) as UnlockMap
  } catch {
    // malformed storage — treat as empty rather than losing the app
  }
  return {}
}

/** Marks a set of achievement ids unlocked right now, if not already recorded.
 * Returns the ids that were newly unlocked by this call (for the unlock modal). */
export function recordUnlocks(ids: string[]): string[] {
  const unlocks = getUnlocks()
  const newlyUnlocked: string[] = []
  const now = new Date().toISOString()
  for (const id of ids) {
    if (!unlocks[id]) {
      unlocks[id] = { unlockedAt: now }
      newlyUnlocked.push(id)
    }
  }
  if (newlyUnlocked.length > 0) {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(unlocks))
  }
  return newlyUnlocked
}

export function getSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // ignore malformed storage
  }
  return new Set()
}

export function markSeen(ids: string[]): void {
  const seen = getSeen()
  ids.forEach((id) => seen.add(id))
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
}

/** Wipes unlock history. Only ever called from the explicit "reset all
 * data" action — normal data changes never revoke unlocks. */
export function clearAchievementData(): void {
  localStorage.removeItem(UNLOCKS_KEY)
  localStorage.removeItem(SEEN_KEY)
}
