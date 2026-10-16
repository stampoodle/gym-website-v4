import { useState } from 'react'
import { useProfile } from '../context/ProfileContext'
import { useAchievements } from '../context/AchievementsContext'
import { useWorkouts } from '../context/WorkoutsContext'
import RankBadge from '../components/RankBadge'
import { RANKS } from '../lib/ranks'
import { RARITY_DOT, RARITY_LABEL } from '../lib/rarity'

export default function Profile() {
  const { profile, updateProfile } = useProfile()
  const { resetAllData } = useWorkouts()
  const { rank, totalXp, unlockedCount, totalCount, rarest } = useAchievements()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [bodyweight, setBodyweight] = useState(profile.bodyweightKg ? String(profile.bodyweightKg) : '')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const bw = parseFloat(bodyweight)
    updateProfile({
      name,
      email,
      bodyweightKg: Number.isFinite(bw) && bw > 0 ? bw : undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const currentIndex = RANKS.findIndex((r) => r.id === rank.current.id)

  return (
    <div className="page-stack">
      <section className="rank-card">
        <RankBadge rankId={rank.current.id} size={72} />
        <div className="rank-card__body">
          <p className="rank-card__name">{profile.name.trim() || 'Your name'}</p>
          <p className="rank-card__rank">{rank.current.name}</p>
          <p className="rank-card__xp">{totalXp.toLocaleString()} XP</p>
          {rank.current.id === 'darkOpal' ? (
            <p className="rank-card__complete">ALL ACHIEVEMENTS COMPLETE</p>
          ) : (
            <>
              <div className="meter">
                <span className="meter__fill" style={{ width: `${rank.progressRatio * 100}%` }} />
              </div>
              <p className="rank-card__next">
                {rank.next?.id === 'darkOpal'
                  ? 'Dark Opal unlocks when every achievement is complete'
                  : `${(rank.xpToNext ?? 0).toLocaleString()} XP to ${rank.next?.name}`}
              </p>
            </>
          )}
          <p className="rank-card__meta">
            Achievements: {unlockedCount} / {totalCount}
            {rarest && <> · Rarest: {RARITY_DOT[rarest]} {RARITY_LABEL[rarest]}</>}
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-block__head">
          <h2>Rank path</h2>
        </div>
        <ol className="rank-path">
          {RANKS.map((r, i) => {
            const reached = i <= currentIndex
            const isDark = r.id === 'darkOpal'
            const locked = isDark && rank.current.id !== 'darkOpal'
            return (
              <li
                key={r.id}
                className={
                  'rank-path__step' +
                  (i === currentIndex ? ' rank-path__step--current' : '') +
                  (reached ? ' rank-path__step--reached' : '') +
                  (locked ? ' rank-path__step--locked' : '')
                }
              >
                <RankBadge rankId={r.id} size={34} />
                <span className="rank-path__name">{r.name}</span>
                <span className="rank-path__req">
                  {isDark ? '100% achievements' : r.xpRequired === 0 ? 'Start' : `${r.xpRequired.toLocaleString()} XP`}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="section-block">
        <div className="section-block__head">
          <h2>Your details</h2>
        </div>
        <p className="profile-note">
          There's no account system connected yet — what you enter here is stored only in this browser.
        </p>
        <div className="form-card">
          <label className="field">
            <span className="field__label">Name</span>
            <input className="input" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Email</span>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <span className="field__hint">Placeholder for now — this isn't tied to a real account yet.</span>
          </label>
          <label className="field">
            <span className="field__label">Bodyweight (kg)</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 80"
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
            />
            <span className="field__hint">
              Used only for bodyweight-strength achievements. Update it any time and they recalculate.
            </span>
          </label>
          <button className="btn btn--solid" type="button" onClick={handleSave}>
            {saved ? 'Saved' : 'Save changes'}
          </button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-block__head">
          <h2>Preferences</h2>
        </div>
        <div className="form-card">
          <label className="field field--row">
            <span className="field__label">Weight unit</span>
            <div className="segmented">
              <button
                type="button"
                className={'segmented__option' + (profile.unit === 'kg' ? ' segmented__option--active' : '')}
                onClick={() => updateProfile({ unit: 'kg' })}
              >
                kg
              </button>
              <button
                type="button"
                className={'segmented__option' + (profile.unit === 'lb' ? ' segmented__option--active' : '')}
                onClick={() => updateProfile({ unit: 'lb' })}
              >
                lb
              </button>
            </div>
          </label>
          <p className="field__hint">Saved, but not yet applied everywhere — all numbers are shown in kg for now.</p>
        </div>
      </section>

      <section className="section-block">
        <div className="form-card form-card--danger">
          <div>
            <p className="field__label">Reset all data</p>
            <p className="field__hint">
              Deletes every logged workout, achievement and XP from this browser. Use it to clear any test data.
            </p>
          </div>
          <button
            className="btn btn--outline"
            type="button"
            onClick={() => {
              if (confirm('Delete ALL workouts, achievements and XP from this browser? This cannot be undone.')) {
                resetAllData()
              }
            }}
          >
            Reset data
          </button>
        </div>
      </section>

      <section className="section-block">
        <div className="form-card form-card--danger">
          <div>
            <p className="field__label">Account</p>
            <p className="field__hint">Sign-in isn't connected yet, so there's nothing to log out of.</p>
          </div>
          <button className="btn btn--outline" type="button" disabled>
            Log out
          </button>
        </div>
      </section>
    </div>
  )
}
