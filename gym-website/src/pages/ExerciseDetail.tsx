import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWorkouts } from '../context/WorkoutsContext'
import { computeExerciseStats } from '../lib/stats'
import LineChart from '../components/LineChart'
import { estimate1RM, formatDate } from '../lib/format'

export default function ExerciseDetail() {
  const { name } = useParams<{ name: string }>()
  const exerciseName = name ? decodeURIComponent(name) : ''
  const { workouts } = useWorkouts()

  const stats = useMemo(
    () => computeExerciseStats(workouts, exerciseName),
    [workouts, exerciseName],
  )

  const chronological = [...stats.history].reverse()

  if (stats.timesPerformed === 0) {
    return (
      <div className="page-stack">
        <Link className="link-more" to="/app/exercises">
          ← Back to exercises
        </Link>
        <h1 className="page-head__title">{exerciseName}</h1>
        <p className="empty-note">
          You haven't logged this exercise yet.{' '}
          <Link className="link-more" to="/app/log">
            Log a workout
          </Link>{' '}
          that includes it to start tracking progress.
        </p>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <Link className="link-more" to="/app/exercises">
        ← Back to exercises
      </Link>

      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">
            Last performed {stats.lastPerformed ? formatDate(stats.lastPerformed) : '—'}
          </p>
          <h1 className="page-head__title">{exerciseName}</h1>
        </div>
      </header>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-card__value">{Math.round(stats.estimated1RM)} kg</span>
          <span className="stat-card__label">Estimated 1RM</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{stats.heaviestWeight} kg</span>
          <span className="stat-card__label">Heaviest weight</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{Math.round(stats.totalVolume)} kg</span>
          <span className="stat-card__label">Total volume</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{stats.timesPerformed}</span>
          <span className="stat-card__label">Times performed</span>
        </div>
      </div>

      {stats.bestWorkingSet && (
        <div className="pr-highlight">
          <div>
            <p className="pr-highlight__label">Best working set</p>
            <p className="pr-highlight__value">
              {stats.bestWorkingSet.weightKg} kg × {stats.bestWorkingSet.reps}
            </p>
          </div>
          <div>
            <p className="pr-highlight__label">That set's estimated 1RM</p>
            <p className="pr-highlight__value">
              {Math.round(
                estimate1RM(stats.bestWorkingSet.weightKg, stats.bestWorkingSet.reps),
              )}{' '}
              kg
            </p>
          </div>
        </div>
      )}

      <div className="chart-card">
        <p className="chart-card__title">Estimated 1RM over time</p>
        <LineChart
          values={chronological.map((h) => estimate1RM(h.weightKg, h.reps))}
          labels={chronological.map((h) => formatDate(h.date))}
          formatValue={(v) => `${Math.round(v)} kg`}
          valueName="Estimated 1RM"
          points={chronological.map((h) => ({
            date: h.date,
            detail: `Set: ${h.weightKg} kg × ${h.reps}`,
          }))}
        />
      </div>

      <div className="chart-card">
        <p className="chart-card__title">Weight used per session</p>
        <LineChart
          values={chronological.map((h) => h.weightKg)}
          labels={chronological.map((h) => formatDate(h.date))}
          formatValue={(v) => `${v} kg`}
          valueName="Weight"
          points={chronological.map((h) => ({
            date: h.date,
            detail: `${h.reps} reps${h.rir !== undefined ? ` · ${h.rir} RIR` : ''}`,
          }))}
        />
      </div>

      <section className="section-block">
        <div className="section-block__head">
          <h2>History</h2>
        </div>
        <div className="history-table">
          <div className="history-table__row history-table__row--head">
            <span>Date</span>
            <span>Weight</span>
            <span>Reps</span>
            <span>RIR</span>
            <span>Volume</span>
          </div>
          {stats.history.map((row, i) => (
            <div className="history-table__row" key={i}>
              <span>{formatDate(row.date)}</span>
              <span>{row.weightKg} kg</span>
              <span>{row.reps}</span>
              <span>{row.rir ?? '–'}</span>
              <span>{Math.round(row.volume)} kg</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
