// @ts-nocheck
'use client'

import { useState, useEffect, useId } from 'react'
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getOverallScore, getScoreColor, getScoreLabel } from '@/lib/reports'

const T = {
  ink:     '#1A1A1A',
  ink2:    '#4A4A4A',
  ink3:    '#9A9A9A',
  ink4:    '#D8D8D8',
  divider: 'rgba(0,0,0,0.06)',
  trackBg: '#EFEFF2',
  up:      '#22C55E',
  down:    '#EF4444',
  same:    '#9A9A9A',
}

const SUBJECT_GRAPH = {
  fill: '#8FA6A1',
  fillSoft: '#EAF0EE',
  track: '#F3F5F4',
  border: 'rgba(143,166,161,0.20)',
  text: '#51615E',
}

function subjectGraphOpacity(score: number): number {
  const value = Number(score)
  if (!Number.isFinite(value)) return 0.35
  return Math.max(0.35, Math.min(1, value / 5))
}

function subjectGraphColor(score: number): string {
  const opacity = subjectGraphOpacity(score)
  return `rgba(143, 166, 161, ${opacity})`
}

interface Props {
  report: {
    id:              string
    week_starting:   string
    scores:          Record<string, number>
    previous_scores: Record<string, number> | null
    comment:         string | null
    teacher_name?:   string
    child_name:      string
  }
  childName?: string
}

// Shorten common SA subject names
function shortenSubject(name: string): string {
  const map: Record<string, string> = {
    'English Home Language':                  'English HL',
    'English First Additional Language':      'English FAL',
    'Afrikaans Home Language':                'Afrikaans HL',
    'Afrikaans First Additional Language':    'Afrikaans FAL',
    'isiZulu Home Language':                  'isiZulu HL',
    'isiXhosa Home Language':                 'isiXhosa HL',
    'Sesotho Home Language':                  'Sesotho HL',
    'Setswana Home Language':                 'Setswana HL',
    'Sepedi Home Language':                   'Sepedi HL',
    'siSwati Home Language':                  'siSwati HL',
    'Tshivenda Home Language':                'Tshivenda HL',
    'Xitsonga Home Language':                 'Xitsonga HL',
    'isiNdebele Home Language':               'isiNdebele HL',
    'Mathematical Literacy':                  'Math Lit',
    'Natural Sciences':                       'Natural Sci',
    'Physical Sciences':                      'Physical Sci',
    'Life Sciences':                          'Life Sci',
    'Technical Mathematics':                  'Tech Math',
    'Technical Sciences':                     'Tech Sci',
    'Social Sciences':                        'Social Sci',
    'Life Orientation':                       'Life Orient.',
    'Business Studies':                       'Business',
    'Economic and Management Sciences':       'EMS',
    'Information Technology':                 'IT',
    'Computer Applications Technology':       'CAT',
    'Engineering Graphics and Design':        'EGD',
    'Personal and Social Wellbeing':          'Wellbeing',
    'Beginning Knowledge':                    'Begin. Know.',
    'Agricultural Sciences':                  'Agri Sci',
    'Agricultural Management Practices':      'Agri Mgmt',
    'Agricultural Technology':                'Agri Tech',
    'Hospitality Studies':                    'Hospitality',
    'Consumer Studies':                       'Consumer',
    'Dramatic Arts':                          'Drama',
    'Dance Studies':                          'Dance',
    'Religion Studies':                       'Religion',
    'Coding & Robotics':                      'Coding',
    'Physical Education':                     'PE',
    'Sport Science':                          'Sport Sci',
  }
  return map[name] ?? name
}

// Pick a powerful and encouraging emoji based on the score
function getScoreEmoji(score: number): string {
  if (score >= 4.5) return '🏆'   // excellent
  if (score >= 4)   return '✨'   // very good
  if (score >= 3.5) return '⭐'   // good
  return '🌱'                    // needs work / growing
}

