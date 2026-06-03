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

  const teacherName = report.teacher_name || 'Teacher'
  const teacherInitials = String(teacherName || 'T')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'T'
  const teacherPhoto =
    report.teacher_photo_url ||
    report.teacher_avatar_url ||
    report.teacher_image_url ||
    report.photo_url ||
    ''

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
          padding: '0 10px 40px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 11,
            maxWidth: 396,
            margin: '0 auto',
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 15,
              background: teacherPhoto ? `url(${teacherPhoto}) center/cover` : '#EEF3F1',
              color: '#8FA6A1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 560,
              letterSpacing: '-0.01em',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {!teacherPhoto && teacherInitials}
            </div>

            <div style={{
              flex: 1,
              minWidth: 0,
              paddingTop: 1,
            }}>
              <p style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                flexWrap: 'wrap',
                fontSize: 13.5,
                color: T.ink,
                fontWeight: 560,
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
                margin: '0 0 8px',
              }}>
                <span style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  maxWidth: 210,
                }}>
                  {teacherName}
                </span>

                <span style={{
                  color: T.ink3,
                  fontWeight: 400,
                }}>
                  · Your teacher
                </span>
              </p>

              <div style={{
                position: 'relative',
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: '18px 18px 18px 8px',
                padding: '12px 14px',
                overflow: 'hidden',
              }}>
                <p style={{
                  fontSize: 13.6,
                  color: '#5F6268',
                  margin: 0,
                  lineHeight: 1.56,
                  letterSpacing: '-0.005em',
                  fontWeight: 400,
                }}>
                  {report.comment}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Subjects (collapsible) ─────────────────── */}
      <div>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%', padding: '14px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none',
            borderTop: `1px solid ${T.divider}`,
            borderBottom: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: T.ink3,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Subjects · {subjects.length}
          </span>
          <ChevronDown size={16} strokeWidth={2} color={T.ink3}
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
        </button>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18,
                        padding: '20px 0 4px',
                        animation: 'expandIn 0.3s ease' }}>
            {subjects.map(([name, score]) => {
              const pct   = (Number(score) / 5) * 100
              const prev  = report.previous_scores?.[name]
              const delta = prev !== undefined ? Number(score) - Number(prev) : null

              return (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{
                    flex: '0 0 140px',
                    fontSize: 13.5, color: T.ink, fontWeight: 500,
                    letterSpacing: '-0.005em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={name}>
                    {shortenSubject(name)}
                  </span>

                  <div style={{
                    flex: 1, position: 'relative',
                    height: 10, display: 'flex', alignItems: 'center',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 'auto 0',
                      height: 3, width: '100%', borderRadius: 2,
                      background: '#F3F5F4',
                    }} />
                    <div style={{
                      position: 'absolute', inset: 'auto 0 auto 0',
                      height: 3, width: `${pct}%`, borderRadius: 2,
                      background: '#8FA6A1',
                      transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>

                  <div style={{
                    flex: '0 0 auto',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {delta !== null && <Delta value={delta} />}
                    <span style={{
                      fontSize: 13, color: T.ink, fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: 28, textAlign: 'right',
                    }}>
                      {Number(score).toFixed(1)}
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
