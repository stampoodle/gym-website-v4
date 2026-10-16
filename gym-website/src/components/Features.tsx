import type { ReactNode } from 'react'

type Feature = {
  title: string
  body: string
  icon: ReactNode
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const features: Feature[] = [
  {
    title: 'Log it after training',
    body: 'Finish your session, then log the exercises, sets, reps and weight in a couple of minutes. No timers, nothing to carry around mid-set.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="3.5" width="16" height="17" rx="2.2" {...stroke} />
        <path d="M8 2.5v3M16 2.5v3" {...stroke} />
        <path d="M8 12h8M8 15.5h8" {...stroke} />
      </svg>
    ),
  },
  {
    title: 'See your progress',
    body: 'Estimated 1RM, training volume and a muscle map of what you have trained recently — see how each lift moves over weeks and months.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 20h18" {...stroke} />
        <path d="M4 15.5l5-4.5 4 3 6.5-7" {...stroke} />
        <path d="M15 7h4.5v4.5" {...stroke} />
      </svg>
    ),
  },
  {
    title: 'Personal records',
    body: 'Heaviest weight, best working set and estimated 1RM, tracked automatically for every exercise the moment you beat it.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="10" r="5.2" {...stroke} />
        <path d="M12 8v4" {...stroke} />
        <path d="M8.6 14.6L7 21l5-2.4L17 21l-1.6-6.4" {...stroke} />
      </svg>
    ),
  },
  {
    title: 'History & achievements',
    body: 'Every workout stays on your calendar and in your history. Milestones unlock automatically as your training adds up.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...stroke} />
        <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" {...stroke} />
        <path d="M7.5 13h4M7.5 16.5h7" {...stroke} />
      </svg>
    ),
  },
]

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <h2 className="features__heading">
          Built around the way you actually train
        </h2>
        <p className="features__intro">
          Train at the gym. Log it after. GYM TRAINA turns it into real
          progression data — no social feed, no distractions mid-set.
        </p>

        <ul className="features__grid">
          {features.map((feature) => (
            <li className="card" key={feature.title}>
              <span className="card__icon">{feature.icon}</span>
              <h3 className="card__title">{feature.title}</h3>
              <p className="card__body">{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
