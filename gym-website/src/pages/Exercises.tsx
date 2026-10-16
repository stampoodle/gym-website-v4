import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { exerciseLibrary } from '../lib/exerciseLibrary'
import { useWorkouts } from '../context/WorkoutsContext'
import type { ExerciseCategory } from '../types'

const categories: ExerciseCategory[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings & Glutes',
  'Calves',
  'Core & Abs',
  'Full Body',
  'Conditioning',
]

export default function Exercises() {
  const { workouts } = useWorkouts()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | 'All'>('All')

  const trainedNames = useMemo(() => {
    const names = new Set<string>()
    workouts.forEach((w) => w.exercises.forEach((e) => names.add(e.exerciseName)))
    return names
  }, [workouts])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exerciseLibrary.filter((e) => {
      const matchesQuery = q === '' || e.name.toLowerCase().includes(q)
      const matchesCategory = category === 'All' || e.category === category
      return matchesQuery && matchesCategory
    })
  }, [query, category])

  return (
    <div className="page-stack">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Exercises</p>
          <h1 className="page-head__title">The exercise library</h1>
        </div>
      </header>

      <input
        className="input"
        type="text"
        placeholder="Search 250 exercises…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="chip-row" role="group" aria-label="Filter by category">
        <button
          type="button"
          className={'chip' + (category === 'All' ? ' chip--active' : '')}
          onClick={() => setCategory('All')}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={'chip' + (category === c ? ' chip--active' : '')}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="exercise-library-list">
        {results.length === 0 ? (
          <li className="empty-note">No exercises match that search.</li>
        ) : (
          results.map((e) => (
            <li key={e.id}>
              <Link
                className="exercise-library-row"
                to={`/app/exercises/${encodeURIComponent(e.name)}`}
              >
                <span>{e.name}</span>
                <span className="exercise-library-row__meta">
                  {trainedNames.has(e.name) && (
                    <span className="exercise-library-row__trained">Logged</span>
                  )}
                  <span className="exercise-library-row__category">{e.category}</span>
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
