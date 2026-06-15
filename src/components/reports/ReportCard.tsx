// @ts-nocheck
'use client'

import { useState, useEffect, useId } from 'react'
import { TrendingUp, TrendingDown, Minus, Info, X } from 'lucide-react'
import { getOverallScore, getScoreColor, getScoreLabel } from '@/lib/reports'

const T = {
  ink:     '#1A1A1A',
  ink2:    '#4A4A4A',
  ink3:    '#9A9A9A',
  ink4:    '#D8D8D8',
  divider: 'rgba(0,0,0,0.04)',
  trackBg: '#EFEFF2',
  up:      '#22C55E',
  down:    '#EF4444',
  same:    '#9A9A9A',
}

const SUBJECT_GRAPH = {
  fill: '#8FA6A1',
  fillSoft: '#EAF0EE',
  track: '#F4F5F5',
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
function ScoreRing({ score, max = 5, compact = false }: { score: number; max?: number; compact?: boolean }) {
  const size   = compact ? 196 : 214
  const stroke = compact ? 8 : 9
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
          fontSize: compact ? 46 : 52, fontWeight: 600, color: T.ink,
          letterSpacing: '-0.04em', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayScore.toFixed(1)}
        </div>
        <div style={{
          fontSize: 13, color: '#5F6268', fontWeight: 500,
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



function getSubjectDetailComment(score: number) {
  if (score >= 4.5) return 'Excellent progress'
  if (score >= 4) return 'Doing very well'
  if (score >= 3) return 'Good progress'
  if (score >= 2) return 'Needs gentle support'
  return 'Seeking extra help'
}

export function ReportCard({ report, childName }: Props) {
  const [subjectInfoOpen, setSubjectInfoOpen] = useState(false)
  const scoreSource = report.scores || {}
  const overall  = getOverallScore(scoreSource)
  const subjects = Object.entries(scoreSource)

  const prevOverall  = report.previous_scores ? getOverallScore(report.previous_scores) : null
  const overallDelta = prevOverall !== null ? overall - prevOverall : null

  const isLatestReport = report.display_position !== 'previous'
  const reportStatusLabel = isLatestReport ? 'This week' : 'Previous report'
  const mutedReportOpacity = isLatestReport ? 1 : 0.82

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
  const schoolName =
    report.school_name ||
    report.school?.name ||
    report.schoolName ||
    ''
  const childFirstName = String(childName || '').trim().split(/\s+/)[0] || 'Your child'
  const childTeacherLabel = childFirstName === 'Your child'
    ? 'Your child’s teacher'
    : `${childFirstName}${childFirstName.toLowerCase().endsWith('s') ? '’' : '’s'} teacher`

  return (
    <section style={{ paddingBottom: 28 }}>
      {/* ── Hero ─────────────────── */}
      <div style={{ textAlign: 'center', padding: '24px 0 46px', opacity: mutedReportOpacity }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 22,
          padding: '0 9px',
          borderRadius: 999,
          border: '1px solid rgba(0,0,0,0.045)',
          color: isLatestReport ? '#252525' : '#7C8486',
          background: 'transparent',
          fontSize: 10.5,
          fontWeight: 470,
          letterSpacing: '0.045em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          {reportStatusLabel}
        </div>

        <h2 style={{
          fontSize: 26.5, fontWeight: 650, color: T.ink,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          margin: '0 0 8px',
        }}>
          {childName ? `${childName.split(' ')[0]}'s Report` : 'Weekly Report'}
        </h2>
        <p style={{
          fontSize: 12.3, color: isLatestReport ? '#5F6268' : '#7C8486', margin: '0 0 32px',
          letterSpacing: '0.002em', fontWeight: 430,
        }}>
          {formatWeek(report.week_starting)}
        </p>

        <div className="sc-report-score-info-clean-v441" style={{
          position: 'relative',
          width: 'fit-content',
          margin: '0 auto',
        }}>
          <ScoreRing score={overall} compact={!isLatestReport} />

          {subjects.length > 0 && (
            <button
              type="button"
              onClick={() => setSubjectInfoOpen(true)}
              aria-label="View subject scores"
              className="sc-report-info-button"
              style={{
                position: 'absolute',
                top: -7,
                right: -21,
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                zIndex: 8,
              }}
            >
              <Info size={15.5} strokeWidth={2.05} />
            </button>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <p style={{
            fontSize: 16, fontWeight: 560, color: isLatestReport ? T.ink : '#5F6268',
            letterSpacing: '-0.02em', margin: 0,
          }}>
            {getScoreLabel(overall)}
          </p>
          {overallDelta !== null && (
            <div style={{ marginTop: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Delta value={overallDelta} size={13} />
              <span style={{ fontSize: 12.5, color: '#5F6268', fontWeight: 430 }}>
                from last week
              </span>
            </div>
          )}
        </div>
      </div>
      {subjectInfoOpen && (
        <div
          className="sc-report-subject-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Subject scores"
          onClick={() => setSubjectInfoOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147482500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 22,
          }}
        >
          <div
            className="sc-report-subject-panel"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 352,
              padding: '18px 18px 14px',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 14,
              marginBottom: 10,
            }}>
              <div>
                <p style={{
                  fontSize: 15,
                  fontWeight: 640,
                  color: T.ink,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}>
                  Subject scores
                </p>
                <p style={{
                  fontSize: 12.1,
                  color: '#8A8D92',
                  margin: '4px 0 0',
                  lineHeight: 1.35,
                }}>
                  A simple breakdown of this report.
                </p>
              </div>

              <button
                className="sc-report-subject-close"
                type="button"
                onClick={() => setSubjectInfoOpen(false)}
                aria-label="Close subject scores"
                style={{
                  width: 30,
                  height: 30,
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
            }}>
              {subjects.map(([name, score]) => {
                const numericScore = Number(score)
                const safeScore = Number.isFinite(numericScore) ? Math.max(0, Math.min(5, numericScore)) : 0
                const meaning = getSubjectDetailComment(safeScore)

                return (
                  <div key={String(name)} className="sc-report-subject-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 14,
                    alignItems: 'center',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 13.2,
                        color: '#252525',
                        fontWeight: 560,
                        letterSpacing: '-0.01em',
                        margin: 0,
                      }}>
                        {shortenSubject(String(name))}
                      </p>

                      <p style={{
                        fontSize: 12,
                        color: '#7C8486',
                        margin: '4px 0 0',
                        lineHeight: 1.35,
                      }}>
                        {meaning}
                      </p>
                    </div>

                    <span className="sc-report-subject-chip" style={{
                      minWidth: 40,
                      height: 30,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {safeScore.toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Teacher's note ─────────────────── */}
      {report.comment && (
        <section className="sc-parent-report-teacher-note-avatar-line-v437" style={{
          maxWidth: 370,
          margin: '8px auto 46px',
          padding: '0 18px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 12.7,
            color: '#3F4247',
            margin: 0,
            lineHeight: 1.72,
            letterSpacing: '-0.004em',
            fontWeight: 380,
            textAlign: 'center',
          }}>
            {report.comment}
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            marginTop: 14,
          }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: teacherPhoto ? `url(${teacherPhoto}) center/cover` : '#F4F4F5',
              color: '#7A7D82',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8.5,
              fontWeight: 620,
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {!teacherPhoto && teacherInitials}
            </div>

            <span style={{
              fontSize: 11,
              color: '#9A9CA3',
              lineHeight: 1.2,
              fontWeight: 500,
              letterSpacing: '-0.002em',
            }}>
              From {teacherName}
            </span>
          </div>
        </section>
      )}

      {/* Subjects moved to score info popup */}

    </section>
  )
}
