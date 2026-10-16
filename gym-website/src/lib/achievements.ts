import type {
  AchievementCategoryId,
  AchievementRarity,
  PrEvent,
  UserProfile,
  Workout,
} from '../types'
import { computePrEvents } from './stats'
import {
  computeMuscleGroupsEverTrained,
  computeMuscleVolumeEver,
  muscleGroupsInWorkout,
  ALL_MUSCLE_GROUPS,
} from './stats'
import {
  computeAchievementPrs,
  computeExerciseProgressionStats,
  computeWorkoutMetrics,
  countVolumePersonalBests,
  type ExerciseProgressionStats,
  type WorkoutMetrics,
} from './progression'
import { getUnlocks, recordUnlocks } from '../data/achievementsRepo'

// --------------------------------------------------------------------------
// Context — everything computed once per evaluation, shared by every
// achievement's getProgress() function.
// --------------------------------------------------------------------------

export type AchievementContext = {
  workouts: Workout[]
  totalWorkouts: number
  totalVolumeAllTime: number
  /** Genuine PRs only: improvements over a previous best (see computeAchievementPrs). */
  prEvents: PrEvent[]
  prCount: number
  heaviestPrCount: number
  uniqueExerciseNames: Set<string>
  progression: Map<string, ExerciseProgressionStats>
  workoutMetrics: WorkoutMetrics[]
  bodyweightKg: number | null
  muscleEver: Set<string>
  muscleVolumeEver: Map<string, number>
}

export function buildAchievementContext(
  workouts: Workout[],
  profile: UserProfile,
): AchievementContext {
  const rawPrEvents = computePrEvents(workouts)
  const { all: prEvents, heaviest } = computeAchievementPrs(workouts, rawPrEvents)
  const progression = computeExerciseProgressionStats(workouts)
  const workoutMetrics = computeWorkoutMetrics(workouts, prEvents)
  const uniqueExerciseNames = new Set<string>()
  workouts.forEach((w) => w.exercises.forEach((e) => uniqueExerciseNames.add(e.exerciseName)))

  return {
    workouts,
    totalWorkouts: workouts.length,
    totalVolumeAllTime: workoutMetrics.reduce((s, m) => s + m.volume, 0),
    prEvents,
    prCount: prEvents.length,
    heaviestPrCount: heaviest.length,
    uniqueExerciseNames,
    progression,
    workoutMetrics,
    bodyweightKg: profile.bodyweightKg ?? null,
    muscleEver: computeMuscleGroupsEverTrained(workouts) as unknown as Set<string>,
    muscleVolumeEver: computeMuscleVolumeEver(workouts) as unknown as Map<string, number>,
  }
}

// --------------------------------------------------------------------------
// Achievement definition
// --------------------------------------------------------------------------

export type AchievementDef = {
  id: string
  name: string
  description: string
  category: AchievementCategoryId
  rarity: AchievementRarity
  xp: number
  secret?: boolean
  getProgress: (ctx: AchievementContext) => { progress: number; target: number }
}

const RARITY_XP: Record<AchievementRarity, number> = {
  common: 75,
  uncommon: 200,
  rare: 500,
  epic: 1200,
  legendary: 2500,
  mythic: 5000,
}

function milestone(
  base: Omit<AchievementDef, 'xp' | 'getProgress'>,
  target: number,
  metric: (ctx: AchievementContext) => number,
  xp?: number,
): AchievementDef {
  return {
    ...base,
    xp: xp ?? RARITY_XP[base.rarity],
    getProgress: (ctx) => ({ progress: metric(ctx), target }),
  }
}

function maxExerciseMetric(
  progression: Map<string, ExerciseProgressionStats>,
  pick: (s: ExerciseProgressionStats) => number,
): number {
  let best = 0
  for (const s of progression.values()) best = Math.max(best, pick(s))
  return best
}

// Canonical "big three" exercises for bodyweight-ratio achievements. The
// exercise library has many bench/squat/deadlift variants (dumbbell,
// Smith machine, etc.) — these track the standard barbell versions, since
// that's what "bodyweight bench/squat/deadlift" conventionally means.
const BENCH_EXERCISE = 'Barbell Bench Press'
const SQUAT_EXERCISE = 'Barbell Back Squat'
const DEADLIFT_EXERCISE = 'Conventional Deadlift'

function heaviestFor(ctx: AchievementContext, exerciseName: string): number {
  return ctx.progression.get(exerciseName)?.maxWeightKg ?? 0
}

