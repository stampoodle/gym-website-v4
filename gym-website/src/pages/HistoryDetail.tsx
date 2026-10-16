import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useWorkouts } from '../context/WorkoutsContext'
import { computePrEvents } from '../lib/stats'
import { formatDate, totalVolume } from '../lib/format'

export default function HistoryDetail() {
  const { id } = useParams<{ id: string }>()
  const { workouts, getWorkout } = useWorkouts()
  const workout = id ? getWorkout(id) : undefined

  const prsToday = useMemo(() => {
    if (!workout) return []
    return computePrEvents(workouts).filter(
      (pr) => pr.date === workout.date,
    )
  }, [workouts, workout])

  if (!workout) {
    return (
      <div className="page-stack">
        <p className="empty-note">
          That workout couldn't be found.{' '}
          <Link className="link-more" to="/app/history">
            Back to history
          </Link>
        </p>
      </div>
    )
  }

  const totalSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0)
  const volume = workout.exercises.reduce((s, e) => s + totalVolume(e.sets), 0)

  return (
    <div className="page-stack">
      <Link className="link-more" to="/app/history">
        ← Back to history
      </Link>

      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">{formatDate(workout.date)}</p>
          <h1 className="page-head__title">{workout.name}</h1>
        </div>
      </header>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-card__value">{workout.exercises.length}</span>
          <span className="stat-card__label">Exercises</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{totalSets}</span>
          <span className="stat-card__label">Total sets</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{Math.round(volume)} kg</span>
          <span className="stat-card__label">Training volume</span>
        </div>
      </div>

      {prsToday.length > 0 && (
        <div className="pr-highlight">
          <div>
            <p className="pr-highlight__label">Personal records set this session</p>
            <p className="pr-highlight__value">
              {prsToday.map((pr) => pr.exerciseName).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="exercise-stack">
        {workout.exercises.map((ex) => (
          <div className="exercise-card exercise-card--readonly" key={ex.id}>
            <div className="exercise-card__head">
              <h3>{ex.exerciseName}</h3>
              <span className="exercise-card__volume">
                {Math.round(totalVolume(ex.sets))} kg volume
              </span>
            </div>
            <div className="set-table">
              <div className="set-table__row set-table__row--head set-table__row--readonly">
                <span>Set</span>
                <span>kg</span>
                <span>Reps</span>
                <span>RIR</span>
              </div>
              {ex.sets.map((s, i) => (
                <div className="set-table__row set-table__row--readonly" key={s.id}>
                  <span className="set-table__index">{i + 1}</span>
                  <span>{s.weightKg}</span>
                  <span>{s.reps}</span>
                  <span>{s.rir ?? '–'}</span>
                </div>
              ))}
            </div>
            {ex.sets[0]?.notes && (
              <p className="exercise-card__previous">Note: {ex.sets[0].notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
