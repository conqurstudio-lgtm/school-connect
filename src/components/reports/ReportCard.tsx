// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { getOverallScore, getScoreLabel } from '@/lib/reports'

const BRAND = '#F4531F'
const INK = '#0F1113'
const INK_SOFT = '#8A8F96'
const HAIRLINE = '#ECECEE'
const SURFACE = '#F4F5F7'

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

function getSubjectTipMessage(subjectName: string, score: number, childName: string): string {
  const child = childName || 'Your child'
  const subject = subjectName || 'this subject'

  if (score >= 4.5) {
    return `${child} is doing very well in ${subject}. Keep encouraging this strength with light revision and praise at home.`
  }

  if (score >= 3.5) {
    return `${child} is making good progress in ${subject}. A little more practice will help build even stronger confidence.`
  }

  if (score >= 2.5) {
    return `${child} is showing fair progress in ${subject}. Short, consistent practice will help improve understanding.`
  }

  return `${child} needs gentle support in ${subject}. Focus on small daily practice and celebrate each improvement.`
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
      <span className="sc-report-delta-flat-v1">
        <Minus size={14} strokeWidth={2.4} />
        <strong>0.0</strong>
        <span>from last week</span>
      </span>
    )
  }

  const up = value > 0

  return (
    <span className="sc-report-delta-flat-v1">
      {up ? <TrendingUp size={14} strokeWidth={2.4} /> : <TrendingDown size={14} strokeWidth={2.4} />}
      <strong>{up ? '+' : ''}{value.toFixed(1)}</strong>
      <span>from last week</span>
    </span>
  )
}

function ScoreGauge({ value, max = 5 }: { value: number; max?: number }) {
  const shown = useCountUp(value)
  const size = 244
  const stroke = 2.35
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
          stroke={active ? 'rgba(244,83,31,0.20)' : '#D8D8D5'}
          strokeWidth="3"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={BRAND}
          strokeWidth="3"
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
  subject: { key: string; name: string; score: number; status: string }
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
      <MiniRing value={subject.score} active={active} />
      <p>{subject.name}</p>
      <span>{subject.status}</span>
    </button>
  )
}

function getSafeWarmTeacherFallback(childName: string, score: number) {
  const name = childName || 'Your child'

  if (score >= 4) {
    return `${name} has had a lovely week and is showing strong progress. The confidence and effort shown in class are encouraging.`
  }

  if (score >= 3) {
    return `${name} is making steady progress this week. We are seeing good effort in class and will continue supporting confidence and consistency.`
  }

  return `${name} needs gentle support this week. We will keep working calmly and celebrate the small wins along the way.`
}

