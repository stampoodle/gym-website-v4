import type { ReactNode } from 'react'

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {children}
    </svg>
  )
}

const homeIcon = (
  <Icon>
    <path d="M4 11.5 12 4l8 7.5" {...stroke} />
    <path d="M6 10v9.5a1 1 0 0 0 1 1h3.5v-6h3v6H17a1 1 0 0 0 1-1V10" {...stroke} />
  </Icon>
)

const logIcon = (
  <Icon>
    <rect x="5" y="3.5" width="14" height="17" rx="2.2" {...stroke} />
    <path d="M9 2.5v3M15 2.5v3" {...stroke} />
    <path d="M9 12h6M9 15.5h6" {...stroke} />
    <path d="M12 8.5v0" {...stroke} />
  </Icon>
)

const historyIcon = (
  <Icon>
    <circle cx="12" cy="12" r="8.25" {...stroke} />
    <path d="M12 7.5V12l3 2" {...stroke} />
  </Icon>
)

const calendarIcon = (
  <Icon>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...stroke} />
    <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" {...stroke} />
    <circle cx="8.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
  </Icon>
)

const progressIcon = (
  <Icon>
    <path d="M3 20h18" {...stroke} />
    <path d="M4 15.5l5-4.5 4 3 6.5-7" {...stroke} />
    <path d="M15 7h4.5v4.5" {...stroke} />
  </Icon>
)

const achievementsIcon = (
  <Icon>
    <path
      d="M12 15.5a5 5 0 0 0 5-5V5H7v5.5a5 5 0 0 0 5 5Z"
      {...stroke}
    />
    <path d="M7 6H4.5a2 2 0 0 0 2 3.5M17 6h2.5a2 2 0 0 1-2 3.5" {...stroke} />
    <path d="M10.3 15.8 9.5 19h5l-.8-3.2" {...stroke} />
    <path d="M8.5 19h7" {...stroke} />
  </Icon>
)

const exercisesIcon = (
  <Icon>
    <path d="M2 10.5v3M22 10.5v3" {...stroke} />
    <rect x="4" y="7" width="3.5" height="10" rx="1.2" {...stroke} />
    <rect x="16.5" y="7" width="3.5" height="10" rx="1.2" {...stroke} />
    <path d="M7.5 12h9" {...stroke} />
  </Icon>
)

const profileIcon = (
  <Icon>
    <circle cx="12" cy="8.5" r="3.5" {...stroke} />
    <path d="M4.5 20c1.4-4 4.2-6 7.5-6s6.1 2 7.5 6" {...stroke} />
  </Icon>
)

const moreIcon = (
  <Icon>
    <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
)

type NavItem = {
  to: string
  end: boolean
  label: string
  icon: ReactNode
}

// Full list — used by the desktop sidebar.
export const navItems: NavItem[] = [
  { to: '/app', end: true, label: 'Home', icon: homeIcon },
  { to: '/app/log', end: false, label: 'Log Workout', icon: logIcon },
  { to: '/app/history', end: false, label: 'History', icon: historyIcon },
  { to: '/app/calendar', end: false, label: 'Calendar', icon: calendarIcon },
  { to: '/app/progress', end: false, label: 'Progress', icon: progressIcon },
  { to: '/app/achievements', end: false, label: 'Achievements', icon: achievementsIcon },
  { to: '/app/exercises', end: false, label: 'Exercises', icon: exercisesIcon },
  { to: '/app/profile', end: false, label: 'Profile', icon: profileIcon },
]

// The five slots on the mobile bottom bar — the rest live under "More".
export const mobileNavItems: NavItem[] = [
  { to: '/app', end: true, label: 'Home', icon: homeIcon },
  { to: '/app/log', end: false, label: 'Log', icon: logIcon },
  { to: '/app/calendar', end: false, label: 'Calendar', icon: calendarIcon },
  { to: '/app/progress', end: false, label: 'Progress', icon: progressIcon },
  { to: '/app/more', end: false, label: 'More', icon: moreIcon },
]

// Shown on the mobile-only "More" page.
export const moreNavItems: NavItem[] = [
  { to: '/app/history', end: false, label: 'History', icon: historyIcon },
  { to: '/app/achievements', end: false, label: 'Achievements', icon: achievementsIcon },
  { to: '/app/exercises', end: false, label: 'Exercises', icon: exercisesIcon },
  { to: '/app/profile', end: false, label: 'Profile', icon: profileIcon },
]
