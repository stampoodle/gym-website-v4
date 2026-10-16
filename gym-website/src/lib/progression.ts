import type { PrEvent, Workout } from '../types'
import { estimate1RM, totalVolume } from './format'

export type ExerciseProgressionStats = {
  firstWeightKg: number
  maxWeightKg: number
  /** Times an exercise's all-time-best weight was improved (the very first
   * logged session doesn't count as an "increase" — there's nothing before
   * it to improve on). */
  increaseCount: number
  timesPerformed: number
  /** True if, after improving the exercise at least once, the person had a
   * session that failed to beat the existing best — and later beat it
   * anyway. Powers the "Comeback" achievement. */
  comeback: boolean
  /** Longest run of consecutive sessions where estimated 1RM did not drop. */
  bestNonDecreasingStreak: number
}

function sessionsForExercise(workouts: Workout[], exerciseName: string) {
  const byWorkout = workouts
    .map((w) => {
      const ex = w.exercises.find((e) => e.exerciseName === exerciseName)
      if (!ex) return null
      const validSets = ex.sets.filter((s) => s.weightKg > 0 && s.reps > 0)
      if (validSets.length === 0) return null
      const bestWeight = Math.max(...validSets.map((s) => s.weightKg))
      const bestEst1RM = Math.max(...validSets.map((s) => estimate1RM(s.weightKg, s.reps)))
      return { date: w.date, loggedAt: w.loggedAt, bestWeight, bestEst1RM }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)

  return byWorkout.sort((a, b) =>
    a.date === b.date ? a.loggedAt - b.loggedAt : a.date < b.date ? -1 : 1,
  )
}

/** Computes progressive-overload stats for every exercise the person has
 * logged. This is the single source of truth behind the Progression
 * category achievements (Level Up, Progressive Overload, Mastery, Comeback,
 * Perfect Progression, Untouchable, Master of One, Strength Monster, etc.) */
export function computeExerciseProgressionStats(
  workouts: Workout[],
): Map<string, ExerciseProgressionStats> {
  const names = new Set<string>()
  workouts.forEach((w) => w.exercises.forEach((e) => names.add(e.exerciseName)))

  const result = new Map<string, ExerciseProgressionStats>()

  for (const name of names) {
    const sessions = sessionsForExercise(workouts, name)
    if (sessions.length === 0) continue

    let runningMax = sessions[0].bestWeight
    let increaseCount = 0
    let hadStallSincePR = false
    let comeback = false

    for (let i = 1; i < sessions.length; i++) {
      const session = sessions[i]
      if (session.bestWeight > runningMax) {
        if (hadStallSincePR) comeback = true
        increaseCount += 1
        runningMax = session.bestWeight
        hadStallSincePR = false
      } else if (increaseCount >= 1) {
        hadStallSincePR = true
      }
    }

    let bestStreak = 1
    let currentStreak = 1
    for (let i = 1; i < sessions.length; i++) {
      if (sessions[i].bestEst1RM >= sessions[i - 1].bestEst1RM) {
        currentStreak += 1
      } else {
        currentStreak = 1
      }
      bestStreak = Math.max(bestStreak, currentStreak)
    }

    result.set(name, {
      firstWeightKg: sessions[0].bestWeight,
      maxWeightKg: runningMax,
      increaseCount,
      timesPerformed: sessions.length,
      comeback,
      bestNonDecreasingStreak: bestStreak,
    })
  }

  return result
}

export type WorkoutMetrics = {
  workoutId: string
  date: string
  volume: number
  setsCount: number
  exercisesCount: number
  prCount: number
  allExercisesGotPR: boolean
}

/** Per-workout rollups (volume, sets, PR count that session, etc.) — powers
 * the single-session achievements like Big Session, PR Frenzy, Clean Sweep. */
export function computeWorkoutMetrics(
  workouts: Workout[],
  prEvents: PrEvent[],
): WorkoutMetrics[] {
  return workouts.map((w) => {
    const volume = w.exercises.reduce((s, e) => s + totalVolume(e.sets), 0)
    const setsCount = w.exercises.reduce((s, e) => s + e.sets.length, 0)
    const exercisesCount = w.exercises.filter((e) => e.sets.length > 0).length
    const prsThisWorkout = prEvents.filter((p) => p.workoutId === w.id)
    const prExerciseNames = new Set(prsThisWorkout.map((p) => p.exerciseName))
    const allExercisesGotPR =
      exercisesCount >= 3 &&
      w.exercises
        .filter((e) => e.sets.length > 0)
        .every((e) => prExerciseNames.has(e.exerciseName))

    return {
      workoutId: w.id,
      date: w.date,
      volume,
      setsCount,
      exercisesCount,
      prCount: prExerciseNames.size,
      allExercisesGotPR,
    }
  })
}

/** How many times the person's own "highest single-workout volume" record
 * was broken, not counting the very first workout (which is trivially a
 * record). Used for "Personal Best Day". */
export function countVolumePersonalBests(metrics: WorkoutMetrics[]): number {
  const chronological = [...metrics].sort((a, b) => (a.date < b.date ? -1 : 1))
  let runningMax = -Infinity
  let count = 0
  chronological.forEach((m, i) => {
    if (i === 0) {
      runningMax = m.volume
      return
    }
    if (m.volume > runningMax) {
      count += 1
      runningMax = m.volume
    }
  })
  return count
}

/**
 * Turns the site's raw PR events into the PRs that count for achievements.
 *
 * Two adjustments, both so that "PR" achievements mean beating a previous
 * best rather than simply logging something:
 *  1. An exercise's first-ever logged session is a baseline, not a record
 *     broken — there was nothing to beat — so it's excluded.
 *  2. A session that improves several measures at once (heaviest weight,
 *     estimated 1RM, volume) still counts as one PR for that exercise.
 */
export function computeAchievementPrs(
  workouts: Workout[],
  prEvents: PrEvent[],
): { all: PrEvent[]; heaviest: PrEvent[] } {
  const chronological = [...workouts].sort((a, b) =>
    a.date === b.date ? a.loggedAt - b.loggedAt : a.date < b.date ? -1 : 1,
  )
  const firstWorkoutFor = new Map<string, string>()
  for (const w of chronological) {
    for (const ex of w.exercises) {
      if (ex.sets.length > 0 && !firstWorkoutFor.has(ex.exerciseName)) {
        firstWorkoutFor.set(ex.exerciseName, w.id)
      }
    }
  }

  const grouped = new Map<string, PrEvent>()
  const heaviestKeys = new Set<string>()
  for (const e of prEvents) {
    if (firstWorkoutFor.get(e.exerciseName) === e.workoutId) continue
    const key = `${e.workoutId}|${e.exerciseName}`
    const existing = grouped.get(key)
    if (!existing || e.type === 'heaviestWeight') grouped.set(key, e)
    if (e.type === 'heaviestWeight') heaviestKeys.add(key)
  }

  const all = [...grouped.values()]
  const heaviest = all.filter((e) => heaviestKeys.has(`${e.workoutId}|${e.exerciseName}`))
  return { all, heaviest }
}
