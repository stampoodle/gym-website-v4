import { Link } from 'react-router-dom'

type LogSet = {
  set: number
  weight: string
  reps: number
  best?: boolean
}

type LogExercise = {
  name: string
  sets: LogSet[]
}

// Sample content so the hero shows what the product actually does.
// This is static display data, not real user data.
const sampleSession: LogExercise[] = [
  {
    name: 'Bench press',
    sets: [
      { set: 1, weight: '82.5 kg', reps: 8 },
      { set: 2, weight: '82.5 kg', reps: 8 },
      { set: 3, weight: '85 kg', reps: 6, best: true },
    ],
  },
  {
    name: 'Incline dumbbell press',
    sets: [
      { set: 1, weight: '32 kg', reps: 10 },
      { set: 2, weight: '32 kg', reps: 9 },
    ],
  },
]

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__copy">
          <h1 className="hero__title reveal reveal--1">
            Train hard.
            <br />
            Log it. See the progress.
          </h1>

          <p className="hero__lede reveal reveal--2">
            Your training history, PRs and progression in one place. Finish
            your session, log what you did in a couple of minutes, and watch
            GYM TRAINA turn it into real progress over weeks, months and years.
          </p>

          <div className="hero__actions reveal reveal--3">
            <Link className="btn btn--solid btn--lg" to="/signup">
              Create account
            </Link>
            <Link className="btn btn--outline btn--lg" to="/login">
              Log in
            </Link>
          </div>
        </div>

        <div className="hero__panel reveal reveal--4" aria-hidden="true">
          <div className="log">
            <div className="log__head">
              <span className="log__title">Push Day</span>
              <span className="log__date">Tue 15 Sep</span>
            </div>

            {sampleSession.map((exercise) => (
              <div className="log__block" key={exercise.name}>
                <p className="log__exercise">{exercise.name}</p>
                <ul className="log__sets">
                  {exercise.sets.map((s) => (
                    <li className="log__row" key={s.set}>
                      <span className="log__num">{s.set}</span>
                      <span className="log__weight">{s.weight}</span>
                      <span className="log__reps">{s.reps} reps</span>
                      {s.best ? <span className="log__pr">PR</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="log__foot">
              <span>5 sets</span>
              <span>2 exercises</span>
              <span>1,065 kg volume</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