function bodyweightRatio(ctx: AchievementContext, exerciseName: string): number {
  if (!ctx.bodyweightKg || ctx.bodyweightKg <= 0) return 0
  return heaviestFor(ctx, exerciseName) / ctx.bodyweightKg
}

// --------------------------------------------------------------------------
// 1. Workouts (consistency)
// --------------------------------------------------------------------------

const workoutsAchievements: AchievementDef[] = [
  milestone(
    { id: 'first-session', name: 'First Session', description: 'Complete 1 workout.', category: 'workouts', rarity: 'common' },
    1, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'getting-started', name: 'Getting Started', description: 'Complete 5 workouts.', category: 'workouts', rarity: 'common' },
    5, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'committed', name: 'Committed', description: 'Complete 10 workouts.', category: 'workouts', rarity: 'common' },
    10, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'dedicated', name: 'Dedicated', description: 'Complete 25 workouts.', category: 'workouts', rarity: 'uncommon' },
    25, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'halfway-there', name: 'Halfway There', description: 'Complete 40 workouts.', category: 'workouts', rarity: 'uncommon' },
    40, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'iron-regular', name: 'Iron Regular', description: 'Complete 50 workouts.', category: 'workouts', rarity: 'rare' },
    50, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'gym-rat', name: 'Gym Rat', description: 'Complete 100 workouts.', category: 'workouts', rarity: 'rare' },
    100, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'unstoppable', name: 'Unstoppable', description: 'Complete 150 workouts.', category: 'workouts', rarity: 'epic' },
    150, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'iron-veteran', name: 'Iron Veteran', description: 'Complete 200 workouts.', category: 'workouts', rarity: 'epic' },
    200, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'iron-will', name: 'Iron Will', description: 'Complete 300 workouts.', category: 'workouts', rarity: 'legendary' },
    300, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'gym-veteran', name: 'Gym Veteran', description: 'Complete 400 workouts.', category: 'workouts', rarity: 'legendary' },
    400, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'gym-traina-legend-workouts', name: 'GYM TRAINA Legend', description: 'Complete 500 workouts.', category: 'workouts', rarity: 'mythic' },
    500, (c) => c.totalWorkouts, 7500,
  ),
  milestone(
    { id: 'eternal-grind', name: 'Eternal Grind', description: 'Complete 1,000 workouts.', category: 'workouts', rarity: 'mythic' },
    1000, (c) => c.totalWorkouts, 10000,
  ),
]

// --------------------------------------------------------------------------
// 2. PRs
// --------------------------------------------------------------------------

const prAchievements: AchievementDef[] = [
  milestone(
    { id: 'first-pr', name: 'First PR', description: 'Set 1 personal record.', category: 'prs', rarity: 'common' },
    1, (c) => c.prCount,
  ),
  milestone(
    { id: 'pr-machine', name: 'PR Machine', description: 'Set 10 personal records.', category: 'prs', rarity: 'uncommon' },
    10, (c) => c.prCount,
  ),
  milestone(
    { id: 'record-breaker', name: 'Record Breaker', description: 'Set 25 personal records.', category: 'prs', rarity: 'rare' },
    25, (c) => c.prCount,
  ),
  milestone(
    { id: 'pr-hunter', name: 'PR Hunter', description: 'Set 40 personal records.', category: 'prs', rarity: 'rare' },
    40, (c) => c.prCount,
  ),
  milestone(
    { id: 'fifty-prs', name: '50 PRs', description: 'Set 50 personal records.', category: 'prs', rarity: 'epic' },
    50, (c) => c.prCount,
  ),
  milestone(
    { id: 'record-book', name: 'Record Book', description: 'Set 75 personal records.', category: 'prs', rarity: 'epic' },
    75, (c) => c.prCount,
  ),
  milestone(
    { id: 'triple-digits', name: 'Triple Digits', description: 'Set 100 personal records.', category: 'prs', rarity: 'legendary' },
    100, (c) => c.prCount,
  ),
  milestone(
    { id: 'pr-master', name: 'PR Master', description: 'Set 150 personal records.', category: 'prs', rarity: 'legendary' },
    150, (c) => c.prCount,
  ),
  milestone(
    { id: 'record-destroyer', name: 'Record Destroyer', description: 'Set 250 personal records.', category: 'prs', rarity: 'mythic' },
    250, (c) => c.prCount, 6000,
  ),
  milestone(
    { id: 'unbreakable-record', name: 'Unbreakable Record', description: 'Set 500 personal records.', category: 'prs', rarity: 'mythic' },
    500, (c) => c.prCount, 10000,
  ),
]

