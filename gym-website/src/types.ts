// Shared data shapes for the whole app.
// Once Supabase is added, these will map closely to database tables.

export type ExerciseCategory =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings & Glutes'
  | 'Calves'
  | 'Core & Abs'
  | 'Full Body'
  | 'Conditioning'

// The muscle groups shown on the Home dashboard muscle map. Split into
// finer regions than a basic "chest/back/legs" breakdown so the map can
// show individual areas rather than a few giant zones.
export type MuscleGroup =
  | 'upperChest'
  | 'lowerChest'
  | 'frontDelts'
  | 'sideDelts'
  | 'rearDelts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'traps'
  | 'lats'
  | 'upperBack'
  | 'midBack'
  | 'lowerBack'
  | 'upperAbs'
  | 'lowerAbs'
  | 'obliques'
  | 'hipFlexors'
  | 'adductors'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'

export type ExerciseDef = {
  id: string
  name: string
  category: ExerciseCategory
  muscles: MuscleGroup[]
}

export type SetEntry = {
  id: string
  weightKg: number
  reps: number
  rir?: number
  notes?: string
}

export type WorkoutExercise = {
  id: string
  exerciseId: string
  exerciseName: string
  sets: SetEntry[]
}

export type Workout = {
  id: string
  name: string
  /** The date the user trained, chosen in the log form — ISO "YYYY-MM-DD". */
  date: string
  /** When this entry was saved. Used only to order same-day workouts. */
  loggedAt: number
  exercises: WorkoutExercise[]
}

export type UserProfile = {
  name: string
  email: string
  unit: 'kg' | 'lb'
  /** Used only for bodyweight-relative strength achievements (bench/squat/
   * deadlift vs. bodyweight). Optional — those achievements simply stay
   * locked with "set your bodyweight" guidance until this is filled in. */
  bodyweightKg?: number
}

export type PrEventType = 'heaviestWeight' | 'estimated1RM' | 'volume'

export type PrEvent = {
  exerciseName: string
  type: PrEventType
  date: string
  workoutId: string
  weightKg?: number
  reps?: number
  value: number
}

// --------------------------------------------------------------------------
// Achievements & rank
// --------------------------------------------------------------------------

export type AchievementRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'

export type AchievementCategoryId =
  | 'workouts'
  | 'strength'
  | 'progression'
  | 'prs'
  | 'bodyweight'
  | 'volume'
  | 'exercises'
  | 'variety'
  | 'special'
  | 'completion'

/** Live-computed status for one achievement, for a given snapshot of data. */
export type AchievementProgress = {
  id: string
  progress: number
  target: number
  meetsRequirement: boolean
}

/** What's actually persisted in storage — just the permanent unlock record. */
export type AchievementUnlockRecord = {
  unlockedAt: string // ISO timestamp
}

export type RankId =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'emerald'
  | 'sapphire'
  | 'ruby'
  | 'diamond'
  | 'opal'
  | 'darkOpal'
