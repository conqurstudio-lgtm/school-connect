// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { getOverallScore, getScoreLabel } from '@/lib/reports'

const BRAND = '#F4531F'
const INK = '#252525'
const INK_SOFT = '#8A8F96'
const HAIRLINE = 'rgba(17,17,17,0.055)'
const SURFACE = '#F7F7F8'

interface Props {
  report: {
    id: string
    week_starting: string
    scores: Record<string, number>
    previous_scores: Record<string, number> | null
    comment: string | null
    teacher_name?: string
    teacher_photo_url?: string
    teacher_avatar_url?: string
    teacher_image_url?: string
    photo_url?: string
    child_name?: string
    display_position?: string
  }
  childName?: string
}

function shortenSubject(name: string): string {
  const map: Record<string, string> = {
    'English Home Language': 'English HL',
    'English First Additional Language': 'English FAL',
    'Afrikaans Home Language': 'Afrikaans HL',
    'Afrikaans First Additional Language': 'Afrikaans FAL',
    'isiZulu Home Language': 'isiZulu HL',
    'isiXhosa Home Language': 'isiXhosa HL',
    'Sesotho Home Language': 'Sesotho HL',
    'Setswana Home Language': 'Setswana HL',
    'Sepedi Home Language': 'Sepedi HL',
    'Natural Sciences': 'Natural Sci',
    'Physical Sciences': 'Physical Sci',
    'Life Sciences': 'Life Sci',
    'Social Sciences': 'Social Sci',
    'Life Orientation': 'Life Orient.',
    'Business Studies': 'Business',
    'Economic and Management Sciences': 'EMS',
    'Information Technology': 'IT',
    'Computer Applications Technology': 'CAT',
    'Coding & Robotics': 'Coding',
  }

  if (name === 'Mathematics') return 'Maths'
  return map[name] ?? name
}

function formatWeek(date: string): string {
  const d = new Date(date)
  if (!Number.isFinite(d.getTime())) return ''

  const end = new Date(d)
  end.setDate(d.getDate() + 4)

  const opt: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit' }

  return `${d.toLocaleDateString('en-ZA', opt)} – ${end.toLocaleDateString('en-ZA', opt)}, ${d.getFullYear()}`
}

function getScoreEmoji(score: number): string {
  if (score >= 4.5) return '🏆'
  if (score >= 4) return '✨'
  if (score >= 3.5) return '⭐'
  return '🌱'
}

function getSubjectStatus(score: number): string {
  if (score >= 4.5) return 'Excellent'
  if (score >= 3.5) return 'Progressing'
  if (score >= 2.5) return 'Fair'
  return 'Needs support'
}