// --------------------------------------------------------------------------
// 3. Volume
// --------------------------------------------------------------------------

const volumeAchievements: AchievementDef[] = [
  milestone(
    { id: 'first-ton', name: 'First Ton', description: 'Reach 1,000 kg total training volume.', category: 'volume', rarity: 'common' },
    1000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: 'volume-starter', name: 'Volume Starter', description: 'Reach 5,000 kg total training volume.', category: 'volume', rarity: 'common' },
    5000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: 'volume-builder', name: 'Volume Builder', description: 'Reach 10,000 kg total training volume.', category: 'volume', rarity: 'uncommon' },
    10000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: 'heavy-lifter', name: 'Heavy Lifter', description: 'Reach 25,000 kg total training volume.', category: 'volume', rarity: 'uncommon' },
    25000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: '100k-club', name: '100K Club', description: 'Reach 100,000 kg total training volume.', category: 'volume', rarity: 'rare' },
    100000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: 'quarter-million', name: 'Quarter Million', description: 'Reach 250,000 kg total training volume.', category: 'volume', rarity: 'rare' },
    250000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: 'half-a-million', name: 'Half a Million', description: 'Reach 500,000 kg total training volume.', category: 'volume', rarity: 'epic' },
    500000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: 'millionaire', name: 'Millionaire', description: 'Reach 1,000,000 kg total training volume.', category: 'volume', rarity: 'epic' },
    1000000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: 'volume-monster', name: 'Volume Monster', description: 'Reach 2,500,000 kg total training volume.', category: 'volume', rarity: 'legendary' },
    2500000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: 'five-million-club', name: 'Five Million Club', description: 'Reach 5,000,000 kg total training volume.', category: 'volume', rarity: 'legendary' },
    5000000, (c) => c.totalVolumeAllTime,
  ),
  milestone(
    { id: 'ten-million-club', name: '10 Million Club', description: 'Reach 10,000,000 kg total training volume.', category: 'volume', rarity: 'mythic' },
    10000000, (c) => c.totalVolumeAllTime, 7000,
  ),
  milestone(
    { id: 'iron-mountain', name: 'Iron Mountain', description: 'Reach 25,000,000 kg total training volume.', category: 'volume', rarity: 'mythic' },
    25000000, (c) => c.totalVolumeAllTime, 12000,
  ),
]

// --------------------------------------------------------------------------
// 4. Exercises (collection)
// --------------------------------------------------------------------------

const exerciseAchievements: AchievementDef[] = [
  milestone(
    { id: 'new-movement', name: 'New Movement', description: 'Log 1 exercise.', category: 'exercises', rarity: 'common' },
    1, (c) => c.uniqueExerciseNames.size,
  ),
  milestone(
    { id: 'explorer', name: 'Explorer', description: 'Log 10 different exercises.', category: 'exercises', rarity: 'common' },
    10, (c) => c.uniqueExerciseNames.size,
  ),
  milestone(
    { id: 'variety', name: 'Variety', description: 'Log 25 different exercises.', category: 'exercises', rarity: 'uncommon' },
    25, (c) => c.uniqueExerciseNames.size,
  ),
  milestone(
    { id: 'exercise-collector', name: 'Exercise Collector', description: 'Log 50 different exercises.', category: 'exercises', rarity: 'rare' },
    50, (c) => c.uniqueExerciseNames.size,
  ),
  milestone(
    { id: 'movement-master', name: 'Movement Master', description: 'Log 75 different exercises.', category: 'exercises', rarity: 'rare' },
    75, (c) => c.uniqueExerciseNames.size,
  ),
  milestone(
    { id: 'gym-encyclopedia', name: 'Gym Encyclopedia', description: 'Log 100 different exercises.', category: 'exercises', rarity: 'epic' },
    100, (c) => c.uniqueExerciseNames.size,
  ),
  milestone(
    { id: 'exercise-expert', name: 'Exercise Expert', description: 'Log 150 different exercises.', category: 'exercises', rarity: 'epic' },
    150, (c) => c.uniqueExerciseNames.size,
  ),
  milestone(
    { id: 'movement-maniac', name: 'Movement Maniac', description: 'Log 200 different exercises.', category: 'exercises', rarity: 'legendary' },
    200, (c) => c.uniqueExerciseNames.size,
  ),
  milestone(
    { id: 'complete-arsenal', name: 'Complete Arsenal', description: 'Log 250 different exercises.', category: 'exercises', rarity: 'legendary' },
    250, (c) => c.uniqueExerciseNames.size,
  ),
  milestone(
    { id: 'gym-encyclopedia-master', name: 'Gym Encyclopedia: Master', description: 'Log 300 different exercises.', category: 'exercises', rarity: 'mythic' },
    // The library currently has 250 total, so this is capped at what's
    // actually loggable — see "Completionist" below for the true 100%.
    300, (c) => c.uniqueExerciseNames.size, 8000,
  ),
]

