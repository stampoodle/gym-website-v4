import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useWorkouts } from './WorkoutsContext'
import { useProfile } from './ProfileContext'
import {
  evaluateAchievements,
  totalXpFrom,
  rarestUnlocked,
  type AchievementWithStatus,
} from '../lib/achievements'
import { computeRank, type RankStatus } from '../lib/ranks'
import { exerciseLibrary } from '../lib/exerciseLibrary'
import AchievementUnlockModal from '../components/AchievementUnlockModal'
import type { AchievementRarity } from '../types'

type AchievementsContextValue = {
  achievements: AchievementWithStatus[]
  unlockedCount: number
  totalCount: number
  totalXp: number
  rank: RankStatus
  rarest: AchievementRarity | null
}

const AchievementsContext = createContext<AchievementsContextValue | null>(null)

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { workouts } = useWorkouts()
  const { profile } = useProfile()
  const [queue, setQueue] = useState<AchievementWithStatus[]>([])
  const knownUnlocked = useRef<Set<string> | null>(null)

  // Recomputed whenever workouts or bodyweight change. evaluateAchievements
  // also persists any newly crossed thresholds (idempotent), so unlock dates
  // are permanent and never duplicated.
  const evaluation = useMemo(
    () => evaluateAchievements(workouts, profile, exerciseLibrary.length),
    [workouts, profile],
  )

  useEffect(() => {
    const unlockedNow = evaluation.achievements.filter((a) => a.unlocked)
    // The first evaluation after load is the baseline — anything already
    // unlocked then (from stored workouts) shouldn't fire a modal.
    if (knownUnlocked.current === null) {
      knownUnlocked.current = new Set(unlockedNow.map((a) => a.id))
      return
    }
    const known = knownUnlocked.current
    const currentIds = new Set(unlockedNow.map((a) => a.id))
    known.forEach((id) => { if (!currentIds.has(id)) known.delete(id) })
    const fresh = unlockedNow.filter((a) => !known.has(a.id))
    if (fresh.length > 0) {
      fresh.forEach((a) => known.add(a.id))
      setQueue((prev) => [...prev, ...fresh])
    }
  }, [evaluation])

  const dismiss = useCallback(() => setQueue([]), [])

  const value = useMemo<AchievementsContextValue>(() => {
    const unlockedCount = evaluation.achievements.filter((a) => a.unlocked).length
    const totalCount = evaluation.achievements.length
    const totalXp = totalXpFrom(evaluation.achievements)
    return {
      achievements: evaluation.achievements,
      unlockedCount,
      totalCount,
      totalXp,
      rank: computeRank(totalXp, unlockedCount, totalCount),
      rarest: rarestUnlocked(evaluation.achievements),
    }
  }, [evaluation])

  return (
    <AchievementsContext.Provider value={value}>
      {children}
      <AchievementUnlockModal queue={queue} onDone={dismiss} />
    </AchievementsContext.Provider>
  )
}

export function useAchievements(): AchievementsContextValue {
  const ctx = useContext(AchievementsContext)
  if (!ctx) throw new Error('useAchievements must be used within an AchievementsProvider')
  return ctx
}
