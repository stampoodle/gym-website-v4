import type { MuscleGroup, PrEvent, SetEntry, Workout } from '../types'
import { estimate1RM, totalVolume } from './format'
import { exerciseLibrary } from './exerciseLibrary'

// --------------------------------------------------------------------------
// Personal records
// --------------------------------------------------------------------------

/**
 * Walks every workout in chronological order and records a PR event each
 * time an exercise's heaviest weight, estimated 1RM, or single-set volume
 * exceeds everything logged for it so far. This is what powers "recent
 * PRs" on the dashboard, the exercise page, the calendar, and the PR
 * achievements.
 */
export function computePrEvents(workouts: Workout[]): PrEvent[] {
  const chronological = [...workouts].sort((a, b) =>
    a.date === b.date ? a.loggedAt - b.loggedAt : a.date < b.date ? -1 : 1,
  )

  const bestWeight = new Map<string, number>()
  const bestEst1RM = new Map<string, number>()
  const bestVolume = new Map<string, number>()
  const events: PrEvent[] = []

  for (const w of chronological) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (s.weightKg <= 0 || s.reps <= 0) continue

        const prevWeight = bestWeight.get(ex.exerciseName) ?? 0
        if (s.weightKg > prevWeight) {
          bestWeight.set(ex.exerciseName, s.weightKg)
          events.push({
            exerciseName: ex.exerciseName,
            type: 'heaviestWeight',
            date: w.date,
            workoutId: w.id,
            weightKg: s.weightKg,
            reps: s.reps,
            value: s.weightKg,
          })
        }

        const est = estimate1RM(s.weightKg, s.reps)
        const prevEst = bestEst1RM.get(ex.exerciseName) ?? 0
        if (est > prevEst) {
          bestEst1RM.set(ex.exerciseName, est)
          events.push({
            exerciseName: ex.exerciseName,
            type: 'estimated1RM',
            date: w.date,
            workoutId: w.id,
            weightKg: s.weightKg,
            reps: s.reps,
            value: est,
          })
        }
      }

      const vol = totalVolume(ex.sets)
      const prevVol = bestVolume.get(ex.exerciseName) ?? 0
      if (vol > prevVol && vol > 0) {
        bestVolume.set(ex.exerciseName, vol)
        events.push({
          exerciseName: ex.exerciseName,
          type: 'volume',
          date: w.date,
          workoutId: w.id,
          value: vol,
        })
      }
    }
  }

  return events.sort((a, b) => (a.date < b.date ? 1 : -1))
}

// --------------------------------------------------------------------------
// Per-exercise stats page
// --------------------------------------------------------------------------

export type ExerciseHistoryRow = {
  workoutId: string
  date: string
  weightKg: number
  reps: number
  rir?: number
  volume: number
}

export type ExerciseStats = {
  estimated1RM: number
  bestWorkingSet: SetEntry | null
  heaviestWeight: number
  totalVolume: number
  timesPerformed: number
  lastPerformed: string | null
  history: ExerciseHistoryRow[]
}

/**
 * "Best working set" favours a strong, meaningful set rather than just the
 * heaviest single weight — e.g. a low-rep near-max single shouldn't drown
 * out a solid 80kg x 8 if the 1RM estimates are close. We use the set with
 * the highest estimated 1RM, which naturally balances weight and reps.
 */
export function computeExerciseStats(
  workouts: Workout[],
  exerciseName: string,
): ExerciseStats {
  const history: ExerciseHistoryRow[] = []
  let bestWorkingSet: SetEntry | null = null
  let bestWorkingSetEst = 0
  let heaviestWeight = 0
  let volumeSum = 0
  let lastPerformed: string | null = null

  const sorted = [...workouts].sort((a, b) => (a.date < b.date ? -1 : 1))

  for (const w of sorted) {
    for (const ex of w.exercises) {
      if (ex.exerciseName !== exerciseName) continue
      for (const s of ex.sets) {
        if (s.weightKg <= 0 || s.reps <= 0) continue
        history.push({
          workoutId: w.id,
          date: w.date,
          weightKg: s.weightKg,
          reps: s.reps,
          rir: s.rir,
          volume: s.weightKg * s.reps,
        })
        volumeSum += s.weightKg * s.reps
        heaviestWeight = Math.max(heaviestWeight, s.weightKg)
        const est = estimate1RM(s.weightKg, s.reps)
        if (est > bestWorkingSetEst) {
          bestWorkingSetEst = est
          bestWorkingSet = s
        }
        lastPerformed = w.date
      }
    }
  }

  return {
    estimated1RM: bestWorkingSetEst,
    bestWorkingSet,
    heaviestWeight,
    totalVolume: volumeSum,
    timesPerformed: new Set(history.map((h) => h.workoutId)).size,
    lastPerformed,
    history: history.reverse(), // most recent first
  }
}