// --------------------------------------------------------------------------
// 5. Progression (progressive overload)
// --------------------------------------------------------------------------

const progressionAchievements: AchievementDef[] = [
  milestone(
    { id: 'level-up', name: 'Level Up', description: "Increase the weight on an exercise for the first time.", category: 'progression', rarity: 'common' },
    1, (c) => maxExerciseMetric(c.progression, (s) => s.increaseCount),
  ),
  milestone(
    { id: 'plateau-breaker', name: 'Plateau Breaker', description: 'Beat a previous personal best on any exercise.', category: 'progression', rarity: 'common' },
    1, (c) => maxExerciseMetric(c.progression, (s) => s.increaseCount),
  ),
  milestone(
    { id: 'progressive-overload', name: 'Progressive Overload', description: "Increase a single exercise's best weight 5 times.", category: 'progression', rarity: 'uncommon' },
    5, (c) => maxExerciseMetric(c.progression, (s) => s.increaseCount),
  ),
  milestone(
    { id: 'progression-machine', name: 'Progression Machine', description: "Increase a single exercise's best weight 10 times.", category: 'progression', rarity: 'rare' },
    10, (c) => maxExerciseMetric(c.progression, (s) => s.increaseCount),
  ),
  milestone(
    { id: 'double-down', name: 'Double Down', description: "Increase an exercise's best weight by 50% from your first recorded result.", category: 'progression', rarity: 'rare' },
    0.5,
    (c) => maxExerciseMetric(c.progression, (s) =>
      s.firstWeightKg > 0 ? (s.maxWeightKg - s.firstWeightKg) / s.firstWeightKg : 0,
    ),
  ),
  milestone(
    { id: 'strength-evolution', name: 'Strength Evolution', description: "Double an exercise's best weight from your first recorded result.", category: 'progression', rarity: 'epic' },
    1.0,
    (c) => maxExerciseMetric(c.progression, (s) =>
      s.firstWeightKg > 0 ? (s.maxWeightKg - s.firstWeightKg) / s.firstWeightKg : 0,
    ),
  ),
  milestone(
    { id: 'mastery', name: 'Mastery', description: "Improve the same exercise's best weight by 100 kg from your starting record.", category: 'progression', rarity: 'legendary' },
    100, (c) => maxExerciseMetric(c.progression, (s) => s.maxWeightKg - s.firstWeightKg),
  ),
]

// --------------------------------------------------------------------------
// 6. Bodyweight
// --------------------------------------------------------------------------

function bodyweightTier(
  id: string,
  name: string,
  ratio: number,
  exercise: string,
  rarity: AchievementRarity,
): AchievementDef {
  return {
    id,
    name,
    description: `Lift ${ratio}\u00d7 your bodyweight on ${exercise}. Set your bodyweight in Profile to track this.`,
    category: 'bodyweight',
    rarity,
    xp: RARITY_XP[rarity],
    getProgress: (ctx) => ({ progress: bodyweightRatio(ctx, exercise), target: ratio }),
  }
}

