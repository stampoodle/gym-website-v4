import { useMemo, useState } from 'react'
import { exerciseLibrary } from '../lib/exerciseLibrary'
import type { ExerciseCategory } from '../types'

type ExercisePickerModalProps = {
  onSelect: (exerciseId: string, exerciseName: string) => void
  onClose: () => void
}

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

export default function ExercisePickerModal({
  onSelect,
  onClose,
}: ExercisePickerModalProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | 'All'>('All')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exerciseLibrary.filter((e) => {
      const matchesQuery = q === '' || e.name.toLowerCase().includes(q)
      const matchesCategory = category === 'All' || e.category === category
      return matchesQuery && matchesCategory
    })
  }, [query, category])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add exercise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2>Add exercise</h2>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        <input
          className="input"
          type="text"
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
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

        <ul className="exercise-results">
          {results.length === 0 ? (
            <li className="empty-note">No exercises match that search.</li>
          ) : (
            results.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="exercise-result"
                  onClick={() => onSelect(e.id, e.name)}
                >
                  <span>{e.name}</span>
                  <span className="exercise-result__category">
                    {e.category}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
