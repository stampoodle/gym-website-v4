import type { SetEntry } from '../types'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Epley formula: a standard, simple estimate of a one-rep max. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg
  return weightKg * (1 + reps / 30)
}

export function bestSetByEstimated1RM(sets: SetEntry[]): SetEntry | null {
  if (sets.length === 0) return null
  return sets.reduce((best, s) =>
    estimate1RM(s.weightKg, s.reps) > estimate1RM(best.weightKg, best.reps)
      ? s
      : best,
  )
}

export function totalVolume(sets: SetEntry[]): number {
  return sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
}

/** Start (Monday) of the week containing the given date. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** "2026-10-14" -> "14 October 2026". Takes the stored workout date as-is. */
export function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
