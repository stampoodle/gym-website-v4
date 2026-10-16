import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkouts } from '../context/WorkoutsContext'
import { formatDate, totalVolume } from '../lib/format'

export default function History() {
  const { workouts } = useWorkouts()
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...workouts]
      .filter((w) => {
        const matchesQuery =
          q === '' ||
          w.name.toLowerCase().includes(q) ||
          w.exercises.some((e) => e.exerciseName.toLowerCase().includes(q))
        const matchesFrom = from === '' || w.date >= from
        const matchesTo = to === '' || w.date <= to
        return matchesQuery && matchesFrom && matchesTo
      })
      .sort((a, b) => (a.date === b.date ? b.loggedAt - a.loggedAt : a.date < b.date ? 1 : -1))
  }, [workouts, query, from, to])

  return (
    <div className="page-stack">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">History</p>
          <h1 className="page-head__title">Every workout you've logged</h1>
        </div>
      </header>

      <div className="history-filters">
        <input
          className="input"
          type="text"
          placeholder="Search by workout or exercise name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="history-filters__dates">
          <label className="field">
            <span className="field__label">From</span>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">To</span>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-note">
          {workouts.length === 0
            ? 'No workouts yet. Log one from the Log Workout tab.'
            : 'Nothing matches those filters.'}
        </p>
      ) : (
        <ul className="workout-list">
          {filtered.map((w) => {
            const sets = w.exercises.reduce((n, e) => n + e.sets.length, 0)
            const volume = w.exercises.reduce((s, e) => s + totalVolume(e.sets), 0)
            return (
              <li key={w.id}>
                <Link className="workout-row" to={`/app/history/${w.id}`}>
                  <div>
                    <p className="workout-row__name">{w.name}</p>
                    <p className="workout-row__meta">
                      {formatDate(w.date)} · {w.exercises.length} exercises · {sets} sets
                    </p>
                  </div>
                  <span className="workout-row__stat">{Math.round(volume)} kg</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
