# GYM TRAINA

A gym training log and progression tracker — log your workouts after
training, and see your PRs, volume and progress over time. Built with
React, TypeScript, Vite and plain modern CSS.

**Current stage:** full working frontend across all core pages, using
temporary local/browser storage. No real accounts or database yet — that's
the next stage, and the codebase is structured so that swap is contained
to one file (`src/data/workoutsRepo.ts`).

## Running it in GitHub Codespaces

1. Open the repository on GitHub and choose **Code → Codespaces → Create codespace on main**.
2. In the terminal: `npm install`
3. Then: `npm run dev`
4. Open the forwarded port (a pop-up offers this, or use the **Ports** tab).

## What's here

- **Landing page** (`/`) — positioning: train hard, log it, see the progress.
  "Log in" / "Create account" go to real sign-up/login pages, not straight
  into the app.
- **Sign up / Log in** (`/signup`, `/login`) — real client-side validation,
  but explicitly **not** connected to a real account system yet. Submitting
  shows a clear "this didn't create/check a real account" message rather
  than silently logging you in. No fake pre-made account.
- **Home** (`/app`) — weekly overview (workouts, sets, volume, exercises,
  streak), a front/back muscle map showing what you've trained recently
  (7/14/30-day toggle), recent PRs, recent workouts, quick actions.
- **Log Workout** (`/app/log`) — an after-the-session entry form: name,
  date, add exercises, add sets (weight/reps/RIR/notes), save. No timers,
  no "start/finish workout" language.
- **History** (`/app/history`) — searchable, date-filterable list of every
  logged workout; click one for the full breakdown.
- **Calendar** (`/app/calendar`) — month grid, logged days highlighted, PR
  days flagged; click a day to see that day's workout and any PRs.
- **Progress** (`/app/progress`) — volume and frequency over time, a PR
  timeline, most-trained exercises, plus a per-exercise deep dive.
- **Achievements** (`/app/achievements`) — 99 achievements across 10 categories
  and 6 rarities, with live progress bars, XP, filters and unlock modals.
  Everything derives from your logged workouts; unlocks are permanent.
- **Ranks** — XP from achievements drives 9 ranks (Bronze → Opal). **Dark
  Opal needs every achievement**, not just XP. Shown on Home and Profile.
- **Exercises** (`/app/exercises`) — the full 250-exercise library,
  searchable and filterable by category; click one for its stats page.
- **Exercise stats page** (`/app/exercises/:name`) — estimated 1RM, best
  working set, heaviest weight, total volume, times performed, charts, and
  a full history table.
- **Profile** (`/app/profile`) — rank card + rank path, name, email
  placeholder, bodyweight (powers bodyweight-strength achievements), kg/lb
  setting, and a Reset-all-data button. No fake account data.

Navigation: full sidebar on desktop (Home, Log Workout, History, Calendar,
Progress, Achievements, Exercises, Profile). On mobile, a 5-item bottom bar
(Home, Log, Calendar, Progress, More) with the rest under **More**.

## What's temporary vs. permanent

Everything works today, but lives in your browser's `localStorage`, not a
real database:

- Sign-up/login validate input but don't create or check real accounts.
- Your workouts and profile persist on this browser/device only.
- The kg/lb setting is saved but not yet applied to displayed numbers —
  everything shows in kg for now.
- The muscle map uses a heuristic mapping from exercise → muscle group
  (e.g. rows → upper back + lats, deadlifts → hamstrings + glutes + lower
  back). It's tuned to be reasonable, not a biomechanics reference.
- The body outline on Home is a clean stylised SVG built from simple
  shapes, not a detailed anatomical illustration — this keeps it
  dependency-free and legible at small sizes, as a fallback if that was
  ever impractical.
- A few exercise names repeat across categories in your 250-exercise list
  (e.g. "Cable Kickback" for both triceps and glutes) — those keep a
  qualifier, like "Cable Kickback (Glutes)", so every name is unique.

All of this is exactly what Supabase will replace next: real accounts, and
data tied to your account instead of your browser.

## Other commands

| Command             | What it does                              |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Starts the development server             |
| `npm run build`      | Creates a production build in `dist/`     |
| `npm run preview`    | Serves the production build locally       |
| `npm run typecheck`  | Checks TypeScript types without building  |

## Project layout

```
index.html / vite.config.ts / tsconfig.json / .devcontainer/
src/
  main.tsx, App.tsx          entry point + route table
  types.ts                    shared data shapes
  styles.css                  all styling, numbered sections
  data/
    workoutsRepo.ts           the ONLY file that knows workouts live in localStorage
    achievementsRepo.ts       permanent unlock records (localStorage)
  context/
    WorkoutsContext.tsx       workout state, backed by workoutsRepo
    ProfileContext.tsx        placeholder profile, localStorage
  lib/
    format.ts                 dates, 1RM math, volume
    exerciseLibrary.ts         250 exercises, categorised + muscle-tagged
    achievements.ts            central achievement definitions + evaluation
    progression.ts             progressive-overload + per-workout metrics
    ranks.ts                   rank definitions + XP/Dark Opal logic
    rarity.ts / achievementFormat.ts   labels + display helpers
    stats.ts                   PRs, exercise stats, muscle activity, achievements
  components/
    NavBar / Hero / Features / Footer     landing page
    Logo                       GYM TRAINA wordmark
    AppLayout / SideNav / BottomNav / navItems   navigation
    ExercisePickerModal         search-and-select exercise picker
    LineChart                   small dependency-free chart
    MuscleMap                   stylised front/back muscle map
  pages/
    Landing, SignUp, Login
    Dashboard, LogWorkout, History, HistoryDetail, Calendar,
    Progress, Achievements, Exercises, ExerciseDetail, Profile, More
```

## Achievement notes

- New users start empty: **no demo data**, so every stat, PR, achievement,
  XP total and rank comes from real logs.
- "PR" achievements count genuine improvements over a previous best. An
  exercise's first-ever session is a baseline, not a record.
- Bodyweight achievements use Barbell Bench Press, Barbell Back Squat and
  Conventional Deadlift, against the bodyweight set in Profile.
- "Perfect Session" (complete every exercise in a *planned* workout) is not
  included: GYM TRAINA has no planned-workout feature to measure it against.
- "Gym Encyclopedia: Master" asks for 300 exercises; the library has 250.
  It stays as specified and unlocks once the library grows.