export function ReportCard({ report, childName }: Props) {
  const scoreSource = report.scores || {}
  const overall = getOverallScore(scoreSource)

  const subjects = Object.entries(scoreSource).map(([name, score]) => {
    const safeScore = Math.max(0, Math.min(5, Number(score) || 0))

    return {
      key: String(name),
      name: shortenSubject(String(name)),
      score: safeScore,
      status: getSubjectStatus(safeScore),
    }
  })

  const cards = [
    {
      key: 'overall',
      name: 'Overall',
      score: overall,
      status: getScoreLabel(overall),
    },
    ...subjects,
  ]

  const [activeKey, setActiveKey] = useState('overall')

  const active = useMemo(
    () => cards.find(item => item.key === activeKey) || cards[0],
    [cards, activeKey]
  )

  const prevOverall = report.previous_scores ? getOverallScore(report.previous_scores) : null
  const overallDelta = prevOverall !== null ? overall - prevOverall : null

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
    : getSubjectTipMessage(active.name, active.score, childFirstName)

  const [openNote, setOpenNote] = useState(false)
  const isLong = activeTeacherNote.length > 92
  const shownNote = !openNote && isLong ? `${activeTeacherNote.slice(0, 92).trim()}…` : activeTeacherNote

  useEffect(() => {
    setOpenNote(false)
  }, [activeKey, report.comment])

  return (
    <section className="sc-report-flat-v1">
      <style jsx global>{`
        .sc-report-flat-v1 {
          width: 100%;
          max-width: 393px;
          margin: 0 auto;
          padding: 0 0 34px;
          color: ${INK};
          font-family: "Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .sc-report-flat-title-v1 {
          padding: 8px 28px 0;
          text-align: center;
        }

        .sc-report-flat-title-v1 h2 {
          margin: 0;
          color: ${INK};
          font-size: 26.5px;
          font-weight: 420;
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
          width: 244px;
          height: 244px;
          max-width: 76vw;
          margin: 28px auto 0;
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
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          text-align: center;
        }

        .sc-score-gauge-center-flat-v1 span {
          color: ${INK};
          font-size: 56px;
          font-weight: 420;
          line-height: 0.92;
          letter-spacing: -0.075em;
          font-variant-numeric: tabular-nums;
        }

        .sc-score-gauge-center-flat-v1 small {
          margin-top: 7px;
          color: ${INK_SOFT};
          font-size: 12.8px;
          font-weight: 430;
          letter-spacing: -0.01em;
        }

        .sc-score-flat-summary-v1 {
          margin-top: -58px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .sc-score-flat-summary-v1 .emoji {
          font-size: 27px;
          line-height: 1;
          margin-bottom: 16px;
        }

        .sc-score-flat-summary-v1 .status {
          margin: 0;
          color: ${INK};
          font-size: 15.5px;
          font-weight: 620;
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

        .sc-report-delta-flat-v1 svg,
        .sc-report-delta-flat-v1 strong {
          color: ${BRAND};
          font-weight: 650;
        }

        .sc-teacher-flat-note-v1 {
          width: calc(100% - 56px);
          max-width: 356px;
          margin: 30px auto 0;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 11px;
          border-radius: 22px;
          background: #FFFFFF;
          border: 1px solid rgba(17,17,17,0.05);
          box-shadow: none;
          box-sizing: border-box;
        }

        .sc-teacher-flat-avatar-v1 {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #F1F2F3;
          border: 2px solid #FFF1EC;
          overflow: hidden;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          color: ${BRAND};
          font-size: 12px;
          font-weight: 700;
        }

        .sc-teacher-flat-avatar-v1 img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
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
          font-weight: 430;
          line-height: 1.42;
          letter-spacing: -0.01em;
        }

        .sc-teacher-flat-copy-v1 strong {
          color: #10141A;
          font-weight: 700;
        }

        .sc-teacher-flat-note-v1 {
          animation: scTeacherNoteSwapV1 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes scTeacherNoteSwapV1 {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sc-teacher-flat-note-v1.is-subject-tip-note {
          background: #FFF8F5;
          border-color: rgba(244,83,31,0.10);
        }

        .sc-teacher-flat-note-v1.is-subject-tip-note .sc-teacher-flat-avatar-v1 {
          background: #FFFFFF;
          color: #10141A;
          border-color: rgba(244,83,31,0.16);
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
          color: ${BRAND};
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .sc-breakdown-flat-v1 {
          margin-top: 34px;
          padding-bottom: 8px;
        }

        .sc-breakdown-flat-head-v1 {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding: 0 28px;
        }

        .sc-breakdown-flat-head-v1 p {
          margin: 0;
          color: ${INK};
          font-size: 13px;
          font-weight: 420;
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
          padding: 0 28px 4px;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 28px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .sc-subject-flat-slider-v1::-webkit-scrollbar {
          display: none;
        }

        .sc-subject-flat-slider-card-v1 {
          width: 152px;
          min-height: 132px;
          flex-shrink: 0;
          scroll-snap-align: start;
          border: none;
          border-radius: 24px;
          background: #FFFFFF;
          color: ${INK};
          padding: 15px;
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
        }

        .sc-subject-flat-slider-card-v1:active {
          transform: scale(0.98);
        }

        .sc-subject-flat-slider-card-v1.is-active {
          background: #FFF1EC;
          color: ${INK};
          border-color: rgba(244,83,31,0.16);
        }

        .sc-subject-flat-slider-card-v1 p {
          margin: 14px 0 0;
          color: inherit;
          font-size: 13.2px;
          font-weight: 650;
          line-height: 1.12;
          letter-spacing: -0.025em;
        }

        .sc-subject-flat-slider-card-v1 span {
          display: block;
          margin-top: 4px;
          color: ${INK_SOFT};
          font-size: 11.7px;
          font-weight: 470;
          line-height: 1.2;
        }

        .sc-subject-flat-slider-card-v1.is-active span {
          color: #7C8486;
        }

        .sc-subject-mini-ring-flat-v1 {
          position: relative;
          width: 48px;
          height: 48px;
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
          font-size: 13px;
          font-weight: 680;
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
            width: 146px;
            min-height: 140px;
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

      <ScoreGauge value={active.score} />

      <div className="sc-score-flat-summary-v1">
        <div className="emoji" aria-hidden="true">{getScoreEmoji(active.score)}</div>
        <p className="status">{active.status}</p>

        {overallDelta !== null && active.key === 'overall' ? (
          <Delta value={overallDelta} />
        ) : null}
      </div>

      <section
        key={active.key}
        className={`sc-teacher-flat-note-v1 ${noteIsOverall ? 'is-overall-note' : 'is-subject-tip-note'}`}
        aria-label={noteIsOverall ? 'Teacher note' : `${active.name} tip`}
      >
        <div className="sc-teacher-flat-avatar-v1" aria-hidden="true">
          {noteIsOverall ? (
            teacherPhoto ? <img src={teacherPhoto} alt="" /> : <span>{teacherInitials}</span>
          ) : (
            <span className="sc-subject-tip-emoji-v1">{getScoreEmoji(active.score)}</span>
          )}
        </div>

        <div className="sc-teacher-flat-copy-v1">
          <p>
            <strong>{noteIsOverall ? teacherName : `${active.name} tip`}:</strong>{' '}
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
            <p>Breakdown</p>
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
    </section>
  )
}