function getSubjectTipMessage(subjectName: string, score: number, childName: string, seedKey = '') {
  const subject = subjectName || 'this area'
  const child = childName || 'Your child'

  const supportGrowthNotes = [
    `${child} is still building confidence in ${subject}. There is no need to panic — the teacher is supporting this with guided practice and steady encouragement.`,
    `${child} needs more time with ${subject}, and that is part of the learning journey. The focus is calm repetition, support, and small weekly progress.`,
    `${child} is finding parts of ${subject} challenging, but this gives us a clear area to support. Growth is possible with patience and consistent practice.`,
    `${child} is still developing in ${subject}. The teacher will continue helping with the basics so confidence can grow step by step.`,
    `${child} may need extra support in ${subject}. This is not a setback — it simply shows where focused help can make the biggest difference.`,
  ]

  const steadyGrowthNotes = [
    `${child} is building steady confidence in ${subject}. The teacher will keep supporting this through guided practice, and small improvements each week are important.`,
    `${child} is making progress in ${subject}. Some parts still need repetition, but the foundation is developing and the learning process is on track.`,
    `${child} is growing in ${subject} step by step. Continued classroom practice will help turn today’s understanding into stronger confidence.`,
    `${child} is showing developing understanding in ${subject}. The focus now is consistency, practice, and celebrating the small wins along the way.`,
    `${child} is moving forward in ${subject}. There is still room to strengthen the basics, but the progress is worth noticing and encouraging.`,
  ]

  const strongGrowthNotes = [
    `${child} is doing well in ${subject}. This is a positive area of growth, and the teacher will keep building on this strength through class activities.`,
    `${child} is showing strong understanding in ${subject}. Continued encouragement will help this confidence become even more consistent.`,
    `${child} is responding well in ${subject}. The progress is clear, and this is something to celebrate while still keeping the learning steady.`,
    `${child} is showing good confidence in ${subject}. The next step is to keep stretching this strength through regular classroom practice.`,
    `${child} is growing beautifully in ${subject}. This area shows strong effort and good learning habits that should be encouraged.`,
  ]

  const excellentGrowthNotes = [
    `${child} is excelling in ${subject}. This is a strength to celebrate, and the teacher will continue creating opportunities for deeper learning.`,
    `${child} is showing excellent confidence in ${subject}. This progress reflects strong engagement and a positive learning rhythm.`,
    `${child} is doing very well in ${subject}. This is a proud moment, and continued encouragement will help keep the momentum going.`,
    `${child} is showing a strong grasp of ${subject}. The focus now is to keep nurturing this strength while maintaining balance across other areas.`,
    `${child} is shining in ${subject}. This progress is worth celebrating and shows that the learning process is working well.`,
  ]

  const bank =
    score >= 4.6
      ? excellentGrowthNotes
      : score >= 4
        ? strongGrowthNotes
        : score >= 3
          ? steadyGrowthNotes
          : supportGrowthNotes

  const seed = `${subject}-${child}-${score}-${seedKey}`
  const index = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % bank.length

  return bank[index]
}

function useCountUp(value: number) {
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const duration = 900
    const start = performance.now()
    const from = shown
    let raf = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3)

      setShown(from + (value - from) * eased)

      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return shown
}

function Delta({ value }: { value: number }) {
  if (Math.abs(value) < 0.1) {
    return (
      <span className="sc-report-delta-flat-v1" data-tone="neutral">
        <Minus size={14} strokeWidth={2.4} />
        <strong>0.0</strong>
        <span>from last week</span>
      </span>
    )
  }

  const up = value > 0

  return (
    <span className="sc-report-delta-flat-v1" data-tone={up ? "up" : "down"}>
      {up ? <TrendingUp size={14} strokeWidth={2.4} /> : <TrendingDown size={14} strokeWidth={2.4} />}
      <strong>{up ? '+' : ''}{value.toFixed(1)}</strong>
      <span>from last week</span>
    </span>
  )
}


