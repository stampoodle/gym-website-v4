import { useMemo, useState } from 'react'
import { useWorkouts } from '../context/WorkoutsContext'
import { ALL_MUSCLE_GROUPS, computeMuscleActivityDetail, type MuscleDetail } from '../lib/stats'
import type { MuscleGroup } from '../types'

const WINDOW_OPTIONS = [7, 14, 30] as const

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  upperChest: 'Upper Chest',
  lowerChest: 'Mid / Lower Chest',
  frontDelts: 'Front Delts',
  sideDelts: 'Side Delts',
  rearDelts: 'Rear Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  traps: 'Traps',
  lats: 'Lats',
  upperBack: 'Upper Back',
  midBack: 'Mid Back',
  lowerBack: 'Lower Back',
  upperAbs: 'Abs / Upper Abs',
  lowerAbs: 'Lower Abs',
  obliques: 'Obliques',
  hipFlexors: 'Hip Flexors',
  adductors: 'Inner Thigh / Adductors',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
}

// Region outlines are drawn for the figure's left half and mirrored for the
// right (see <Region>), so each shape is defined once.
const FRONT_REGIONS: { muscle: MuscleGroup; d: string }[] = [
  { muscle: 'sideDelts', d: 'M60 72 C53 74 49 83 49 94 C51 100 56 101 60 99 C58 91 58 82 60 72 Z' },
  { muscle: 'frontDelts', d: 'M60 72 C67 68 73 71 75 78 C77 88 75 94 74 97 C68 99 63 99 60 99 C58 91 58 82 60 72 Z' },
  { muscle: 'upperChest', d: 'M99 80 L99 100 C90 100 81 98 76 94 C77 86 84 80 99 80 Z' },
  { muscle: 'lowerChest', d: 'M99 101 L99 123 C88 125 79 119 74 108 C75 101 78 98 76 96 C82 100 90 102 99 101 Z' },
  { muscle: 'biceps', d: 'M52 102 C49 114 50 126 54 138 L66 138 C69 126 69 114 67 102 C62 99 56 99 52 102 Z' },
  { muscle: 'forearms', d: 'M53 142 C50 158 50 172 53 186 L63 186 C67 172 68 158 65 142 Z' },
  { muscle: 'obliques', d: 'M77 128 C74 146 76 166 82 186 L88 186 L88 127 C84 124 80 124 77 128 Z' },
  { muscle: 'upperAbs', d: 'M90 127 L99 127 L99 158 L90 158 C88 148 88 136 90 127 Z' },
  { muscle: 'lowerAbs', d: 'M90 160 L99 160 L99 187 L90 187 C88 178 88 168 90 160 Z' },
  { muscle: 'hipFlexors', d: 'M82 190 L99 190 L99 204 C92 208 86 206 80 200 Z' },
  { muscle: 'quads', d: 'M75 208 C71 234 72 264 78 292 L92 292 C93 262 93 236 90 212 C85 209 80 208 75 208 Z' },
  { muscle: 'adductors', d: 'M91 212 L99 208 L99 284 C96 288 93 290 91 292 C94 264 94 238 91 212 Z' },
  { muscle: 'calves', d: 'M78 302 C73 322 75 346 82 368 L94 368 C98 346 98 322 94 302 Z' },
]

const BACK_REGIONS: { muscle: MuscleGroup; d: string }[] = [
  { muscle: 'traps', d: 'M99 60 L99 98 C92 96 84 88 78 76 C86 70 94 66 99 60 Z' },
  { muscle: 'rearDelts', d: 'M60 72 C67 68 73 71 75 78 C77 88 75 94 74 97 C68 99 63 99 60 99 C57 90 57 80 60 72 Z' },
  { muscle: 'upperBack', d: 'M99 99 C92 97 84 99 79 101 C81 108 87 113 99 115 Z' },
  { muscle: 'lats', d: 'M77 102 C70 114 72 136 82 158 C89 154 91 147 89 140 C88 130 85 123 85 118 C81 113 79 108 77 102 Z' },
  { muscle: 'midBack', d: 'M99 116 C92 116 86 118 85 123 C87 132 91 138 99 140 Z' },
  { muscle: 'lowerBack', d: 'M99 142 C91 140 87 144 85 150 C87 162 92 170 99 172 Z' },
  { muscle: 'triceps', d: 'M52 102 C49 114 50 126 54 138 L66 138 C69 126 69 114 67 102 C62 99 56 99 52 102 Z' },
  { muscle: 'forearms', d: 'M53 142 C50 158 50 172 53 186 L63 186 C67 172 68 158 65 142 Z' },
  { muscle: 'glutes', d: 'M99 176 C90 172 80 176 76 187 C76 203 86 213 99 209 Z' },
  { muscle: 'hamstrings', d: 'M76 214 C72 240 72 266 78 292 L99 292 L99 214 C90 216 82 216 76 214 Z' },
  { muscle: 'calves', d: 'M78 300 C72 320 74 344 82 366 L94 366 C99 344 99 320 94 300 Z' },
]

