import type { AchievementWithStatus } from './achievements'

const PERCENT_IDS = new Set(['double-down', 'strength-evolution'])
const KG_IDS = new Set(['big-session', 'heavy-session', 'mastery', 'heavy-hitter'])
const TRIO_IDS = new Set(['strength-trio', 'double-strength-trio', 'elite-trio'])

/** Formats a progress/target number the way that achievement talks about it
 * (kg, ×bodyweight, %, or a plain count). */
export function formatAchievementValue(a: AchievementWithStatus, value: number): string {
  if (PERCENT_IDS.has(a.id)) return `${Math.round(value * 100)}%`
  if (a.category === 'bodyweight' && !TRIO_IDS.has(a.id)) return `${value.toFixed(2)}\u00d7`
  if (a.category === 'volume' || KG_IDS.has(a.id)) return `${Math.round(value).toLocaleString()} kg`
  return Math.round(value).toLocaleString()
}

export function progressRatio(a: AchievementWithStatus): number {
  if (a.unlocked) return 1
  return Math.max(0, Math.min(1, a.target > 0 ? a.progress / a.target : 0))
}

export function remainingText(a: AchievementWithStatus): string {
  if (a.unlocked) return ''
  const left = a.target - a.progress
  if (PERCENT_IDS.has(a.id)) return `${Math.max(0, Math.ceil(left * 100))}% more required`
  if (a.category === 'bodyweight' && !TRIO_IDS.has(a.id)) {
    return a.progress === 0 ? 'Set your bodyweight and log this lift' : `${left.toFixed(2)}\u00d7 more required`
  }
  const rounded = Math.ceil(left)
  if (a.category === 'volume' || KG_IDS.has(a.id)) return `${rounded.toLocaleString()} kg more required`
  return `${rounded.toLocaleString()} more required`
}