const bodyweightAchievements: AchievementDef[] = [
  bodyweightTier('bodyweight-bench', 'Bodyweight Bench', 1.0, BENCH_EXERCISE, 'uncommon'),
  bodyweightTier('bench-1-25x', '1.25\u00d7 Bench', 1.25, BENCH_EXERCISE, 'rare'),
  bodyweightTier('bench-1-5x', '1.5\u00d7 Bench', 1.5, BENCH_EXERCISE, 'rare'),
  bodyweightTier('bench-1-75x', '1.75\u00d7 Bench', 1.75, BENCH_EXERCISE, 'epic'),
  bodyweightTier('bench-2x', '2\u00d7 Bench', 2.0, BENCH_EXERCISE, 'legendary'),

  bodyweightTier('bodyweight-squat', 'Bodyweight Squat', 1.0, SQUAT_EXERCISE, 'uncommon'),
  bodyweightTier('squat-1-25x', '1.25\u00d7 Squat', 1.25, SQUAT_EXERCISE, 'rare'),
  bodyweightTier('squat-1-5x', '1.5\u00d7 Squat', 1.5, SQUAT_EXERCISE, 'rare'),
  bodyweightTier('squat-1-75x', '1.75\u00d7 Squat', 1.75, SQUAT_EXERCISE, 'epic'),
  bodyweightTier('squat-2x', '2\u00d7 Squat', 2.0, SQUAT_EXERCISE, 'legendary'),

  bodyweightTier('bodyweight-deadlift', 'Bodyweight Deadlift', 1.0, DEADLIFT_EXERCISE, 'uncommon'),
  bodyweightTier('deadlift-1-5x', '1.5\u00d7 Deadlift', 1.5, DEADLIFT_EXERCISE, 'rare'),
  bodyweightTier('deadlift-2x', '2\u00d7 Deadlift', 2.0, DEADLIFT_EXERCISE, 'epic'),
  bodyweightTier('deadlift-2-5x', '2.5\u00d7 Deadlift', 2.5, DEADLIFT_EXERCISE, 'legendary'),
  bodyweightTier('deadlift-3x', '3\u00d7 Deadlift', 3.0, DEADLIFT_EXERCISE, 'mythic'),

  {
    id: 'strength-trio',
    name: 'Strength Trio',
    description: 'Bench, squat and deadlift all reach 1\u00d7 bodyweight.',
    category: 'bodyweight',
    rarity: 'rare',
    xp: RARITY_XP.rare,
    getProgress: (ctx) => ({
      progress: [BENCH_EXERCISE, SQUAT_EXERCISE, DEADLIFT_EXERCISE].filter(
        (ex) => bodyweightRatio(ctx, ex) >= 1.0,
      ).length,
      target: 3,
    }),
  },
  {
    id: 'double-strength-trio',
    name: 'Double Strength Trio',
    description: 'Bench, squat and deadlift all reach 1.5\u00d7 bodyweight.',
    category: 'bodyweight',
    rarity: 'epic',
    xp: RARITY_XP.epic,
    getProgress: (ctx) => ({
      progress: [BENCH_EXERCISE, SQUAT_EXERCISE, DEADLIFT_EXERCISE].filter(
        (ex) => bodyweightRatio(ctx, ex) >= 1.5,
      ).length,
      target: 3,
    }),
  },
  {
    id: 'elite-trio',
    name: 'Elite Trio',
    description: 'Bench, squat and deadlift all reach 2\u00d7 bodyweight.',
    category: 'bodyweight',
    rarity: 'legendary',
    xp: RARITY_XP.legendary,
    getProgress: (ctx) => ({
      progress: [BENCH_EXERCISE, SQUAT_EXERCISE, DEADLIFT_EXERCISE].filter(
        (ex) => bodyweightRatio(ctx, ex) >= 2.0,
      ).length,
      target: 3,
    }),
  },
]

// --------------------------------------------------------------------------
// 7. Strength (workout-session milestones — volume/sets/exercises per
// session, and the progression-derived "significant lift" ones live here
// too since the brief groups heavy single-exercise feats under Strength).
// --------------------------------------------------------------------------

function metricFromWorkouts(
  metrics: WorkoutMetrics[],
  pick: (m: WorkoutMetrics) => number,
): number {
  let best = 0
  for (const m of metrics) best = Math.max(best, pick(m))
  return best
}

