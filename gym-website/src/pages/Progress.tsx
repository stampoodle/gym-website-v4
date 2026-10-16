import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkouts } from '../context/WorkoutsContext'
import LineChart from '../components/LineChart'
import { computePrEvents } from '../lib/stats'
import {
  bestSetByEstimated1RM,
  estimate1RM,
  formatShortDate,
  totalVolume,
} from '../lib/format'

function weekKey(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export default function Progress() {
  const { workouts } = useWorkouts()

  const exerciseNames = useMemo(() => {
    const names = new Set<string>()
    workouts.forEach((w) => w.exercises.forEach((e) => names.add(e.exerciseName)))
    return [...names].sort()
  }, [workouts])

  const [selected, setSelected] = useState<string>('')
  const activeExercise = selected || exerciseNames[0] || ''

  // --- Overview: volume + frequency by week -------------------------------
  const weeklyData = useMemo(() => {
    const byWeek = new Map<string, { volume: number; count: number }>()
    for (const w of workouts) {
      const k = weekKey(w.date)
      const entry = byWeek.get(k) ?? { volume: 0, count: 0 }
      entry.count += 1
      entry.volume += w.exercises.reduce((s, e) => s + totalVolume(e.sets), 0)
      byWeek.set(k, entry)
    }
    return [...byWeek.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .slice(-10)
  }, [workouts])

  const prEvents = useMemo(() => computePrEvents(workouts), [workouts])

  const muscleFrequency = useMemo(() => {
    // Simple count of sets logged per exercise category, as a stand-in for
    // muscle-group training frequency (the dashboard's muscle map gives the
    // more granular, visual version of this).
    const counts = new Map<string, number>()
    for (const w of workouts) {
      for (const ex of w.exercises) {
        counts.set(ex.exerciseName, (counts.get(ex.exerciseName) ?? 0) + ex.sets.length)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [workouts])

  // --- Per-exercise detail --------------------------------------------------
  const history = useMemo(() => {
    if (!activeExercise) return []
    return [...workouts]
      .filter((w) => w.exercises.some((e) => e.exerciseName === activeExercise))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((w) => {
        const ex = w.exercises.find((e) => e.exerciseName === activeExercise)!
        const best = bestSetByEstimated1RM(ex.sets)
        return {
          date: w.date,
          est1rm: best ? estimate1RM(best.weightKg, best.reps) : 0,
          topSet: best,
          volume: totalVolume(ex.sets),
        }
      })
  }, [workouts, activeExercise])

  const pr = useMemo(() => {
    if (history.length === 0) return null
    return history.reduce((best, h) => (h.est1rm > best.est1rm ? h : best))
  }, [history])

  return (
    <div className="page-stack">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Progress</p>
          <h1 className="page-head__title">See what's moving</h1>
        </div>
      </header>

      <section className="section-block">
        <div className="section-block__head">
          <h2>Overview</h2>
        </div>

        <div className="chart-card">
          <p className="chart-card__title">Training volume per week</p>
          <LineChart
            values={weeklyData.map(([, v]) => v.volume)}
            labels={weeklyData.map(([k]) => formatShortDate(k))}
            formatValue={(v) => `${Math.round(v)} kg`}
          />
        </div>

        <div className="chart-card">
          <p className="chart-card__title">Workout frequency per week</p>
          <LineChart
            values={weeklyData.map(([, v]) => v.count)}
            labels={weeklyData.map(([k]) => formatShortDate(k))}
            formatValue={(v) => `${Math.round(v)}`}
          />
        </div>

        {muscleFrequency.length > 0 && (
          <div className="chart-card">
            <p className="chart-card__title">Most-trained exercises</p>
            <ul className="freq-list">
              {muscleFrequency.map(([name, sets]) => (
                <li key={name} className="freq-row">
                  <span>{name}</span>
                  <span className="freq-row__bar">
                    <span
                      className="freq-row__fill"
                      style={{ width: `${Math.min(100, (sets / muscleFrequency[0][1]) * 100)}%` }}
                    />
                  </span>
                  <span className="freq-row__count">{sets} sets</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {prEvents.length > 0 && (
          <div className="chart-card">
            <p className="chart-card__title">Recent PR timeline</p>
            <ul className="pr-timeline">
              {prEvents.slice(0, 6).map((pr, i) => (
                <li key={i}>
                  <span className="pr-timeline__date">{formatShortDate(pr.date)}</span>
                  <span>{pr.exerciseName}</span>
                  <span className="pr-timeline__value">
                    {pr.type === 'volume'
                      ? `${Math.round(pr.value)} kg vol.`
                      : `${pr.weightKg} kg × ${pr.reps}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {exerciseNames.length === 0 ? (
        <p className="empty-note">
          Log a few workouts and your progress will show up here.
        </p>
      ) : (
        <section className="section-block">
          <div className="section-block__head">
            <h2>Exercise progress</h2>
          </div>

          <select
            className="input"
            value={activeExercise}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Choose an exercise"
          >
            {exerciseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {pr && (
            <div className="pr-highlight">
              <div>
                <p className="pr-highlight__label">Best working set</p>
                <p className="pr-highlight__value">
                  {pr.topSet?.weightKg} kg × {pr.topSet?.reps}
                </p>
              </div>
              <div>
                <p className="pr-highlight__label">Estimated 1RM</p>
                <p className="pr-highlight__value">{Math.round(pr.est1rm)} kg</p>
              </div>
            </div>
          )}

          <div className="chart-card">
            <p className="chart-card__title">Estimated 1RM over time</p>
            <LineChart
              values={history.map((h) => h.est1rm)}
              labels={history.map((h) => formatShortDate(h.date))}
              formatValue={(v) => `${Math.round(v)} kg`}
              valueName="Estimated 1RM"
              points={history.map((h) => ({
                date: h.date,
                detail: h.topSet ? `Best set: ${h.topSet.weightKg} kg × ${h.topSet.reps}` : undefined,
              }))}
            />
          </div>

          <div className="chart-card">
            <p className="chart-card__title">Training volume per session</p>
            <LineChart
              values={history.map((h) => h.volume)}
              labels={history.map((h) => formatShortDate(h.date))}
              formatValue={(v) => `${Math.round(v)} kg`}
              valueName="Volume"
              points={history.map((h) => ({ date: h.date }))}
            />
          </div>

          <Link
            className="link-more"
            to={`/app/exercises/${encodeURIComponent(activeExercise)}`}
          >
            Open full exercise page →
          </Link>
        </section>
      )}
    </div>
  )
}
