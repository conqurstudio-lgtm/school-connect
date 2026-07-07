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

const REPORT_SECTION_HEADING_STYLE: any = {
  maxWidth: 370,
  margin: '18px auto 8px',
  padding: '0 2px',
  fontSize: 13,
  fontWeight: 650,
  color: '#252525',
  letterSpacing: '-0.015em',
  lineHeight: 1.2,
  textAlign: 'left',
}

const REPORT_SECTION_SUBTEXT_STYLE: any = {
  maxWidth: 370,
  margin: '-4px auto 10px',
  padding: '0 2px',
  fontSize: 12.2,
  fontWeight: 420,
  color: '#7C8486',
  letterSpacing: '-0.004em',
  lineHeight: 1.35,
  textAlign: 'left',
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


function getSubjectScoreTagStyle(score: number): any {
  if (score >= 4.5) return { background: '#EAF8EF', color: '#15803D', borderColor: 'rgba(21,128,61,0.16)' }
  if (score >= 4) return { background: '#EEF6FF', color: '#2563EB', borderColor: 'rgba(37,99,235,0.16)' }
  if (score >= 3.5) return { background: '#FFF7E6', color: '#B45309', borderColor: 'rgba(180,83,9,0.16)' }
  if (score >= 3) return { background: '#F5F3FF', color: '#6D28D9', borderColor: 'rgba(109,40,217,0.16)' }
  if (score >= 2.5) return { background: '#FFF1F2', color: '#BE123C', borderColor: 'rgba(190,18,60,0.16)' }
  return { background: '#FEF2F2', color: '#B91C1C', borderColor: 'rgba(185,28,28,0.16)' }
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
  const size = compact ? 196 : 220
  const stroke = compact ? 4.2 : 4.6
  const center = size / 2
  const radius = (size - stroke - 14) / 2
  const circumference = 2 * Math.PI * radius

  // Open gap at the bottom, like the reference image.
  const arcRatio = 0.82
  const arcLength = circumference * arcRatio
  const gapLength = circumference - arcLength
  const targetPct = Math.max(0, Math.min(1, Number(score) / max))

  const [displayScore, setDisplayScore] = useState(0)
  const [displayPct, setDisplayPct] = useState(0)

  useEffect(() => {
    const duration = 950
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 4)

      setDisplayScore(Number(score) * eased)
      setDisplayPct(targetPct * eased)

      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score, targetPct])

  const progressLength = arcLength * displayPct

  // The visible arc starts at bottom-left and ends at bottom-right, leaving the gap below.
  const rotation = 128

  const knobAngle = rotation + 360 * arcRatio * displayPct
  const knobX = center + radius * Math.cos((knobAngle * Math.PI) / 180)
  const knobY = center + radius * Math.sin((knobAngle * Math.PI) / 180)

  return (
    <div className="sc-open-gap-score-circle-v1" style={{
      position: 'relative',
      width: size,
      height: size,
      margin: '0 auto',
    }}>
      <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(17,17,17,0.14)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${gapLength}`}
          strokeDashoffset={0}
          transform={`rotate(${rotation} ${center} ${center})`}
        />

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#111111"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(${rotation} ${center} ${center})`}
        />

        <circle
          cx={knobX}
          cy={knobY}
          r={compact ? 10 : 11}
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth={stroke}
        />
      </svg>

      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: compact ? 12 : 14,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: compact ? 34 : 40,
          fontWeight: 420,
          color: '#111111',
          letterSpacing: '-0.065em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayScore.toFixed(1)}
        </div>

        <div style={{
          fontSize: 12,
          color: '#8E8E93',
          fontWeight: 430,
          marginTop: 7,
          letterSpacing: '-0.01em',
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



function getSubjectParentLabel(score: number): string {
  if (score >= 4.3) return 'Excellent'
  if (score >= 3.6) return 'Good'
  if (score >= 2.8) return 'Growing'
  return 'Help needed'
}

function getSubjectChangePhrase(previousScore: number | null, currentScore: number): string {
  if (previousScore === null || !Number.isFinite(previousScore)) {
    return ''
  }

  const change = currentScore - previousScore

  if (change >= 0.3) return 'This has improved since the previous report.'
  if (change <= -0.3) return 'This has gone down since the previous report, so a little extra support will help.'
  return 'This is steady compared with the previous report.'
}

function getSubjectParentTip(
  childName: string | undefined,
  subject: string,
  score: number,
  previousScore: number | null
): string {
  const firstName = String(childName || 'The learner').split(' ')[0] || 'The learner'
  const name = shortenSubject(String(subject || 'this subject'))
  const changePhrase = getSubjectChangePhrase(previousScore, score)
  const changeText = changePhrase ? ` ${changePhrase}` : ''

  if (score >= 4.3) {
    return `${firstName} is excelling in ${name}.${changeText} Keep encouraging this strength with praise and small challenges.`
  }

  if (score >= 3.6) {
    return `${firstName} is doing well in ${name}.${changeText} A little regular practice can help this become even stronger.`
  }

  if (score >= 2.8) {
    return `${firstName} is growing in ${name}.${changeText} Short practice at home and gentle encouragement will help build confidence.`
  }

  return `${firstName} needs extra help in ${name}.${changeText} Focus on one small activity at a time and ask the teacher what to practise first.`
}

function buildParentReportMemo(childName: string | undefined, subjects: [string, number][]): string {
  const firstName = String(childName || 'The learner').split(' ')[0] || 'The learner'
  const rows = subjects
    .map(([name, score]) => [String(name), Number(score)] as [string, number])
    .filter(([, score]) => Number.isFinite(score))

  if (!rows.length) {
    return `${firstName}'s report is ready. The subject notes below will guide what to support at home.`
  }

  const strongest = rows
    .filter(([, score]) => score >= 3.8)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => shortenSubject(name))

  const support = rows
    .filter(([, score]) => score < 3.2)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([name]) => shortenSubject(name))

  if (strongest.length && support.length) {
    return `${firstName} is strongest in ${strongest.join(' and ')}. The subject notes below show where to keep encouraging progress and where to give extra support.`
  }

  if (strongest.length) {
    return `${firstName} is showing strong progress, especially in ${strongest.join(' and ')}. Keep supporting this with simple weekly practice.`
  }

  if (support.length) {
    return `${firstName} will benefit from extra support in ${support.join(' and ')}. The notes below suggest where to focus at home.`
  }

  return `${firstName} is progressing steadily. The subject notes below show what to keep practising and encouraging.`
}


function getPreviousSubjectScore(previousScores: Record<string, number> | null | undefined, subject: string): number | null {
  if (!previousScores) return null

  const raw = Number(previousScores[subject])
  if (!Number.isFinite(raw)) return null

  return Math.max(0, Math.min(5, raw))
}

function buildWeeklyPerformanceExplainer(
  childName: string | undefined,
  subjects: [string, number][]
): string {
  const firstName = String(childName || 'The learner').split(' ')[0] || 'The learner'
  const rows = subjects
    .map(([name, score]) => [String(name), Number(score)] as [string, number])
    .filter(([, score]) => Number.isFinite(score))

  if (!rows.length) {
    return `These marks give a quick view of how ${firstName} performed across the subjects covered this week.`
  }

  const average = rows.reduce((sum, [, score]) => sum + score, 0) / rows.length
  const strongest = rows.slice().sort((a, b) => b[1] - a[1])[0]?.[0]
  const support = rows.slice().sort((a, b) => a[1] - b[1])[0]?.[0]

  if (average >= 4.3) {
    return `${firstName} had a strong week overall. The scores below show the subjects where they are doing especially well and where steady practice should continue.`
  }

  if (average >= 3.5) {
    return `${firstName} is making good progress this week. Use the subject scores below to see strengths and the areas that need light support at home.`
  }

  if (average >= 2.8) {
    return `${firstName} is growing steadily this week. The scores below help show where confidence is building and where extra practice may help.`
  }

  return `${firstName} may need extra support this week. The scores below help highlight which subjects may need more attention and encouragement.`
}


export function ReportCard({ report, childName }: Props) {
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
    <section className="sc-parent-report-card-view" style={{ paddingBottom: 28 }}>
      {/* ── Hero ─────────────────── */}
      <div style={{ textAlign: 'center', padding: '22px 0 24px', opacity: mutedReportOpacity }}>
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
          fontSize: 12.3, color: isLatestReport ? '#5F6268' : '#7C8486', margin: '0 0 18px',
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
        </div>

        <div style={{ marginTop: 8 }}>
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

      {/* ── Teacher's note ─────────────────── */}

      {/* ── Teacher's note ─────────────────── */}
      {report.comment && (
        <section
          className="sc-parent-report-teacher-note-avatar-line-v437 sc-clean-teacher-comment-v2"
          aria-label="Teacher comment"
          style={{
            maxWidth: 330,
            margin: '8px auto 0',
            padding: '0 18px',
            textAlign: 'center',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
        >
          <p style={{
            fontSize: 12.4,
            color: '#6F7378',
            margin: 0,
            lineHeight: 1.58,
            letterSpacing: '-0.006em',
            fontWeight: 390,
            textAlign: 'center',
          }}>
            {report.comment}
          </p>

          {teacherName ? (
            <p style={{
              margin: '8px 0 0',
              fontSize: 11.2,
              color: '#A0A0A4',
              fontWeight: 450,
              letterSpacing: '-0.004em',
              textAlign: 'center',
            }}>
              {teacherName}
            </p>
          ) : null}
        </section>
      )}

      {subjects.length > 0 && (
        <section
          className="sc-report-subject-panel sc-report-subject-panel-inline sc-clean-subjects-v2"
          aria-label="Subject scores"
          style={{
            width: '100%',
            maxWidth: 370,
            margin: '14px auto 0',
            padding: 0,
            borderRadius: 0,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
        >
          <div className="sc-report-subject-slider-v1 sc-clean-subject-slider-v2" aria-label="Subject score cards">
            {subjects.map(([name, score]) => {
              const numericScore = Number(score)
              const safeScore = Number.isFinite(numericScore) ? Math.max(0, Math.min(5, numericScore)) : 0
              const previousScore = getPreviousSubjectScore(report.previous_scores, String(name))
              const change = previousScore === null ? null : safeScore - previousScore

              return (
                <article key={String(name)} className="sc-report-subject-slide-card-v1 sc-clean-subject-card-v2">
                  <div className="sc-clean-subject-row-v2">
                    <p className="sc-clean-subject-name-v2">
                      {shortenSubject(String(name))}
                    </p>

                    <span
                      className="sc-clean-subject-tag-v2"
                      style={getSubjectScoreTagStyle(safeScore)}
                    >
                      {change === null
                        ? getSubjectParentLabel(safeScore)
                        : Math.abs(change) < 0.05
                          ? 'same'
                          : `${change > 0 ? '+' : ''}${change.toFixed(1)}`}
                    </span>
                  </div>

                  <div className="sc-clean-subject-score-v2">
                    {safeScore.toFixed(1)}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* Subjects moved to score info popup */}

    </section>
  )
}
