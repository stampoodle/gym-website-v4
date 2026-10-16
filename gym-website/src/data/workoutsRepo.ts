import type { Workout } from '../types'

// This file is the only place that knows workouts live in localStorage.
// When Supabase is wired up, these functions are what gets replaced —
// nothing else in the app talks to storage directly.
//
// A new user starts with no workouts: there is deliberately no demo data,
// so every stat, PR, achievement, XP total and rank comes from real logs.

const STORAGE_KEY = 'gymtraina_workouts_v2'

export function listWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Workout[]
  } catch {
    // malformed storage — treat as empty rather than breaking the app
  }
  return []
}

export function saveWorkouts(workouts: Workout[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
}

export function addWorkout(workout: Workout): Workout[] {
  const next = [workout, ...listWorkouts()]
  saveWorkouts(next)
  return next
}

export function deleteWorkout(id: string): Workout[] {
  const next = listWorkouts().filter((w) => w.id !== id)
  saveWorkouts(next)
  return next
}

export function clearWorkouts(): void {
  localStorage.removeItem(STORAGE_KEY)
}