const strengthAchievements: AchievementDef[] = [
  milestone(
    { id: 'big-session', name: 'Big Session', description: 'Record 5,000 kg of volume in one workout.', category: 'strength', rarity: 'uncommon' },
    5000, (c) => metricFromWorkouts(c.workoutMetrics, (m) => m.volume),
  ),
  milestone(
    { id: 'heavy-session', name: 'Heavy Session', description: 'Record 10,000 kg of volume in one workout.', category: 'strength', rarity: 'rare' },
    10000, (c) => metricFromWorkouts(c.workoutMetrics, (m) => m.volume),
  ),
  milestone(
    { id: 'double-digits', name: 'Double Digits', description: 'Complete 10 exercises in one workout.', category: 'strength', rarity: 'uncommon' },
    10, (c) => metricFromWorkouts(c.workoutMetrics, (m) => m.exercisesCount),
  ),
  milestone(
    { id: 'full-session', name: 'Full Session', description: 'Complete 20 total sets in one workout.', category: 'strength', rarity: 'uncommon' },
    20, (c) => metricFromWorkouts(c.workoutMetrics, (m) => m.setsCount),
  ),
  milestone(
    { id: 'volume-king', name: 'Volume King', description: 'Log enough sessions to establish your highest-volume workout.', category: 'strength', rarity: 'common' },
    3, (c) => c.totalWorkouts,
  ),
  milestone(
    { id: 'personal-best-day', name: 'Personal Best Day', description: 'Beat your own previous single-workout volume record.', category: 'strength', rarity: 'common' },
    1, (c) => countVolumePersonalBests(c.workoutMetrics),
  ),
  milestone(
    { id: 'heavy-hitter', name: 'Heavy Hitter', description: 'Reach a 100 kg best lift on any exercise.', category: 'strength', rarity: 'epic' },
    100, (c) => maxExerciseMetric(c.progression, (s) => s.maxWeightKg),
  ),
  milestone(
    { id: 'strength-monster', name: 'Strength Monster', description: 'Reach a 60 kg+ best lift on 10 separate exercises.', category: 'strength', rarity: 'legendary' },
    10,
    (c) => {
      let count = 0
      c.progression.forEach((s) => { if (s.maxWeightKg >= 60) count += 1 })
      return count
    },
  ),
  milestone(
    { id: 'master-of-one', name: 'Master of One', description: 'Log the same exercise 50 times.', category: 'strength', rarity: 'legendary' },
    50, (c) => maxExerciseMetric(c.progression, (s) => s.timesPerformed),
  ),
  milestone(
    { id: 'untouchable', name: 'Untouchable', description: "Beat the same exercise's PR 10 separate times.", category: 'strength', rarity: 'legendary' },
    10, (c) => maxExerciseMetric(c.progression, (s) => s.increaseCount),
  ),
]

// --------------------------------------------------------------------------
// 8. Training Variety (muscle groups)
// --------------------------------------------------------------------------

const UPPER_BODY = ['upperChest','lowerChest','frontDelts','sideDelts','rearDelts','biceps','triceps','lats','upperBack','midBack','traps','forearms']
const LOWER_BODY = ['quads','hamstrings','glutes','calves','lowerBack','adductors','hipFlexors']
const PUSH_CHEST = ['upperChest','lowerChest']
const PUSH_SHOULDER = ['frontDelts','sideDelts']
const PULL_BACK = ['lats','upperBack','midBack','traps']
const MAJOR_GROUPS = ['upperChest','lowerChest','frontDelts','sideDelts','rearDelts','biceps','triceps','lats','upperBack','lowerBack','upperAbs','glutes','quads','hamstrings','calves']
const LEG_DAY_SET = ['quads', 'hamstrings', 'glutes', 'calves']

function countCovered(ever: Set<string>, list: string[]): number {
  return list.filter((m) => ever.has(m)).length
}

const varietyAchievements: AchievementDef[] = [
  {
    id: 'push',
    name: 'Push',
    description: 'Log chest, shoulder, and triceps exercises.',
    category: 'variety',
    rarity: 'common',
    xp: RARITY_XP.common,
    getProgress: (ctx) => ({
      progress:
        (PUSH_CHEST.some((m) => ctx.muscleEver.has(m)) ? 1 : 0) +
        (PUSH_SHOULDER.some((m) => ctx.muscleEver.has(m)) ? 1 : 0) +
        (ctx.muscleEver.has('triceps') ? 1 : 0),
      target: 3,
    }),
  },
  {
    id: 'pull',
    name: 'Pull',
    description: 'Log back and biceps exercises.',
    category: 'variety',
    rarity: 'common',
    xp: RARITY_XP.common,
    getProgress: (ctx) => ({
      progress:
        (PULL_BACK.some((m) => ctx.muscleEver.has(m)) ? 1 : 0) +
        (ctx.muscleEver.has('biceps') ? 1 : 0),
      target: 2,
    }),
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    description: 'Log a complete lower-body session: quads, hamstrings, glutes and calves in one workout.',
    category: 'variety',
    rarity: 'uncommon',
    xp: RARITY_XP.uncommon,
    getProgress: (ctx) => ({
      progress: Math.max(
        0,
        ...ctx.workouts.map((w) => countCovered(muscleGroupsInWorkout(w) as unknown as Set<string>, LEG_DAY_SET)),
      ),
      target: 4,
    }),
  },
  milestone(
    { id: 'upper-body', name: 'Upper Body', description: 'Log exercises covering all major upper-body muscle groups.', category: 'variety', rarity: 'rare' },
    UPPER_BODY.length, (c) => countCovered(c.muscleEver, UPPER_BODY),
  ),
  milestone(
    { id: 'lower-body', name: 'Lower Body', description: 'Log exercises covering all major lower-body muscle groups.', category: 'variety', rarity: 'rare' },
    LOWER_BODY.length, (c) => countCovered(c.muscleEver, LOWER_BODY),
  ),
  milestone(
    { id: 'balanced', name: 'Balanced', description: 'Log exercises for every major muscle group at least once.', category: 'variety', rarity: 'epic' },
    MAJOR_GROUPS.length, (c) => countCovered(c.muscleEver, MAJOR_GROUPS),
  ),
  milestone(
    { id: 'full-body', name: 'Full Body', description: 'Successfully train every tracked muscle region, including the smaller ones.', category: 'variety', rarity: 'legendary' },
    ALL_MUSCLE_GROUPS.length, (c) => countCovered(c.muscleEver, ALL_MUSCLE_GROUPS as unknown as string[]),
  ),
  {
    id: 'muscle-master',
    name: 'Muscle Master',
    description: 'Reach 1,000 kg of logged volume across every major muscle group.',
    category: 'variety',
    rarity: 'mythic',
    xp: RARITY_XP.mythic,
    getProgress: (ctx) => ({
      progress: MAJOR_GROUPS.filter((m) => (ctx.muscleVolumeEver.get(m) ?? 0) >= 1000).length,
      target: MAJOR_GROUPS.length,
    }),
  },
]

