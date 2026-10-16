import type { AchievementCategoryId, AchievementRarity } from '../types'

export const RARITY_ORDER: AchievementRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
]

export const RARITY_LABEL: Record<AchievementRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
}

export const RARITY_DOT: Record<AchievementRarity, string> = {
  common: '\u26AA',
  uncommon: '\u{1F7E2}',
  rare: '\u{1F535}',
  epic: '\u{1F7E3}',
  legendary: '\u{1F7E0}',
  mythic: '\u{1F534}',
}

export const CATEGORY_META: { id: AchievementCategoryId; label: string; icon: string }[] = [
  { id: 'workouts', label: 'Workouts', icon: '\u{1F3CB}\uFE0F' },
  { id: 'strength', label: 'Strength', icon: '\u{1F4AA}' },
  { id: 'progression', label: 'Progression', icon: '\u{1F4C8}' },
  { id: 'prs', label: 'PRs', icon: '\u{1F3C6}' },
  { id: 'bodyweight', label: 'Bodyweight', icon: '\u2696\uFE0F' },
  { id: 'volume', label: 'Volume', icon: '\u{1F4CA}' },
  { id: 'exercises', label: 'Exercises', icon: '\u{1F504}' },
  { id: 'variety', label: 'Training Variety', icon: '\u{1F9E0}' },
  { id: 'special', label: 'Special', icon: '\u{1F525}' },
  { id: 'completion', label: 'Completion', icon: '\u{1F451}' },
]