// --------------------------------------------------------------------------
// Muscle map
// --------------------------------------------------------------------------

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'upperChest',
  'lowerChest',
  'frontDelts',
  'sideDelts',
  'rearDelts',
  'biceps',
  'triceps',
  'forearms',
  'traps',
  'lats',
  'upperBack',
  'midBack',
  'lowerBack',
  'upperAbs',
  'lowerAbs',
  'obliques',
  'hipFlexors',
  'adductors',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
]

export type MuscleDetail = {
  daysAgo: number | null
  setsInWindow: number
  volumeInWindow: number
  recentExercises: string[]
}

export type MuscleActivityDetail = Record<MuscleGroup, MuscleDetail>

const exerciseMuscleMap = new Map(exerciseLibrary.map((e) => [e.name, e.muscles]))

function emptyDetail(): MuscleDetail {
  return { daysAgo: null, setsInWindow: 0, volumeInWindow: 0, recentExercises: [] }
}

/** Per-muscle activity within a trailing window: recency, sets, volume, and
 * which exercises trained it most recently — powers the muscle map's hover
 * panel and the dashboard's muscle training summary. */
export function computeMuscleActivityDetail(
  workouts: Workout[],
  windowDays: number,
): MuscleActivityDetail {
  const result = {} as MuscleActivityDetail
  for (const m of ALL_MUSCLE_GROUPS) result[m] = emptyDetail()

  const now = Date.now()
  const windowStart = now - windowDays * 24 * 60 * 60 * 1000

  // Walk workouts most-recent-first so "recentExercises" naturally collects
  // in recency order without a second sort pass.
  const sorted = [...workouts]
    .filter((w) => new Date(`${w.date}T12:00:00`).getTime() >= windowStart)
    .sort((a, b) => (a.date === b.date ? b.loggedAt - a.loggedAt : a.date < b.date ? 1 : -1))

  for (const w of sorted) {
    const workoutTime = new Date(`${w.date}T12:00:00`).getTime()
    const daysAgo = Math.max(0, Math.floor((now - workoutTime) / (24 * 60 * 60 * 1000)))

    for (const ex of w.exercises) {
      if (ex.sets.length === 0) continue
      const muscles = exerciseMuscleMap.get(ex.exerciseName) ?? []
      const vol = totalVolume(ex.sets)
      for (const m of muscles) {
        const d = result[m]
        if (d.daysAgo === null || daysAgo < d.daysAgo) d.daysAgo = daysAgo
        d.setsInWindow += ex.sets.length
        d.volumeInWindow += vol
        if (!d.recentExercises.includes(ex.exerciseName) && d.recentExercises.length < 3) {
          d.recentExercises.push(ex.exerciseName)
        }
      }
    }
  }

  return result
}

/** Every muscle group the person has ever logged a set for, regardless of
 * time window — used by training-variety achievements (these should never
 * un-unlock just because a muscle hasn't been hit in the last 7 days). */
export function computeMuscleGroupsEverTrained(workouts: Workout[]): Set<MuscleGroup> {
  const result = new Set<MuscleGroup>()
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.sets.length === 0) continue
      const muscles = exerciseMuscleMap.get(ex.exerciseName) ?? []
      muscles.forEach((m) => result.add(m))
    }
  }
  return result
}

/** Total volume ever logged per muscle group (all time, no window) — used
 * by the "Muscle Master" achievement. */
export function computeMuscleVolumeEver(workouts: Workout[]): Map<MuscleGroup, number> {
  const result = new Map<MuscleGroup, number>()
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const muscles = exerciseMuscleMap.get(ex.exerciseName) ?? []
      const vol = totalVolume(ex.sets)
      for (const m of muscles) {
        result.set(m, (result.get(m) ?? 0) + vol)
      }
    }
  }
  return result
}

/** Muscle groups touched within a single workout (for "Leg Day" / single-
 * session variety achievements). */
export function muscleGroupsInWorkout(workout: Workout): Set<MuscleGroup> {
  const result = new Set<MuscleGroup>()
  for (const ex of workout.exercises) {
    if (ex.sets.length === 0) continue
    const muscles = exerciseMuscleMap.get(ex.exerciseName) ?? []
    muscles.forEach((m) => result.add(m))
  }
  return result
}
