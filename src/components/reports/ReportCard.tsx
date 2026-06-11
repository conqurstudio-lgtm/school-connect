// @ts-nocheck
'use client'

import { useState, useEffect, useId } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getOverallScore, getScoreLabel } from '@/lib/reports'

const T = {
  ink:     '#1A1A1A',
  ink2:    '#4A4A4A',
  ink3:    '#9A9A9A',
  ink4:    '#D8D8D8',
  divider: 'rgba(0,0,0,0.035)',
  trackBg: '#EFEFF2',
  up:      '#A3A3A3',
  down:    '#BDBDBD',
  same:    '#9A9A9A',
}

const SUBJECT_GRAPH = {
  fill: '#717171',
  fillSoft: '#F5F5F5',
  track: '#F4F4F4',
  border: 'rgba(17,17,17,0.075)',
  text: '#5F5F5F',
}

function subjectGraphOpacity(score: number): number {
  const value = Number(score)
  if (!Number.isFinite(value)) return 0.35
  return Math.max(0.35, Math.min(1, value / 5))
}

function subjectGraphColor(score: number): string {
  const opacity = subjectGraphOpacity(score)
  return `rgba(113, 113, 113, ${opacity})`
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
  const size   = 172
  const stroke = 7
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
            <stop offset="0%"   stopColor="#BDBDBD" />
            <stop offset="35%"  stopColor="#CFCFCF" />
            <stop offset="70%"  stopColor="#D6D6D6" />
            <stop offset="100%" stopColor="#A3A3A3" />
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
          fontSize: 45, fontWeight: 600, color: T.ink,
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
        background: '#F5F5F5',
        color: '#717171',
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



function getSubjectCountLabel(count: number) {
  if (count === 1) return '1 subject'
  return `${count} subjects`
}

function getSubjectDetailComment(score: number) {
  if (score >= 4.5) return 'Excellent progress'
  if (score >= 4) return 'Doing very well'
  if (score >= 3) return 'Good progress'
  if (score >= 2) return 'Needs gentle support'
  return 'Seeking extra help'
}

export function ReportCard({ report, childName }: Props) {
  const [expanded, setExpanded] = useState(false)
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
  const childFirstName = String(childName || '').trim().split(/\s+/)[0] || 'Your child'
  const childTeacherLabel = childFirstName === 'Your child'
    ? 'Your child’s teacher'
    : `${childFirstName}${childFirstName.toLowerCase().endsWith('s') ? '’' : '’s'} teacher`

  return (
    <section style={{ paddingBottom: 24 }}>
      {/* ── Hero ─────────────────── */}
      <div style={{ textAlign: 'center', padding: '6px 0 28px', opacity: mutedReportOpacity }}>
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
          fontSize: 24.5, fontWeight: 630, color: T.ink,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          margin: '0 0 7px',
        }}>
          {childName ? `${childName.split(' ')[0]}'s Report` : 'Weekly Report'}
        </h2>
        <p style={{
          fontSize: 12.3, color: isLatestReport ? '#5F6268' : '#7C8486', margin: '0 0 24px',
          letterSpacing: '0.002em', fontWeight: 430,
        }}>
          {formatWeek(report.week_starting)}
        </p>

        <ScoreRing score={overall} />

        <div style={{ marginTop: 18 }}>
          <p style={{
            fontSize: 15.5, fontWeight: 560, color: isLatestReport ? T.ink : '#5F6268',
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

      {/* ── Teacher's note ─────────────────── */}
      {report.comment && (
        <div style={{
          padding: '0 10px 38px',
        }}>
          <div style={{
            maxWidth: 396,
            margin: '0 auto 10px',
          }}>
            <p style={{
              fontSize: 11.5,
              fontWeight: 560,
              color: '#717171',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Teacher note
            </p>
          </div>

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
              background: teacherPhoto ? `url(${teacherPhoto}) center/cover` : '#F5F5F5',
              color: '#717171',
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
                  color: '#5F6268',
                  fontWeight: 400,
                }}>
                  {childTeacherLabel}
                </span>
              </p>

              <div className="sc-teacher-comment-card-v310" style={{
                position: 'relative',
                background: '#F7F7F7',
                border: '1px solid rgba(17,17,17,0.045)',
                borderRadius: '18px 18px 18px 8px',
                padding: '12px 14px',
                overflow: 'hidden',
                boxShadow: 'none',
              }}>
                <p style={{
                  fontSize: 13.6,
                  color: '#5F6268',
                  margin: 0,
                  lineHeight: 1.52,
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

      {/* Subjects (collapsible) */}
      <div className="sc-report-subjects-clean-v306 sc-report-subjects-clean-v307" style={{
        maxWidth: 396,
        margin: '0 auto',
        padding: '0 10px',
      }}>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          style={{
            width: 'fit-content',
            minHeight: 38,
            padding: '0 18px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#252525',
            border: 'none',
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginBottom: expanded ? 12 : 0,
          }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 520,
            color: '#FFFFFF',
            letterSpacing: '-0.005em',
            lineHeight: 1,
          }}>
            Subjects
          </span>
        </button>

        {expanded && (
          <div className="sc-report-subjects-list-v306 sc-report-subjects-list-v307" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '2px 0 8px',
          }}>
            {subjects.length ? subjects.map(([name, score]) => {
              const numericScore = Number(score)
              const safeScore = Number.isFinite(numericScore) ? Math.max(0, Math.min(5, numericScore)) : 0
              const pct = (safeScore / 5) * 100
              const prev = report.previous_scores?.[name]
              const delta = prev !== undefined ? safeScore - Number(prev) : null
              const detailComment = getSubjectDetailComment(safeScore)

              return (
                <div key={String(name)} className="sc-report-subject-detail-row-v306 sc-report-subject-detail-row-v307" style={{
                  padding: '8px 0',
                  borderTop: 'none',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 14,
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        fontSize: 13.5,
                        color: '#252525',
                        fontWeight: 540,
                        letterSpacing: '-0.01em',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }} title={String(name)}>
                        {shortenSubject(String(name))}
                      </p>

                      <div style={{
                        height: 3,
                        width: '100%',
                        maxWidth: 180,
                        borderRadius: 999,
                        background: 'rgba(37,37,37,0.065)',
                        overflow: 'hidden',
                        marginTop: 8,
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: 999,
                          background: '#5F5F5F',
                        }} />
                      </div>

                      <p style={{
                        fontSize: 12.3,
                        color: '#6F7476',
                        lineHeight: 1.35,
                        margin: '6px 0 0',
                        fontWeight: 400,
                      }}>
                        {detailComment}
                      </p>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexShrink: 0,
                    }}>
                      {delta !== null && <Delta value={delta} />}

                      <span style={{
                        minWidth: 34,
                        height: 28,
                        borderRadius: 999,
                        background: '#F7F7F7',
                        color: '#252525',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 560,
                        fontVariantNumeric: 'tabular-nums',
                        padding: '0 8px',
                      }}>
                        {safeScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }) : (
              <p style={{
                fontSize: 13,
                color: '#7C8486',
                lineHeight: 1.5,
                margin: 0,
              }}>
                No subject details were added to this report.
              </p>
            )}
          </div>
        )}
      </div>

    </section>
  )
}
