// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
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
  fontWeight: 420,
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
  if (name === 'Mathematics') return 'Maths'
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


function SubjectMiniRing({ score }: { score: number }) {
  const size = 54
  const stroke = 2.35
  const center = size / 2
  const radius = (size - stroke - 5) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(1, Number(score) / 5))
  const tone = getScoreTone(score)

  return (
    <div
      className="sc-subject-mini-ring-v1"
      style={{
        '--subject-ring-tone': tone.ring,
        '--subject-score-tone': tone.text,
      } as React.CSSProperties}
      aria-label={`Score ${score.toFixed(1)} out of 5`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(17,17,17,0.22)"
          strokeWidth={stroke}
        />
        <circle
          className="sc-subject-mini-ring-progress-v1"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={tone.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * progress} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span>{score.toFixed(1)}</span>
    </div>
  )
}

// Circular ring with red→amber→blue→green gradient — animates on mount
function ScoreRing({ score, max = 5, compact = false }: { score: number; max?: number; compact?: boolean }) {
  const size = compact ? 214 : 244
  const stroke = compact ? 2.15 : 2.35
  const center = size / 2
  const radius = (size - stroke - 14) / 2
  const circumference = 2 * Math.PI * radius

  // Premium thin open ring: emotional like the old score moment, but cleaner.
  const arcRatio = 0.76
  const arcLength = circumference * arcRatio
  const gapLength = circumference - arcLength
  const targetPct = Math.max(0, Math.min(1, Number(score) / max))
  const tone = getScoreTone(Number(score))

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
  const rotation = 132
  return (
    <div className="sc-combined-score-ring-v1" style={{
      position: 'relative',
      width: size,
      height: size,
      margin: '0 auto',
      '--score-tone': tone.text,
      '--score-ring-tone': tone.ring,
    } as React.CSSProperties}>
      <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(17,17,17,0.13)"
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
          stroke={tone.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="sc-score-ring-progress-tone-v1"
          strokeDasharray={`${progressLength} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(${rotation} ${center} ${center})`}
        />
      </svg>

      <div
        className="sc-ring-gap-score-emoji-v1"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          right: 'auto',
          top: 'auto',
          bottom: compact ? 16 : 18,
          transform: 'translateX(-50%)',
          width: 'auto',
          height: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: compact ? 21 : 24,
          lineHeight: 1,
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        {getReportScoreEmoji(Number(score))}
      </div>

      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: '55%',
        transform: 'translateY(-50%)',
        textAlign: 'center',
      }}>
        <div className="sc-main-score-number-tone-v1" style={{
          fontSize: compact ? 45 : 56,
          fontWeight: 420,
          color: tone.text,
          letterSpacing: '-0.075em',
          lineHeight: 0.92,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayScore.toFixed(1)}
        </div>

        <div style={{
          fontSize: compact ? 11.8 : 12.8,
          color: '#8E8E93',
          fontWeight: 430,
          marginTop: 4,
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

function getReportScoreEmoji(score: number) {
  if (score >= 4.5) return '🏆'
  if (score >= 3.5) return '✨'
  if (score >= 2.5) return '🙂'
  if (score >= 1.5) return '🌱'
  return '💛'
}

function getScoreTone(score: number) {
  if (score <= 1.9) {
    return { ring: '#C24132', text: '#B33427' }
  }

  if (score <= 2.9) {
    return { ring: '#D97706', text: '#B65F00' }
  }

  if (score <= 3.9) {
    return { ring: '#B89412', text: '#8A6F0A' }
  }

  if (score <= 4.4) {
    return { ring: '#0F8B7F', text: '#087568' }
  }

  return { ring: '#0F6B45', text: '#0F6B45' }
}


function getSafeTeacherCommentIndex(seed: string, count: number) {
  let total = 0
  for (let i = 0; i < seed.length; i += 1) {
    total = (total + seed.charCodeAt(i) * (i + 1)) % 100000
  }
  return total % count
}

function getSafeWarmTeacherFallback(childName: string, score: number) {
  const name = childName || 'Your child'
  const safeScore = Number.isFinite(score) ? score : 0

  const strong = [
    `${name} has had a lovely week and is showing strong progress. The confidence and effort shown in class are encouraging.`,
    `${name} is doing well and continues to show good focus, confidence, and positive classroom habits.`,
    `${name} is showing strong consistency this week. It is wonderful to see this confidence growing in class.`,
    `${name} has shown excellent effort and steady confidence. We will keep encouraging the same positive growth.`,
  ]

  const steady = [
    `${name} is making steady progress this week. We are seeing good effort in class and will continue supporting confidence and consistency.`,
    `${name} is growing at a steady pace. We will keep encouraging participation, confidence, and calm progress in class.`,
    `${name} has had a steady week. There is positive effort, and we will keep supporting the small steps that build confidence.`,
    `${name} is settling into a good rhythm. We are supporting consistency and encouraging continued growth in class.`,
  ]

  const support = [
    `${name} had a more challenging week, but there is no need for worry. We are supporting each step calmly and will keep encouraging growth in class.`,
    `${name} needs a little more support at the moment, and that is okay. We will continue guiding confidence and progress step by step.`,
    `${name} found some areas challenging this week, but this is part of the learning journey. We are here to support and encourage steady growth.`,
    `${name} is still building confidence in some areas. We will keep working gently in class and celebrate the small wins along the way.`,
  ]

  let bank = steady
  if (safeScore >= 4) bank = strong
  else if (safeScore < 2.7) bank = support

  return bank[getSafeTeacherCommentIndex(`${name}-${safeScore.toFixed(1)}-safe-teacher`, bank.length)]
}

function getSubjectGrowthWord(score: number, change: number | null) {
  if (change !== null && change >= 0.6) return 'Great growth'
  if (change !== null && change >= 0.2) return 'Improved'
  if (change !== null && change <= -0.6) return 'Needs support'
  if (change !== null && change <= -0.2) return 'Watch area'

  if (score >= 4.6) return 'Excellent'
  if (score >= 4) return 'Progress'
  if (score >= 3.2) return 'Steady'
  if (score >= 2.4) return 'Building'
  return 'Supported'
}

function getSubjectMessageIndex(seed: string, count: number) {
  let total = 0
  for (let i = 0; i < seed.length; i += 1) {
    total = (total + seed.charCodeAt(i) * (i + 1)) % 100000
  }
  return total % count
}

function getSubjectDetailMessage(subject: string, score: number, change: number | null) {
  const improved = [
    `${subject} is showing encouraging growth this week. We are seeing better confidence and positive movement in class.`,
    `There has been lovely progress in ${subject}. We will keep building on this momentum step by step.`,
    `${subject} is moving in a good direction. The effort is showing, and we will continue supporting steady growth.`,
  ]

  const strong = [
    `${subject} is looking strong. This is a lovely area of confidence, and we will keep encouraging the same positive habits.`,
    `There is strong progress in ${subject}. The consistency shown here is encouraging and worth celebrating.`,
    `${subject} is going well. We are seeing confidence, focus, and good participation in this area.`,
  ]

  const steady = [
    `${subject} is steady this week. We are supporting consistency and helping this area continue to grow calmly.`,
    `${subject} is developing at a steady pace. We will keep encouraging confidence and participation in class.`,
    `There is steady movement in ${subject}. This is part of the learning journey, and we will keep supporting it.`,
  ]

  const support = [
    `${subject} needs a little more support at the moment, but there is no need for worry. We are working on it gently in class.`,
    `${subject} was a bit more challenging this week. We will keep supporting confidence and progress step by step.`,
    `We are giving ${subject} extra encouragement in class. Growth can take time, and we will keep building it calmly.`,
  ]

  let bank = steady
  if (change !== null && change >= 0.2) bank = improved
  else if (change !== null && change <= -0.2) bank = support
  else if (score >= 4) bank = strong
  else if (score < 2.5) bank = support

  return bank[getSubjectMessageIndex(`${subject}-${score}-${change ?? 'none'}-detail`, bank.length)]
}

function getSubjectOptionalEncouragement(subject: string, score: number) {
  const gentle = [
    `Optional at home: notice one small moment where confidence shows, and celebrate it warmly.`,
    `Optional at home: ask one simple question about what felt good in class this week.`,
    `Optional at home: let your child explain one small thing they enjoyed learning or doing.`,
  ]

  const support = [
    `Optional at home: keep it light — a short conversation about the day is enough.`,
    `Optional at home: encourage one small try, without pressure to get it perfect.`,
    `Optional at home: praise effort first, even when the answer or task is not complete yet.`,
  ]

  const bank = score < 3 ? support : gentle
  return bank[getSubjectMessageIndex(`${subject}-${score}-encouragement`, bank.length)]
}


export function ReportCard({ report, childName }: Props) {
  const scoreSource = report.scores || {}
  const overall  = getOverallScore(scoreSource)
  const subjects = Object.entries(scoreSource)
  const [showAllSubjects, setShowAllSubjects] = useState(false)
  const [showFullTeacherComment, setShowFullTeacherComment] = useState(false)
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<null | { name: string; score: number; change: number | null }>(null)
  useEffect(() => {
    setShowFullTeacherComment(false)
  }, [report.comment])
const prevOverall  = report.previous_scores ? getOverallScore(report.previous_scores) : null
  const overallDelta = prevOverall !== null ? overall - prevOverall : null

  const isLatestReport = report.display_position !== 'previous'
  const reportStatusLabel = isLatestReport ? '' : 'Previous report'
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

  const teacherCommentText = String(report.comment || getSafeWarmTeacherFallback(childFirstName, Number(report.overallScore) || overall || 0))
  const teacherCommentNeedsMore = teacherCommentText.length > 92
  const teacherCommentPreview = teacherCommentNeedsMore
    ? `${teacherCommentText.slice(0, 89).trim().replace(/[.,;:!?\-]+$/, '')}...`
    : teacherCommentText


  return (
    <section className="sc-parent-report-card-view" style={{ paddingBottom: 28 }}>
      {/* ── Hero ─────────────────── */}
      <div style={{ textAlign: 'center', padding: '0 0 18px', opacity: mutedReportOpacity }}>
        {reportStatusLabel ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 22,
            padding: '0 9px',
            borderRadius: 999,
            border: '1px solid rgba(0,0,0,0.045)',
            color: '#7C8486',
            background: 'transparent',
            fontSize: 10.5,
            fontWeight: 470,
            letterSpacing: '0.045em',
            textTransform: 'uppercase',
            marginBottom: 0,
          }}>
            {reportStatusLabel}
          </div>
        ) : null}

        <h2 style={{
          fontSize: 26.5, fontWeight: 420, color: T.ink,
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

        <div className="sc-score-comment-up-v1" style={{ marginTop: 8 }}>
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

      {teacherCommentText && (
        <section
          className="sc-parent-report-teacher-note-avatar-line-v437 sc-teacher-comment-overlap-card-v1"
          aria-label="Teacher comment"
        >
          <div className="sc-teacher-comment-photo-v1" aria-hidden="true">
            {teacherPhoto ? (
              <img src={teacherPhoto} alt="" />
            ) : (
              <span>{teacherInitials}</span>
            )}
          </div>

          <div className="sc-teacher-comment-bubble-v2">
            <p className="sc-teacher-comment-text-v1">
              <span className="sc-teacher-comment-message-v1">
                {teacherName ? (
                  <>
                    <strong>{teacherName}:</strong>{' '}
                  </>
                ) : null}
                {showFullTeacherComment ? teacherCommentText : teacherCommentPreview}
                {!showFullTeacherComment && teacherCommentNeedsMore && (
                  <button
                    type="button"
                    className="sc-teacher-comment-read-more-v1"
                    onClick={() => setShowFullTeacherComment(true)}
                  >
                    more
                  </button>
                )}
              </span>
            </p>
          </div>
        </section>
      )}


      <style jsx global>{`
        .sc-report-subject-grid-card-v1,
        .sc-subject-card-growth-v1 {
          background: #f7f7f7 !important;
        }
      `}</style>


      <style jsx global>{`
        .sc-report-subject-grid-v1 {
          gap: 10px !important;
        }

        .sc-report-subject-grid-card-v1,
        .sc-subject-card-growth-v1 {
          box-sizing: border-box !important;
          min-height: 78px;
        }

        .sc-subject-card-copy-v1 {
          min-width: 0;
        }
      `}</style>

      {subjects.length > 0 && (
        <section
          className="sc-report-subject-panel sc-report-subject-panel-inline sc-clean-subjects-v2 sc-report-lower-card-motion-v1"
          aria-label="Subject scores"
          style={{
            width: '100%',
            maxWidth: 370,
            margin: '0 auto 0',
            padding: 0,
            borderRadius: 0,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
        >
          <div className="sc-report-subject-grid-v1" aria-label="Subject score cards">
            {(showAllSubjects ? subjects : subjects.slice(0, 4)).map(([name, score]) => {
              const numericScore = Number(score)
              const safeScore = Number.isFinite(numericScore) ? Math.max(0, Math.min(5, numericScore)) : 0
              const previousScore = getPreviousSubjectScore(report.previous_scores, String(name))
              const change = previousScore === null ? null : safeScore - previousScore

              return (
                                <article
                  key={String(name)}
                  className="sc-report-subject-grid-card-v1 sc-subject-card-growth-v1"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSubjectDetail({ name: String(name), score: safeScore, change })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedSubjectDetail({ name: String(name), score: safeScore, change })
                    }
                  }}
                >
                  <SubjectMiniRing score={safeScore} />

                  <div className="sc-subject-card-copy-v1">
                    <p className="sc-subject-grid-name-v1">
                      {shortenSubject(String(name))}
                    </p>
                    <p className="sc-subject-growth-word-v1">
                      {getSubjectGrowthWord(safeScore, change)}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>

          {subjects.length > 4 && (
            <button
              type="button"
              className="sc-subject-grid-view-all-v1"
              onClick={() => setShowAllSubjects(value => !value)}
            >
              {showAllSubjects ? 'Show less' : `View more`}
            </button>
          )}
        </section>


      )}


      <style jsx global>{`
        @keyframes scSubjectPopupBackdropIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scSubjectPopupExpandIn {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.88);
            filter: blur(2px);
          }
          60% {
            opacity: 1;
            transform: translateY(-2px) scale(1.015);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .sc-subject-detail-modal-shell-v2 {
          animation: scSubjectPopupBackdropIn 180ms ease-out both;
        }

        .sc-subject-detail-modal-card-v2 {
          transform-origin: center center;
          animation: scSubjectPopupExpandIn 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }

        .sc-report-subject-grid-card-v1,
        .sc-subject-card-growth-v1 {
          transition:
            transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
            background 180ms ease,
            opacity 180ms ease;
        }

        .sc-report-subject-grid-card-v1:active,
        .sc-subject-card-growth-v1:active {
          transform: scale(0.985);
        }

        @media (prefers-reduced-motion: reduce) {
          .sc-subject-detail-modal-shell-v2,
          .sc-subject-detail-modal-card-v2 {
            animation: none !important;
          }

          .sc-report-subject-grid-card-v1,
          .sc-subject-card-growth-v1 {
            transition: none !important;
          }
        }
      `}</style>

      {selectedSubjectDetail && (
        <div
          className="sc-subject-detail-modal-shell-v2"
          role="dialog"
          aria-modal="true"
          aria-label={`${shortenSubject(selectedSubjectDetail.name)} details`}
          onClick={() => setSelectedSubjectDetail(null)}
        >
          <div
            className="sc-subject-detail-modal-card-v2"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="sc-subject-detail-modal-close-v2"
              aria-label="Close subject details"
              onClick={() => setSelectedSubjectDetail(null)}
            >
              ×
            </button>

            <div className="sc-subject-detail-modal-head-v2">
              <SubjectMiniRing score={selectedSubjectDetail.score} />
              <div>
                <p className="sc-subject-detail-modal-title-v2">
                  {shortenSubject(selectedSubjectDetail.name)}
                </p>
                <p className="sc-subject-detail-modal-status-v2">
                  {getSubjectGrowthWord(selectedSubjectDetail.score, selectedSubjectDetail.change)}
                </p>
              </div>
            </div>

            <div className="sc-subject-detail-modal-body-v2">
              <p>
                {getSubjectDetailMessage(
                  shortenSubject(selectedSubjectDetail.name),
                  selectedSubjectDetail.score,
                  selectedSubjectDetail.change
                )}
              </p>

              <div className="sc-subject-detail-modal-activity-v2">
                {getSubjectOptionalEncouragement(
                  shortenSubject(selectedSubjectDetail.name),
                  selectedSubjectDetail.score
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subjects moved to score info popup */}

    </section>
  )
}