// --------------------------------------------------------------------------
// 9. Special
// --------------------------------------------------------------------------

const specialAchievements: AchievementDef[] = [
  milestone(
    { id: 'triple-threat', name: 'Triple Threat', description: 'Set PRs on 3 different exercises.', category: 'special', rarity: 'uncommon' },
    3, (c) => new Set(c.prEvents.map((p) => p.exerciseName)).size,
  ),
  milestone(
    { id: 'new-territory', name: 'New Territory', description: 'Set a PR on an exercise for the first time.', category: 'special', rarity: 'uncommon' },
    1, (c) => c.prCount,
  ),
  milestone(
    { id: 'three-in-one', name: 'Three in One', description: 'Set 3 PRs in a single workout.', category: 'special', rarity: 'rare' },
    3, (c) => metricFromWorkouts(c.workoutMetrics, (m) => m.prCount),
  ),
  milestone(
    { id: 'clean-sweep', name: 'Clean Sweep', description: 'Set a PR on every exercise in a workout (3+ exercises).', category: 'special', rarity: 'rare' },
    1, (c) => (c.workoutMetrics.some((m) => m.allExercisesGotPR) ? 1 : 0),
  ),
  {
    id: 'comeback',
    name: 'Comeback',
    description: 'Beat a previous PR after a session that failed to improve it.',
    category: 'special',
    rarity: 'rare',
    xp: RARITY_XP.rare,
    secret: true,
    getProgress: (ctx) => ({
      progress: Array.from(ctx.progression.values()).some((s) => s.comeback) ? 1 : 0,
      target: 1,
    }),
  },
  milestone(
    { id: 'pr-frenzy', name: 'PR Frenzy', description: 'Set 5 PRs in a single workout.', category: 'special', rarity: 'epic' },
    5, (c) => metricFromWorkouts(c.workoutMetrics, (m) => m.prCount),
  ),
  milestone(
    { id: 'perfect-progression', name: 'Perfect Progression', description: 'Improve the same exercise across 10 consecutive recorded sessions.', category: 'special', rarity: 'epic' },
    10, (c) => maxExerciseMetric(c.progression, (s) => s.bestNonDecreasingStreak),
  ),
  milestone(
    { id: 'iron-blood', name: 'Iron Blood', description: 'Set 100 heaviest-weight PRs.', category: 'special', rarity: 'mythic' },
    100, (c) => c.heaviestPrCount, 8000,
  ),
  milestone(
    { id: 'the-machine', name: 'The Machine', description: 'Complete 500 workouts.', category: 'special', rarity: 'mythic' },
    500, (c) => c.totalWorkouts, 7500,
  ),
]

// --------------------------------------------------------------------------
// 10. Completion — the capstone achievement, computed in a second pass once
// every other achievement's status is known (see evaluateAchievements).
// --------------------------------------------------------------------------

const COMPLETIONIST_ID = 'completionist'
const GYM_TRAINA_LEGEND_ID = 'gym-traina-legend-completion'

function completionAchievements(totalExercisesInLibrary: number): AchievementDef[] {
  return [
    milestone(
      { id: COMPLETIONIST_ID, name: 'Completionist', description: 'Log every exercise in the GYM TRAINA exercise database.', category: 'exercises', rarity: 'mythic' },
      totalExercisesInLibrary, (c) => c.uniqueExerciseNames.size, 10000,
    ),
    {
      // Placeholder — real progress is filled in by evaluateAchievements'
      // second pass, since it depends on every other achievement's result.
      id: GYM_TRAINA_LEGEND_ID,
      name: 'GYM TRAINA Legend',
      description: 'Unlock every other achievement in GYM TRAINA.',
      category: 'completion',
      rarity: 'mythic',
      xp: 15000,
      getProgress: () => ({ progress: 0, target: 1 }),
    },
  ]
}