// Neutral silhouette drawn behind the muscle regions so gaps between them
// still read as a body rather than floating shapes.
const BASE_LEFT =
  'M99 44 L99 58 C90 62 80 66 70 66 C58 68 48 78 47 96 C46 118 47 150 50 190 C52 196 64 196 66 188 C68 160 68 130 72 116 C73 150 74 176 78 196 C70 212 70 250 74 296 C71 330 74 360 80 380 C80 392 78 400 74 404 L96 404 C98 392 98 380 98 366 C99 330 99 300 99 296 L99 44 Z'

type View = 'front' | 'back'

type RegionProps = {
  muscle: MuscleGroup
  d: string
  level: number
  selected: boolean
  onSelect: (m: MuscleGroup) => void
}

function Region({ muscle, d, level, selected, onSelect }: RegionProps) {
  const cls = `mm-region mm-level-${level}` + (selected ? ' mm-region--selected' : '')
  return (
    <g
      className={cls}
      onMouseEnter={() => onSelect(muscle)}
      onFocus={() => onSelect(muscle)}
      onClick={() => onSelect(muscle)}
      tabIndex={0}
      role="button"
      aria-label={MUSCLE_LABEL[muscle]}
    >
      <path d={d} />
      <path d={d} transform="matrix(-1 0 0 1 198 0)" />
    </g>
  )
}

function levelFor(detail: MuscleDetail, windowDays: number): number {
  if (detail.daysAgo === null) return 0
  let level = 1
  if (detail.daysAgo <= Math.max(1, Math.floor(windowDays / 3))) level = 2
  if (detail.setsInWindow >= 8) level = Math.max(level, 3)
  if (detail.setsInWindow >= 15) level = 4
  return level
}

