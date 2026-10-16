import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { SetEntry, Workout } from '../types'
import { listWorkouts, addWorkout as addWorkoutToRepo, clearWorkouts } from '../data/workoutsRepo'
import { clearAchievementData } from '../data/achievementsRepo'

type NewWorkoutInput = {
  name: string
  date: string
  exercises: Workout['exercises']
}

type WorkoutsContextValue = {
  workouts: Workout[]
  logWorkout: (input: NewWorkoutInput) => Workout
  getWorkout: (id: string) => Workout | undefined
  /** Deletes every logged workout and all achievement unlock history. */
  resetAllData: () => void
  /** Most recent completed sets logged for a given exercise, for the
   * "previous performance" hint in the log form. */
  lastPerformance: (exerciseId: string) => SetEntry[] | null
}

const WorkoutsContext = createContext<WorkoutsContextValue | null>(null)

export function WorkoutsProvider({ children }: { children: ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>(listWorkouts)

  const logWorkout = useCallback((input: NewWorkoutInput): Workout => {
    const workout: Workout = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`,
      name: input.name.trim() || 'Workout',
      date: input.date,
      loggedAt: Date.now(),
      exercises: input.exercises.filter((e) => e.sets.length > 0),
    }
    setWorkouts(addWorkoutToRepo(workout))
    return workout
  }, [])

  const resetAllData = useCallback(() => {
    clearWorkouts()
    clearAchievementData()
    setWorkouts([])
  }, [])

  const getWorkout = useCallback(
    (id: string) => workouts.find((w) => w.id === id),
    [workouts],
  )

  const lastPerformance = useCallback(
    (exerciseId: string): SetEntry[] | null => {
      const sorted = [...workouts].sort((a, b) =>
        a.date === b.date ? b.loggedAt - a.loggedAt : a.date < b.date ? 1 : -1,
      )
      for (const w of sorted) {
        const match = w.exercises.find((e) => e.exerciseId === exerciseId)
        if (match && match.sets.length > 0) return match.sets
      }
      return null
    },
    [workouts],
  )

  const value = useMemo<WorkoutsContextValue>(
    () => ({ workouts, logWorkout, getWorkout, lastPerformance, resetAllData }),
    [workouts, logWorkout, getWorkout, lastPerformance, resetAllData],
  )

  return (
    <WorkoutsContext.Provider value={value}>
      {children}
    </WorkoutsContext.Provider>
  )
}

export function useWorkouts(): WorkoutsContextValue {
  const ctx = useContext(WorkoutsContext)
  if (!ctx) {
    throw new Error('useWorkouts must be used within a WorkoutsProvider')
  }
  return ctx
}