function formatWeek(date: string): string {
  const d = new Date(date)
  const end = new Date(d); end.setDate(d.getDate() + 4)
  const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${d.toLocaleDateString('en-ZA', opt)} – ${end.toLocaleDateString('en-ZA', opt)}, ${d.getFullYear()}`
}

function Delta({ value, size = 12 }: { value: number; size?: number }) {
  if (Math.abs(value) < 0.1) {
    return <Minus size={size} strokeWidth={2} color={T.same} />
  }
  const up = value > 0
  const color = up ? T.up : T.down
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2,
                   fontSize: size, color, fontWeight: 600 }}>
      {up ? <TrendingUp size={size} strokeWidth={2.4} /> : <TrendingDown size={size} strokeWidth={2.4} />}
      {up ? '+' : ''}{value.toFixed(1)}
    </span>
  )
}

// Circular ring with red→amber→blue→green gradient — animates on mount
function ScoreRing({ score, max = 5 }: { score: number; max?: number }) {
  const size   = 200
  const stroke = 8
  const radius = (size - stroke) / 2
  const circ   = 2 * Math.PI * radius
  const targetPct = score / max
  const reactId = useId().replace(/:/g, '')
  const gradId = `ring-grad-${reactId}`

  // Animated value — counts from 0 to score over ~900ms
  const [displayScore, setDisplayScore] = useState(0)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const duration = 900
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      // ease-out-quint for that soft landing
      const eased = 1 - Math.pow(1 - t, 5)
      setDisplayScore(score * eased)
      setPct(targetPct * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score, targetPct])

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{
        position: 'absolute', inset: 0,
        transform: 'rotate(135deg)',
      }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#EF4444" />
            <stop offset="35%"  stopColor="#F59E0B" />
            <stop offset="70%"  stopColor="#78A6FE" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={T.trackBg} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeDashoffset={0}
        />
        {/* Progress — animated by rAF in parent */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(circ * 0.75) * pct} ${circ}`}
          strokeDashoffset={0}
        />
      </svg>

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 48, fontWeight: 600, color: T.ink,
          letterSpacing: '-0.04em', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayScore.toFixed(1)}
        </div>
        <div style={{
          fontSize: 13, color: T.ink3, fontWeight: 500,
          marginTop: 6, letterSpacing: '-0.005em',
        }}>
          out of {max}
        </div>
      </div>

      {/* Emoji — sits below the ring, near the bottom edge */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        bottom: -10,
        textAlign: 'center',
        fontSize: 38, lineHeight: 1,
      }}>
        {getScoreEmoji(score)}
      </div>
    </div>
  )
}

function TeacherNameTag({ name }: { name?: string | null }) {
  if (!name) return null

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      flexWrap: 'wrap',
      marginTop: 4,
    }}>
      <span style={{
        fontSize: 13,
        fontWeight: 540,
        color: '#5F6268',
        lineHeight: 1.2,
      }}>
        {name}
      </span>

      <span style={{
        height: 22,
        padding: '0 9px',
        borderRadius: 999,
        background: '#EEF3F1',
        color: '#78918C',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 560,
        letterSpacing: '0.01em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        Your teacher
      </span>
    </div>
  )
}