function daysAgoText(d: number | null): string {
  if (d === null) return 'Not trained in this period'
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d} days ago`
}

function Figure({
  regions,
  detail,
  windowDays,
  selected,
  onSelect,
  label,
}: {
  regions: { muscle: MuscleGroup; d: string }[]
  detail: Record<MuscleGroup, MuscleDetail>
  windowDays: number
  selected: MuscleGroup | null
  onSelect: (m: MuscleGroup) => void
  label: string
}) {
  return (
    <svg viewBox="0 0 198 410" aria-label={label} className="mm-svg">
      <g className="mm-base">
        <circle cx="99" cy="26" r="19" />
        <path d={BASE_LEFT} />
        <path d={BASE_LEFT} transform="matrix(-1 0 0 1 198 0)" />
      </g>
      {regions.map((r) => (
        <Region
          key={r.muscle}
          muscle={r.muscle}
          d={r.d}
          level={levelFor(detail[r.muscle], windowDays)}
          selected={selected === r.muscle}
          onSelect={onSelect}
        />
      ))}
    </svg>
  )
}

export default function MuscleMapSection() {
  const { workouts } = useWorkouts()
  const [windowDays, setWindowDays] = useState<(typeof WINDOW_OPTIONS)[number]>(7)
  const [view, setView] = useState<View>('front')
  const [selected, setSelected] = useState<MuscleGroup | null>(null)

  const detail = useMemo(() => computeMuscleActivityDetail(workouts, windowDays), [workouts, windowDays])

  const summary = useMemo(() => {
    const trained = ALL_MUSCLE_GROUPS.filter((m) => detail[m].daysAgo !== null)
    const untrained = ALL_MUSCLE_GROUPS.filter((m) => detail[m].daysAgo === null)
    const mostTrained = [...trained].sort((a, b) => detail[b].setsInWindow - detail[a].setsInWindow)[0]
    const mostRecent = [...trained].sort(
      (a, b) =>
        (detail[a].daysAgo ?? 999) - (detail[b].daysAgo ?? 999) ||
        detail[b].setsInWindow - detail[a].setsInWindow,
    )[0]
    return { trained, untrained, mostTrained, mostRecent }
  }, [detail])

  const sel = selected ? detail[selected] : null

  return (
    <section className="section-block">
      <div className="section-block__head">
        <h2>Muscles trained</h2>
        <div className="segmented" role="group" aria-label="Timeframe">
          {WINDOW_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={'segmented__option' + (windowDays === d ? ' segmented__option--active' : '')}
              onClick={() => setWindowDays(d)}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="mm">
        <div className="mm__figure-col">
          <div className="segmented mm__view-toggle" role="group" aria-label="Body view">
            {(['front', 'back'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                className={'segmented__option' + (view === v ? ' segmented__option--active' : '')}
                onClick={() => setView(v)}
              >
                {v === 'front' ? 'Front' : 'Back'}
              </button>
            ))}
          </div>
          <div className="mm__stage">
            <div className={'mm__layer' + (view === 'front' ? ' mm__layer--active' : '')}>
              <Figure
                regions={FRONT_REGIONS}
                detail={detail}
                windowDays={windowDays}
                selected={selected}
                onSelect={setSelected}
                label="Front muscle map"
              />
            </div>
            <div className={'mm__layer' + (view === 'back' ? ' mm__layer--active' : '')}>
              <Figure
                regions={BACK_REGIONS}
                detail={detail}
                windowDays={windowDays}
                selected={selected}
                onSelect={setSelected}
                label="Back muscle map"
              />
            </div>
          </div>
          <div className="mm__legend">
            <span><i className="mm-dot mm-level-0" /> Not trained</span>
            <span><i className="mm-dot mm-level-1" /> Light</span>
            <span><i className="mm-dot mm-level-2" /> Recent</span>
            <span><i className="mm-dot mm-level-3" /> Frequent</span>
            <span><i className="mm-dot mm-level-4" /> High volume</span>
          </div>
        </div>

        <div className="mm__side">
          <div className="mm__info" aria-live="polite">
            {selected && sel ? (
              <>
                <p className="mm__info-title">{MUSCLE_LABEL[selected]}</p>
                <dl className="mm__info-grid">
                  <div>
                    <dt>Recent training</dt>
                    <dd>{sel.setsInWindow} sets</dd>
                  </div>
                  <div>
                    <dt>Volume</dt>
                    <dd>{Math.round(sel.volumeInWindow).toLocaleString()} kg</dd>
                  </div>
                  <div>
                    <dt>Last trained</dt>
                    <dd>{daysAgoText(sel.daysAgo)}</dd>
                  </div>
                </dl>
                {sel.recentExercises.length > 0 && (
                  <>
                    <p className="mm__info-sub">Recent exercises</p>
                    <ul className="mm__info-list">
                      {sel.recentExercises.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <p className="mm__hint">Hover or tap a muscle to see what you've done for it.</p>
            )}
          </div>

          <dl className="mm__summary">
            <div>
              <dt>Most trained</dt>
              <dd>{summary.mostTrained ? MUSCLE_LABEL[summary.mostTrained] : '—'}</dd>
            </div>
            <div>
              <dt>Most recent</dt>
              <dd>{summary.mostRecent ? MUSCLE_LABEL[summary.mostRecent] : '—'}</dd>
            </div>
            <div>
              <dt>Undertrained</dt>
              <dd>
                {summary.untrained.length === 0
                  ? 'None'
                  : summary.untrained
                      .slice(0, 2)
                      .map((m) => MUSCLE_LABEL[m])
                      .join(', ') + (summary.untrained.length > 2 ? ` +${summary.untrained.length - 2}` : '')}
              </dd>
            </div>
            <div>
              <dt>Muscle groups hit</dt>
              <dd>
                {summary.trained.length} / {ALL_MUSCLE_GROUPS.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
