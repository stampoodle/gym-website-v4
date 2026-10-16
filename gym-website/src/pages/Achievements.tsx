import { useMemo, useState } from 'react'
import { useAchievements } from '../context/AchievementsContext'
import { useProfile } from '../context/ProfileContext'
import RankBadge from '../components/RankBadge'
import { CATEGORY_META, RARITY_DOT, RARITY_LABEL, RARITY_ORDER } from '../lib/rarity'
import { formatAchievementValue, progressRatio, remainingText } from '../lib/achievementFormat'
import type { AchievementRarity } from '../types'

type StatusFilter = 'all' | 'unlocked' | 'locked' | 'inProgress'
type RarityFilter = AchievementRarity | 'all'

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unlocked', label: 'Unlocked' },
  { id: 'locked', label: 'Locked' },
  { id: 'inProgress', label: 'In Progress' },
]

export default function Achievements() {
  const { achievements, unlockedCount, totalCount, totalXp, rank, rarest } = useAchievements()
  const { profile } = useProfile()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [rarity, setRarity] = useState<RarityFilter>('all')

  const filtered = useMemo(
    () =>
      achievements.filter((a) => {
        if (rarity !== 'all' && a.rarity !== rarity) return false
        if (status === 'unlocked') return a.unlocked
        if (status === 'locked') return !a.unlocked
        if (status === 'inProgress') return !a.unlocked && a.progress > 0
        return true
      }),
    [achievements, status, rarity],
  )

  const overallPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  return (
    <div className="page-stack">
      <header className="ach-dashboard">
        <div className="ach-dashboard__rank">
          <RankBadge rankId={rank.current.id} size={54} />
          <div>
            <p className="ach-dashboard__rank-name">{rank.current.name}</p>
            <p className="ach-dashboard__xp">{totalXp.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="ach-dashboard__main">
          <p className="page-head__eyebrow">Achievements</p>
          <h1 className="page-head__title">
            {unlockedCount} / {totalCount} Unlocked
          </h1>
          <div className="meter meter--lg" aria-label={`${overallPct}% complete`}>
            <span className="meter__fill" style={{ width: `${overallPct}%` }} />
          </div>
          <p className="ach-dashboard__meta">
            {overallPct}% complete
            {rarest && (
              <>
                {' · '}Rarest unlocked: {RARITY_DOT[rarest]} {RARITY_LABEL[rarest]}
              </>
            )}
          </p>
        </div>
      </header>

      {!profile.bodyweightKg && (
        <p className="profile-note ach-note">
          Bodyweight achievements need your bodyweight — add it in Profile and they'll start tracking automatically.
        </p>
      )}

      <section className="ach-categories">
        {CATEGORY_META.map((c) => {
          const inCat = achievements.filter((a) => a.category === c.id)
          const done = inCat.filter((a) => a.unlocked).length
          return (
            <div className="ach-category-chip" key={c.id}>
              <span>
                {c.icon} {c.label}
              </span>
              <strong>
                {done}/{inCat.length}
              </strong>
            </div>
          )
        })}
      </section>

      <div className="ach-filters">
        <div className="chip-row" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={'chip' + (status === f.id ? ' chip--active' : '')}
              onClick={() => setStatus(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="chip-row" role="group" aria-label="Filter by rarity">
          <button
            type="button"
            className={'chip' + (rarity === 'all' ? ' chip--active' : '')}
            onClick={() => setRarity('all')}
          >
            Any rarity
          </button>
          {RARITY_ORDER.map((r) => (
            <button
              key={r}
              type="button"
              className={`chip chip--rarity-${r}` + (rarity === r ? ' chip--active' : '')}
              onClick={() => setRarity(r)}
            >
              {RARITY_DOT[r]} {RARITY_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <p className="empty-note">No achievements match these filters.</p>}

      {CATEGORY_META.map((c) => {
        const items = filtered.filter((a) => a.category === c.id)
        if (items.length === 0) return null
        return (
          <section className="section-block" key={c.id}>
            <div className="section-block__head">
              <h2>
                {c.icon} {c.label}
              </h2>
            </div>
            <div className="ach-grid">
              {items.map((a) => {
                const hidden = a.secret && !a.unlocked
                const ratio = progressRatio(a)
                return (
                  <article
                    key={a.id}
                    className={`ach-card ach-card--${a.rarity}` + (a.unlocked ? ' ach-card--unlocked' : '')}
                  >
                    <div className="ach-card__top">
                      <span className={`ach-card__rarity ach-card__rarity--${a.rarity}`}>
                        {RARITY_DOT[a.rarity]} {RARITY_LABEL[a.rarity]}
                      </span>
                      <span className="ach-card__xp">+{a.xp.toLocaleString()} XP</span>
                    </div>
                    <h3 className="ach-card__name">
                      <span aria-hidden="true">{a.unlocked ? '🏆' : hidden ? '❔' : '🔒'}</span>{' '}
                      {hidden ? 'Secret Achievement' : a.name}
                    </h3>
                    <p className="ach-card__desc">
                      {hidden ? 'Keep training — this one reveals itself when you earn it.' : a.description}
                    </p>
                    {a.unlocked ? (
                      <p className="ach-card__unlocked">
                        ✓ ACHIEVEMENT UNLOCKED
                        {a.unlockedAt && (
                          <span> · {new Date(a.unlockedAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    ) : (
                      !hidden && (
                        <>
                          <p className="ach-card__progress-text">
                            {formatAchievementValue(a, a.progress)} / {formatAchievementValue(a, a.target)}
                          </p>
                          <div className="meter">
                            <span className="meter__fill" style={{ width: `${ratio * 100}%` }} />
                          </div>
                          <p className="ach-card__remaining">{remainingText(a)}</p>
                        </>
                      )
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
