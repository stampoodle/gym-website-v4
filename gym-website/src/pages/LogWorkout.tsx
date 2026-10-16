import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkouts } from '../context/WorkoutsContext'
import ExercisePickerModal from '../components/ExercisePickerModal'
import { newId, todayIso } from '../lib/format'
import type { WorkoutExercise } from '../types'

function DraftExerciseCard({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: WorkoutExercise
  onChange: (next: WorkoutExercise) => void
  onRemove: () => void
}) {
  const { lastPerformance } = useWorkouts()
  const previous = lastPerformance(exercise.exerciseId)

  function addSet() {
    const last = exercise.sets[exercise.sets.length - 1]
    const prefill = last
      ? { weightKg: last.weightKg, reps: last.reps }
      : previous && previous.length > 0
        ? { weightKg: previous[0].weightKg, reps: previous[0].reps }
        : { weightKg: 0, reps: 0 }
    onChange({
      ...exercise,
      sets: [...exercise.sets, { id: newId(), ...prefill }],
    })
  }

  function updateSet(setId: string, patch: Partial<WorkoutExercise['sets'][number]>) {
    onChange({
      ...exercise,
      sets: exercise.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    })
  }

  function removeSet(setId: string) {
    onChange({ ...exercise, sets: exercise.sets.filter((s) => s.id !== setId) })
  }

  return (
    <div className="exercise-card">
      <div className="exercise-card__head">
        <h3>{exercise.exerciseName}</h3>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Remove ${exercise.exerciseName}`}
          onClick={onRemove}
        >
          ✕
        </button>
      </div>

      {previous && previous.length > 0 && (
        <p className="exercise-card__previous">
          Previous: {previous.map((s) => `${s.weightKg} kg × ${s.reps}`).join(', ')}
        </p>
      )}

      {exercise.sets.length > 0 && (
        <div className="set-table">
          <div className="set-table__row set-table__row--head">
            <span>Set</span>
            <span>kg</span>
            <span>Reps</span>
            <span>RIR</span>
            <span aria-hidden="true" />
          </div>
          {exercise.sets.map((set, i) => (
            <div className="set-table__row" key={set.id}>
              <span className="set-table__index">{i + 1}</span>
              <input
                className="set-input"
                type="number"
                inputMode="decimal"
                value={set.weightKg || ''}
                placeholder="0"
                onChange={(e) =>
                  updateSet(set.id, { weightKg: Number(e.target.value) || 0 })
                }
              />
              <input
                className="set-input"
                type="number"
                inputMode="numeric"
                value={set.reps || ''}
                placeholder="0"
                onChange={(e) =>
                  updateSet(set.id, { reps: Number(e.target.value) || 0 })
                }
              />
              <input
                className="set-input set-input--narrow"
                type="number"
                inputMode="numeric"
                value={set.rir ?? ''}
                placeholder="–"
                onChange={(e) =>
                  updateSet(set.id, {
                    rir: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
              <button
                type="button"
                className="icon-btn icon-btn--ghost"
                aria-label={`Remove set ${i + 1}`}
                onClick={() => removeSet(set.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="field">
        <span className="field__label">Notes (optional)</span>
        <input
          className="input"
          type="text"
          placeholder="e.g. felt strong, belt on last set…"
          value={exercise.sets[0]?.notes ?? ''}
          onChange={(e) =>
            onChange({
              ...exercise,
              sets: exercise.sets.map((s, i) =>
                i === 0 ? { ...s, notes: e.target.value } : s,
              ),
            })
          }
        />
      </label>

      <button type="button" className="btn btn--add btn--full" onClick={addSet}>
        + Add set
      </button>
    </div>
  )
}

export default function LogWorkout() {
  const { logWorkout } = useWorkouts()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [date, setDate] = useState(todayIso())
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)

  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0)
  const canSave = name.trim() !== '' && exercises.some((e) => e.sets.length > 0)

  function addExercise(exerciseId: string, exerciseName: string) {
    setExercises((prev) => [
      ...prev,
      { id: newId(), exerciseId, exerciseName, sets: [] },
    ])
    setPickerOpen(false)
  }

  function updateExercise(id: string, next: WorkoutExercise) {
    setExercises((prev) => prev.map((e) => (e.id === id ? next : e)))
  }

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id))
  }

  function handleSave() {
    const saved = logWorkout({ name, date, exercises })
    navigate(`/app/history/${saved.id}`)
  }

  return (
    <div className="page-stack">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Log workout</p>
          <h1 className="page-head__title">What did you train?</h1>
        </div>
      </header>

      <div className="log-form-head">
        <label className="field">
          <span className="field__label">Workout name</span>
          <input
            className="input input--lg"
            type="text"
            placeholder="Push Day"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Date</span>
          <input
            className="input input--lg"
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      {exercises.length === 0 ? (
        <p className="empty-note">
          Add the exercises you trained, then log the sets you completed.
        </p>
      ) : (
        <div className="exercise-stack">
          {exercises.map((ex) => (
            <DraftExerciseCard
              key={ex.id}
              exercise={ex}
              onChange={(next) => updateExercise(ex.id, next)}
              onRemove={() => removeExercise(ex.id)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn btn--add btn--full btn--lg"
        onClick={() => setPickerOpen(true)}
      >
        + Add exercise
      </button>

      <div className="log-form-foot">
        <span className="log-form-foot__summary">
          {exercises.length} exercises · {totalSets} sets
        </span>
        <button
          type="button"
          className="btn btn--add btn--lg"
          disabled={!canSave}
          onClick={handleSave}
        >
          Save workout
        </button>
      </div>

      {pickerOpen && (
        <ExercisePickerModal
          onClose={() => setPickerOpen(false)}
          onSelect={addExercise}
        />
      )}
    </div>
  )
}
