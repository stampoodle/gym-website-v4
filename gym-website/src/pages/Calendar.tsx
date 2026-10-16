import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkouts } from '../context/WorkoutsContext'
import { computePrEvents } from '../lib/stats'
import { totalVolume } from '../lib/format'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function Calendar() {
  const { workouts } = useWorkouts()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const prEvents = useMemo(() => computePrEvents(workouts), [workouts])
  const prDates = useMemo(() => new Set(prEvents.map((p) => p.date)), [prEvents])

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, typeof workouts>()
    for (const w of workouts) {
      const list = map.get(w.date) ?? []
      list.push(w)
      map.set(w.date, list)
    }
    return map
  }, [workouts])

  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-first weekday index (0 = Monday ... 6 = Sunday)
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function changeMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setMonth(m)
    setYear(y)
    setSelectedDate(null)
  }

  const selectedWorkouts = selectedDate ? workoutsByDate.get(selectedDate) ?? [] : []
  const selectedPRs = selectedDate ? prEvents.filter((p) => p.date === selectedDate) : []

  return (
    <div className="page-stack">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Calendar</p>
          <h1 className="page-head__title">
            {MONTH_NAMES[month]} {year}
          </h1>
        </div>
        <div className="page-head__actions">
          <button className="icon-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
            ←
          </button>
          <button className="icon-btn" onClick={() => changeMonth(1)} aria-label="Next month">
            →
          </button>
        </div>
      </header>

      <div className="calendar">
        <div className="calendar__weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="calendar__grid">
          {cells.map((day, i) => {
            if (day === null) return <span key={i} className="calendar__cell calendar__cell--blank" />
            const iso = toIso(year, month, day)
            const hasWorkout = workoutsByDate.has(iso)
            const hasPR = prDates.has(iso)
            const isSelected = selectedDate === iso
            return (
              <button
                key={i}
                type="button"
                className={
                  'calendar__cell' +
                  (hasWorkout ? ' calendar__cell--logged' : '') +
                  (isSelected ? ' calendar__cell--selected' : '')
                }
                onClick={() => setSelectedDate(iso === selectedDate ? null : iso)}
              >
                <span>{day}</span>
                {hasPR && <span className="calendar__pr-dot" aria-label="PR set this day" />}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <section className="section-block">
          <div className="section-block__head">
            <h2>{selectedDate}</h2>
          </div>
          {selectedWorkouts.length === 0 ? (
            <p className="empty-note">No workout logged this day.</p>
          ) : (
            <div className="exercise-stack">
              {selectedWorkouts.map((w) => (
                <div className="exercise-card exercise-card--readonly" key={w.id}>
                  <div className="exercise-card__head">
                    <h3>
                      <Link to={`/app/history/${w.id}`}>{w.name}</Link>
                    </h3>
                  </div>
                  <ul className="calendar-exercise-list">
                    {w.exercises.map((ex) => (
                      <li key={ex.id}>
                        {ex.exerciseName} — {ex.sets.length} sets,{' '}
                        {Math.round(totalVolume(ex.sets))} kg volume
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {selectedPRs.length > 0 && (
                <div className="pr-highlight">
                  <div>
                    <p className="pr-highlight__label">PRs set this day</p>
                    <p className="pr-highlight__value">
                      {selectedPRs.map((p) => p.exerciseName).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