export function ReportCard({ report, childName }: Props) {
  const [expanded, setExpanded] = useState(false)
  const overall  = getOverallScore(report.scores)
  const subjects = Object.entries(report.scores)

  const prevOverall  = report.previous_scores ? getOverallScore(report.previous_scores) : null
  const overallDelta = prevOverall !== null ? overall - prevOverall : null

  return (
    <section style={{ paddingBottom: 32 }}>
      {/* ── Hero ─────────────────── */}
      <div style={{ textAlign: 'center', padding: '8px 0 40px' }}>
        <h2 style={{
          fontSize: 28, fontWeight: 700, color: T.ink,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          margin: '0 0 8px',
        }}>
          {childName ? `${childName.split(' ')[0]}'s Report` : 'Weekly Report'}
        </h2>
        <p style={{
          fontSize: 13, color: T.ink3, margin: '0 0 32px',
          letterSpacing: '0.005em', fontWeight: 500,
        }}>
          {formatWeek(report.week_starting)}
        </p>

        <ScoreRing score={overall} />

        <div style={{ marginTop: 24 }}>
          <p style={{
            fontSize: 17, fontWeight: 600, color: T.ink,
            letterSpacing: '-0.02em', margin: 0,
          }}>
            {getScoreLabel(overall)}
          </p>
          {overallDelta !== null && (
            <div style={{ marginTop: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Delta value={overallDelta} size={13} />
              <span style={{ fontSize: 13, color: T.ink3, fontWeight: 500 }}>
                from last week
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Teacher's note ─────────────────── */}
      {report.comment && (
        <div style={{
          padding: '0 12px 40px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 15, color: T.ink3, margin: 0,
            lineHeight: 1.55, letterSpacing: '-0.005em',
            fontWeight: 400, maxWidth: 380, marginInline: 'auto',
          }}>
            {report.comment}
          </p>
          {report.teacher_name && (
            <p style={{
              fontSize: 12, color: T.ink4, margin: '14px 0 0',
              fontWeight: 500,
            }}>
              {report.teacher_name ? <TeacherNameTag name={report.teacher_name} /> : null}
            </p>
          )}
        </div>
      )}

      {/* ── Subjects ─────────────────── */}
      <div style={{
        borderRadius: 22,
        background: '#FFFFFF',
        border: '1px solid #ECECEC',
        boxShadow: '0 12px 34px rgba(17, 24, 39, 0.035)',
        overflow: 'hidden',
        marginTop: 2,
      }}>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%',
            padding: '16px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
          }}>
            <span style={{
              fontSize: 18,
              fontWeight: 620,
              color: '#111827',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              Subjects
            </span>

            <span style={{
              width: 4,
              height: 4,
              borderRadius: 999,
              background: '#8FA4A0',
              display: 'inline-block',
            }} />

            <span style={{
              fontSize: 17,
              fontWeight: 560,
              color: '#7C8486',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              {subjects.length}
            </span>
          </span>

          <ChevronDown
            size={16}
            strokeWidth={2.05}
            color="#7C8486"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.25s ease',
              flexShrink: 0,
            }}
          />
        </button>

        {expanded && (
          <div style={{
            margin: '0 10px 10px',
            borderRadius: 18,
            border: '1px solid #ECECEC',
            overflow: 'hidden',
            background: '#FFFFFF',
            animation: 'expandIn 0.3s ease',
          }}>
            {subjects.map(([name, rawScore], index) => {
              const score = Number(rawScore)
              const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(5, score)) : 0
              const pct = (safeScore / 5) * 100
              const prev = report.previous_scores?.[name]
              const delta = prev !== undefined ? safeScore - Number(prev) : null
              const label = getScoreLabel(safeScore)
              const progressText = safeScore >= 4.5
                ? 'Excellent Progress'
                : safeScore >= 3
                  ? 'Good Progress'
                  : safeScore >= 2
                    ? 'Steady Progress'
                    : 'Needs Support'

              return (
                <div key={name} style={{
                  padding: '15px 12px',
                  borderTop: index === 0 ? 'none' : '1px solid #ECECEC',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 10,
                  }}>
                    <span style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 13.8,
                      color: '#111827',
                      fontWeight: 580,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.22,
                    }} title={name}>
                      {name}
                    </span>

                    <div style={{
                      flex: '0 0 auto',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 5,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}>
                        {delta !== null && <Delta value={delta} />}
                        <span style={{
                          fontSize: 16,
                          color: '#111827',
                          fontWeight: 620,
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '-0.025em',
                          lineHeight: 1,
                        }}>
                          {safeScore.toFixed(1)}
                        </span>
                      </div>

                      <span style={{
                        minHeight: 20,
                        padding: '0 8px',
                        borderRadius: 8,
                        background: '#F5F6F6',
                        color: '#6E8882',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10.5,
                        fontWeight: 540,
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    position: 'relative',
                    height: 8,
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 'auto 0',
                      height: 3,
                      width: '100%',
                      borderRadius: 999,
                      background: '#F2F3F3',
                    }} />
                    <div style={{
                      position: 'absolute',
                      inset: 'auto 0 auto 0',
                      height: 3,
                      width: `${pct}%`,
                      borderRadius: 999,
                      background: '#8FA4A0',
                      transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    minWidth: 0,
                  }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: '#8FA4A0',
                      flexShrink: 0,
                    }} />

                    <span style={{
                      fontSize: 11.5,
                      color: '#7C8486',
                      fontWeight: 500,
                      letterSpacing: '-0.005em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {progressText}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </section>
  )
}