// --------------------------------------------------------------------------
// Full registry
// --------------------------------------------------------------------------

export function getAllAchievementDefs(exerciseLibrarySize: number): AchievementDef[] {
  const defs = [
    ...workoutsAchievements,
    ...prAchievements,
    ...volumeAchievements,
    ...exerciseAchievements,
    ...progressionAchievements,
    ...bodyweightAchievements,
    ...strengthAchievements,
    ...varietyAchievements,
    ...specialAchievements,
    ...completionAchievements(exerciseLibrarySize),
  ]
  // "Log 300 different exercises" can't be reached while the library has
  // fewer than 300. Keep the requirement as specified, but say so on the
  // card rather than leaving it a mystery. Updates automatically as the
  // library grows.
  return defs.map((d) =>
    d.id === 'gym-encyclopedia-master' && exerciseLibrarySize < 300
      ? {
          ...d,
          description: `Log 300 different exercises. The library currently has ${exerciseLibrarySize}, so this unlocks once more exercises are added.`,
        }
      : d,
  )
}

// --------------------------------------------------------------------------
// Evaluation: live progress + permanent unlock status
// --------------------------------------------------------------------------

export type AchievementWithStatus = AchievementDef & {
  progress: number
  target: number
  unlocked: boolean
  unlockedAt: string | null
}

/**
 * Computes every achievement's current progress, reconciles it against the
 * permanent unlock store (new unlocks are persisted here, and once
 * unlocked an achievement never reverts even if progress is later
 * recalculated lower — e.g. after the underlying workout data changes),
 * and returns newly-unlocked ids alongside the full list for the modal.
 */
export function evaluateAchievements(
  workouts: Workout[],
  profile: UserProfile,
  exerciseLibrarySize: number,
): { achievements: AchievementWithStatus[]; newlyUnlocked: string[] } {
  const defs = getAllAchievementDefs(exerciseLibrarySize)
  const ctx = buildAchievementContext(workouts, profile)
  const existingUnlocks = getUnlocks()

  const results: AchievementWithStatus[] = defs.map((def) => {
    const { progress, target } =
      def.id === GYM_TRAINA_LEGEND_ID
        ? { progress: 0, target: Math.max(1, defs.length - 1) }
        : def.getProgress(ctx)
    const meetsRequirement = progress >= target
    const existing = existingUnlocks[def.id]
    return {
      ...def,
      progress,
      target,
      unlocked: Boolean(existing) || meetsRequirement,
      unlockedAt: existing?.unlockedAt ?? null,
    }
  })

  // Second pass: the completion achievement depends on everything above.
  const legendIndex = results.findIndex((a) => a.id === GYM_TRAINA_LEGEND_ID)
  if (legendIndex !== -1) {
    const othersUnlocked = results.filter(
      (a, i) => i !== legendIndex && a.unlocked,
    ).length
    const target = results.length - 1
    results[legendIndex] = {
      ...results[legendIndex],
      progress: othersUnlocked,
      target,
      unlocked: Boolean(existingUnlocks[GYM_TRAINA_LEGEND_ID]) || othersUnlocked >= target,
    }
  }

  // Persist any newly-crossed thresholds.
  const toUnlock = results.filter((a) => a.unlocked && !existingUnlocks[a.id]).map((a) => a.id)
  const newlyUnlocked = toUnlock.length > 0 ? recordUnlocks(toUnlock) : []

  // Re-read unlock dates for anything freshly recorded this pass.
  if (newlyUnlocked.length > 0) {
    const refreshed = getUnlocks()
    results.forEach((a, i) => {
      if (refreshed[a.id]) results[i] = { ...a, unlocked: true, unlockedAt: refreshed[a.id].unlockedAt }
    })
  }

  return { achievements: results, newlyUnlocked }
}

export function totalXpFrom(achievements: AchievementWithStatus[]): number {
  return achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xp, 0)
}

export function rarestUnlocked(
  achievements: AchievementWithStatus[],
): AchievementRarity | null {
  const order: AchievementRarity[] = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
  for (const r of order) {
    if (achievements.some((a) => a.unlocked && a.rarity === r)) return r
  }
  return null
}
