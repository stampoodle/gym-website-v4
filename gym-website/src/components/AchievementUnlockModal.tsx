import { useEffect, useState } from 'react'
import type { AchievementWithStatus } from '../lib/achievements'
import { RARITY_LABEL } from '../lib/rarity'

type AchievementUnlockModalProps = {
  queue: AchievementWithStatus[]
  onDone: () => void
}

// Shown one at a time even if several achievements unlock at once (e.g.
// logging a workout that crosses several thresholds together) — queued so
// each gets its own moment rather than overlapping.
export default function AchievementUnlockModal({ queue, onDone }: AchievementUnlockModalProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [queue])

  if (queue.length === 0 || index >= queue.length) return null

  const achievement = queue[index]

  function next() {
    if (index + 1 >= queue.length) {
      onDone()
    } else {
      setIndex(index + 1)
    }
  }

  return (
    <div className="unlock-modal-backdrop" onClick={next} role="presentation">
      <div
        className={`unlock-modal unlock-modal--${achievement.rarity}`}
        role="dialog"
        aria-modal="true"
        aria-label="Achievement unlocked"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="unlock-modal__glow" aria-hidden="true" />
        <p className="unlock-modal__trophy" aria-hidden="true">🏆</p>
        <p className="unlock-modal__eyebrow">Achievement Unlocked</p>
        <p className={`unlock-modal__rarity unlock-modal__rarity--${achievement.rarity}`}>
          {RARITY_LABEL[achievement.rarity]}
        </p>
        <h2 className="unlock-modal__name">{achievement.name}</h2>
        <p className="unlock-modal__desc">{achievement.description}</p>
        <p className="unlock-modal__xp">+{achievement.xp.toLocaleString()} XP</p>
        <button className="btn btn--solid" type="button" onClick={next}>
          {index + 1 < queue.length ? 'Next' : 'Nice'}
        </button>
        {queue.length > 1 && (
          <p className="unlock-modal__counter">
            {index + 1} of {queue.length}
          </p>
        )}
      </div>
    </div>
  )
}