function ScoreGauge({ value, max = 5 }: { value: number; max?: number }) {
  const shown = useCountUp(value)
  const size = 248
  const stroke = 2.15
  const center = size / 2
  const radius = (size - stroke - 14) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(1, value / max))

  const arcRatio = 0.76
  const arcLength = circumference * arcRatio
  const gapLength = circumference - arcLength
  const progressLength = Math.max(0.001, arcLength * progress)
  const rotation = 132

  return (
    <div className="sc-score-gauge-flat-v1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="sc-score-gauge-svg-flat-v1"
        role="img"
        aria-label={`Score ${shown.toFixed(1)} out of ${max}`}
      
      >
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
          stroke={BRAND}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(${rotation} ${center} ${center})`}
          style={{
            transition: 'stroke-dasharray 900ms cubic-bezier(.22,1,.36,1)',
          }}
        />
      </svg>

      <div className="sc-score-gauge-center-flat-v1">
        <span>{shown.toFixed(1)}</span>
        <small>out of {max}</small>
      </div>
    </div>
  )
}

function MiniRing({ value, active }: { value: number; active: boolean }) {
  const radius = 19
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(1, value / 5))

  return (
    <div className="sc-subject-mini-ring-flat-v1">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={active ? 'rgba(244,83,31,0.14)' : '#DADBDD'}
          strokeWidth="1.65"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={active ? BRAND : '#C8CBD0'}
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span>{value.toFixed(1)}</span>
    </div>
  )
}

function SubjectCard({
  subject,
  active,
  onSelect,
}: {
  subject: { key: string; name: string; score: number; status: string; delta?: number | null }
  active: boolean
  onSelect: (key: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(subject.key)}
      aria-pressed={active}
      className={`sc-subject-flat-slider-card-v1 ${active ? 'is-active' : ''}`}
    >
      <div className="sc-subject-score-row-flat-v1">
        <MiniRing value={subject.score} active={active} />

        {typeof subject.delta === 'number' && Math.abs(subject.delta) >= 0.1 ? (
          <em
            className={`sc-subject-delta-flat-v1 ${subject.delta > 0 ? 'is-up' : 'is-down'}`}
            aria-label={`${subject.delta > 0 ? 'Improved' : 'Dropped'} ${Math.abs(subject.delta).toFixed(1)} from last week`}
          >
            {subject.delta > 0 ? '↗' : '↘'} {Math.abs(subject.delta).toFixed(1)}
          </em>
        ) : null}
      </div>

      <p>{subject.name}</p>
      <span>{subject.status}</span>
    </button>
  )
}

function getSafeWarmTeacherFallback(childName: string, score: number) {
  const child = childName || 'Your child'

  if (score >= 4.6) {
    return `${child} has had a strong week of learning. The work shows confidence, growth, and areas worth celebrating.`
  }

  if (score >= 4) {
    return `${child} is making good progress. The teacher will keep building on these strengths while supporting the next steps.`
  }

  if (score >= 3) {
    return `${child} is growing steadily. Some areas still need repetition, but the learning journey is moving in the right direction.`
  }

  return `${child} is still building confidence. The teacher is supporting the next steps carefully, and small weekly progress matters most.`
}

export function ReportCard({ report, childName }: Props) {
  const scoreSource = report.scores || {}
  const overall = getOverallScore(scoreSource)
  const previousScoreSource = report.previous_scores || {}
  const prevOverall = report.previous_scores ? getOverallScore(previousScoreSource) : null
  const overallDelta = prevOverall !== null ? overall - prevOverall : null

  const subjects = Object.entries(scoreSource).map(([name, score]) => {
    const safeScore = Math.max(0, Math.min(5, Number(score) || 0))
    const previousRaw = previousScoreSource?.[name]
    const previousScore = previousRaw === undefined || previousRaw === null || previousRaw === ''
      ? null
      : Math.max(0, Math.min(5, Number(previousRaw) || 0))
    const delta = previousScore !== null ? safeScore - previousScore : null

    return {
      key: String(name),
      name: shortenSubject(String(name)),
      score: safeScore,
      status: getSubjectStatus(safeScore),
      delta,
    }
  })

  const cards = [
    {
      key: 'overall',
      name: 'Overall',
      score: overall,
      status: getScoreLabel(overall),
      delta: overallDelta,
    },
    ...subjects,
  ]

  const [activeKey, setActiveKey] = useState('overall')

  const active = useMemo(
    () => cards.find(item => item.key === activeKey) || cards[0],
    [cards, activeKey]
  )

  const isLatestReport = report.display_position !== 'previous'
  const reportStatusLabel = isLatestReport ? '' : 'Previous report'
  const teacherName = report.teacher_name || 'Teacher'
  const childFirstName = String(childName || report.child_name || '').trim().split(/\s+/)[0] || 'Your child'

  const teacherPhoto =
    report.teacher_photo_url ||
    report.teacher_avatar_url ||
    report.teacher_image_url ||
    report.photo_url ||
    ''

  const teacherInitials = String(teacherName || 'T')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'T'

  const teacherCommentText = String(
    report.comment || getSafeWarmTeacherFallback(childFirstName, overall)
  )

  const noteIsOverall = active.key === 'overall'

  const activeTeacherNote = noteIsOverall
    ? teacherCommentText
    : getSubjectTipMessage(active.name, active.score, childFirstName, String(report.id || report.report_id || report.period_start || report.week_start || report.created_at || report.date || ''))

  const [openNote, setOpenNote] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  
  useEffect(() => {
    setOpenNote(false)
  }, [active.key])

const isLong = activeTeacherNote.length > 94
  const shownNote = !openNote && isLong ? `${activeTeacherNote.slice(0, 94).trim()}…` : activeTeacherNote

  useEffect(() => {
    setOpenNote(false)
  }, [activeKey, report.comment])

  return (
    <section className="sc-report-flat-v1">
      <style jsx global>{`
        .sc-report-flat-v1 {
          width: 100%;
          max-width: 410px;
          margin: 0 auto;
          padding: 0 0 26px;
          color: ${INK};
          font-family: "Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .sc-report-flat-title-v1 {
          padding: 10px 30px 0;
          text-align: center;
          transform: translateY(-10px);
        }

        .sc-report-flat-title-v1 h2 {
          margin: 0;
          color: ${INK};
          font-size: 27.5px;
          font-weight: 520;
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .sc-report-flat-title-v1 p {
          margin: 5px 0 0;
          color: ${INK_SOFT};
          font-size: 12.2px;
          font-weight: 430;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .sc-score-gauge-flat-v1 {
          position: relative;
          width: 264px;
          height: 264px;
          max-width: 80vw;
          margin: 18px auto 0;
        }

        .sc-score-gauge-svg-flat-v1 {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }

        .sc-score-gauge-center-flat-v1 {
          position: absolute;
          inset: 0;
          display: grid;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          text-align: center;
        
          transform: translateY(12px);
        
          place-items: center;
        
          align-content: center;
        
          gap: 6px;
        }

        .sc-score-gauge-center-flat-v1 span {
          color: ${INK};
          font-size: 58px;
          font-weight: 500;
          line-height: 0.92;
          letter-spacing: -0.055em;
          font-variant-numeric: tabular-nums;
        }

        .sc-score-gauge-center-flat-v1 small {
          margin: 0;
          margin-top: 0;
          color: #B8BBC1;
          font-size: 13px;
          font-weight: 360;
          letter-spacing: -0.01em;
        }

        .sc-score-flat-summary-v1 {
          margin-top: -2px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 2;
        }
.sc-score-flat-summary-v1 .emoji {
          font-size: 25px;
          line-height: 1;
          margin-bottom: -8px;
                  transform: translateY(-34px);
}

        .sc-score-flat-summary-v1 .status {
          margin: 0;
          color: ${INK};
          font-size: 15.2px;
          font-weight: 560;
          line-height: 1.15;
          letter-spacing: -0.025em;
        }

        .sc-report-delta-flat-v1 {
          margin-top: 7px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: ${INK_SOFT};
          font-size: 12.5px;
          font-weight: 430;
          line-height: 1;
        }

        .sc-report-delta-flat-v1 strong {
          font-weight: 650;
        }

        .sc-report-delta-flat-v1[data-tone="up"] svg,
        .sc-report-delta-flat-v1[data-tone="up"] strong {
          color: #2E9B68;
        }

        .sc-report-delta-flat-v1[data-tone="down"] svg,
        .sc-report-delta-flat-v1[data-tone="down"] strong {
          color: #D94D45;
        }

        .sc-report-delta-flat-v1[data-tone="neutral"] svg,
        .sc-report-delta-flat-v1[data-tone="neutral"] strong {
          color: ${INK_SOFT};
        }


        .sc-report-delta-flat-v1 svg,
        .sc-report-delta-flat-v1 strong {
          color: #5F6268;
          font-weight: 600;
        }

        .sc-teacher-flat-note-v1 {
          width: calc(100% - 44px);
          max-width: 368px;
          margin: 60px auto 0;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 26px;
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.055);
          box-shadow: none;
          box-sizing: border-box;
        }

        .sc-teacher-flat-avatar-v1 {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: #F1F2F3;
          border: 1px solid rgba(17,17,17,0.06);
          overflow: hidden;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          color: #5F6268;
          font-size: 12px;
          font-weight: 700;
}

        .sc-teacher-flat-avatar-v1 img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

                .sc-teacher-flat-avatar-v1.is-subject-tip {
          width: 42px;
          height: 42px;
          border: none !important;
          outline: none !important;
          background: transparent !important;
          box-shadow: none !important;
          color: ${INK};
          font-size: 25px;
          font-weight: 400;
          overflow: visible;
          transform: none;
          display: flex;
          align-items: center;
          justify-content: center;
        
          place-items: center;
        
          min-width: 42px;
        
          border-radius: 0;
        
          padding: 0;
        
          flex-shrink: 0;
        }

        
        .sc-teacher-flat-avatar-v1.is-subject-tip .sc-subject-mini-ring-flat-v1 {
          width: 42px;
          height: 42px;
          overflow: visible;
        }

        .sc-teacher-flat-avatar-v1.is-subject-tip .sc-subject-mini-ring-flat-v1 svg {
          overflow: visible;
        }

        .sc-teacher-flat-avatar-v1.is-subject-tip span {
          line-height: 1;
          display: block;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }


        .sc-teacher-flat-copy-v1 {
          min-width: 0;
          flex: 1;
          padding-top: 0;
        }

        .sc-teacher-flat-copy-v1 p {
          margin: 0;
          color: #5F6268;
          font-size: 12.8px;
          font-weight: 400;
          line-height: 1.48;
          letter-spacing: -0.01em;
        
          display: block;
        
          overflow: visible;
        }

        .sc-teacher-flat-copy-v1 strong {
          color: #10141A;
          font-weight: 570;
                  letter-spacing: -0.02em;
}

        .sc-teacher-flat-note-v1 {
          animation: scTeacherNoteSwapV1 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }

        @keyframes scTeacherNoteSwapV1 {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sc-teacher-flat-note-v1.is-subject-tip-note {
          background: #FFFFFF;
          border-color: rgba(17,17,17,0.055);
        }

        .sc-teacher-flat-note-v1.is-subject-tip-note .sc-teacher-flat-avatar-v1 {
          background: transparent !important;
          color: #10141A;
          border-color: rgba(17,17,17,0.06);
        }

        .sc-subject-tip-emoji-v1 {
          font-size: 20px;
          line-height: 1;
        }

        .sc-teacher-flat-copy-v1 button {
          margin-left: 5px;
          border: none;
          background: transparent;
          padding: 0;
          color: #252525;
          font: inherit;
          font-weight: 560;
          cursor: pointer;
        
          display: inline;
        
          white-space: nowrap;
        
          vertical-align: baseline;
        }

        
        @keyframes scBreakdownRevealV1 {
          from {
            opacity: 0;
            transform: translateY(18px);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .sc-report-breakdown-plus-wrap-v1 {
          width: 100%;
          display: grid;
          justify-content: center;
          margin: 54px 0 0;
        
          place-items: center;
        
          align-items: center;
        }

        .sc-report-breakdown-plus-button-v1 {
          width: 58px;
          height: 58px;
          border: none;
          border-radius: 999px;
          background: #ff6c33;
          color: #FFFFFF;
          display: grid;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: 200;
          line-height: 1;
          cursor: pointer;
          font-family: inherit;
          box-shadow: none;
          transition: transform 220ms ease, opacity 220ms ease;
        
          place-items: center;
        
          padding: 0;
        
          letter-spacing: 0;
        }

        .sc-report-breakdown-plus-button-v1:active {
          transform: scale(0.94);
        }

        .sc-breakdown-flat-v1 {
          display: none;
        }

        .sc-breakdown-flat-v1.is-open {
          display: block;
          animation: scBreakdownRevealV1 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

.sc-breakdown-flat-v1 {margin-top: 38px;
          padding-bottom: 0;
        }

        .sc-breakdown-flat-head-v1 {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding: 0 24px;
        }

        .sc-breakdown-flat-head-v1 p {
          margin: 0;
          color: ${INK};
          font-size: 13.6px;
          font-weight: 520;
          letter-spacing: -0.025em;
          text-transform: none;
        }

        .sc-breakdown-flat-head-v1 span {
          color: ${INK_SOFT};
          font-size: 12px;
          font-weight: 500;
        }

        .sc-subject-flat-slider-v1 {
          margin-top: 16px;
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 0 24px 10px;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 24px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .sc-subject-flat-slider-v1::-webkit-scrollbar {
          display: none;
        }

        .sc-subject-flat-slider-card-v1 {
          width: 138px;
          min-height: 116px;
          flex-shrink: 0;
          scroll-snap-align: start;
          border: 1px solid rgba(17,17,17,0.045);
          border-radius: 24px;
          background: #FFFFFF;
          color: ${INK};
          padding: 12px 14px 12px;
          border: 1px solid rgba(17,17,17,0.045);
          box-shadow: none;
          text-align: left;
          font-family: inherit;
          cursor: pointer;
          transition:
            background 260ms ease,
            color 260ms ease,
            transform 180ms ease,
            opacity 180ms ease;
          display: flex;
          flex-direction: column;
        
          gap: 7px;
        }

        .sc-subject-flat-slider-card-v1:active {
          transform: scale(0.98);
        }

        .sc-subject-flat-slider-card-v1.is-active {
          background: #FFFFFF;
          color: ${INK};
          border-color: rgba(244,83,31,0.24);
          box-shadow: none;
        }

        .sc-subject-flat-slider-card-v1 p {
          margin: auto 0 0;
          color: inherit;
          font-size: 12.8px;
          font-weight: 560;
          line-height: 1.14;
          letter-spacing: -0.018em;
        }

        .sc-subject-flat-slider-card-v1 span {
          display: block;
          margin-top: 2px;
          color: ${INK_SOFT};
          font-size: 11.6px;
          font-weight: 420;
          line-height: 1.18;
        }

        .sc-subject-flat-slider-card-v1.is-active span {
          color: #7C8486;
        }

        .sc-subject-score-row-flat-v1 {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
                  margin-bottom: 0;
}

        .sc-subject-delta-flat-v1 {
          min-height: 20px;
          padding: 0 7px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-style: normal;
          font-size: 10.7px;
          font-weight: 520;
          line-height: 1;
          letter-spacing: -0.01em;
          background: rgba(17,17,17,0.032);
          color: #8F949B;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .sc-subject-delta-flat-v1.is-up {
          background: rgba(17,17,17,0.032);
          color: #7F9A8B;
        }

        .sc-subject-delta-flat-v1.is-down {
          background: rgba(255,76,67,0.075);
          color: #D65C55;
        }

        .sc-subject-mini-ring-flat-v1 {
          position: relative;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
        }

        .sc-subject-mini-ring-flat-v1 svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .sc-subject-mini-ring-flat-v1 span {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          margin: 0;
          color: inherit;
          font-size: 11.8px;
          font-weight: 560;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 420px) {
          .sc-report-flat-title-v1,
          .sc-teacher-flat-note-v1,
          .sc-breakdown-flat-head-v1 {
            padding-left: 24px;
            padding-right: 24px;
          }

          .sc-subject-flat-slider-v1 {
            padding-left: 24px;
            padding-right: 24px;
            scroll-padding-left: 24px;
          }

          .sc-subject-flat-slider-card-v1 {
            width: 138px;
            min-height: 116px;
          }
        }
      `}</style>

      {reportStatusLabel ? (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: 22,
          padding: '0 10px',
          margin: '0 0 8px 24px',
          borderRadius: 999,
          background: SURFACE,
          color: INK_SOFT,
          fontSize: 10.5,
          fontWeight: 650,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {reportStatusLabel}
        </div>
      ) : null}

      <div className="sc-report-flat-title-v1">
        <h2>{childName ? `${childName.split(' ')[0]}'s Report` : 'Weekly Report'}</h2>
        <p>{formatWeek(report.week_starting)}</p>
      </div>

      <ScoreGauge value={overall} />

      <div className="sc-score-flat-summary-v1">
        <div className="emoji" aria-hidden="true">{getScoreEmoji(overall)}</div>
        <p className="status">{
          overall >= 4.6 ? 'Excellent' :
          overall >= 4 ? 'Strong progress' :
          overall >= 3 ? 'Growing steadily' :
          'Needs support'
        }</p>

        {typeof overallDelta === 'number' ? (
          <Delta value={overallDelta} />
        ) : null}
      </div>

      <section
        key={active.key}
        className={`sc-teacher-flat-note-v1 ${noteIsOverall ? 'is-overall-note' : 'is-subject-tip-note'}`}
        aria-label={noteIsOverall ? 'Teacher note' : active.name}
      >
        <div className="sc-teacher-flat-avatar-v1" aria-hidden="true">
          {noteIsOverall ? (
            teacherPhoto ? <img src={teacherPhoto} alt="" /> : <span>{teacherInitials}</span>
          ) : (
            <MiniRing value={active.score} active={true} />
          )}
        </div>

        <div className="sc-teacher-flat-copy-v1">
          <p>
            <strong>{noteIsOverall ? teacherName : active.name}:</strong>{' '}
            {shownNote}
            {!openNote && isLong ? (
              <button type="button" onClick={() => setOpenNote(true)}>more</button>
            ) : null}
            {openNote && isLong ? (
              <button type="button" onClick={() => setOpenNote(false)}>less</button>
            ) : null}
          </p>
        </div>
      </section>

      {cards.length > 0 && (
        <section className="sc-breakdown-flat-v1" aria-label="Report breakdown">
          <div className="sc-breakdown-flat-head-v1">
            <p style={{ fontSize: 13.1, fontWeight: 480 }}>Breakdown</p>
            <span>{subjects.length} areas</span>
          </div>

          <div className="sc-subject-flat-slider-v1">
            {cards.map(card => (
              <SubjectCard
                key={card.key}
                subject={card}
                active={card.key === activeKey}
                onSelect={setActiveKey}
              />
            ))}
          </div>
        </section>
      )}

      {!showBreakdown ? (
        <div className="sc-report-breakdown-plus-wrap-v1">
          <button
            type="button"
            className="sc-report-breakdown-plus-button-v1"
            aria-label="Open breakdown"
            onClick={() => {
              const firstSubject = subjects.find(subject => subject.key !== 'overall') || subjects[0]

              if (firstSubject?.key) {
                setActiveKey(firstSubject.key)
              }

              setShowBreakdown(true)
              window.dispatchEvent(new CustomEvent('school-connect-report-breakdown-open'))
            }}
          >
            ＋
          </button>
        </div>
      ) : null}

      <div className={`sc-breakdown-flat-v1 ${showBreakdown ? "is-open" : ""}`}>
        <div className="sc-breakdown-flat-head-v1">
          <p>Breakdown</p>
          <span>Tap a subject</span>
        </div>

        <div className="sc-subject-flat-slider-v1" aria-label="Subject breakdown">
          {subjects.map(subject => (
            <SubjectCard
              key={subject.key}
              subject={subject}
              active={activeKey === subject.key}
              onSelect={setActiveKey}
            />
          ))}
        </div>
      </div>

    </section>
  )
}
