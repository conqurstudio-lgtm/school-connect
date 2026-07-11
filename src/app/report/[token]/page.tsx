// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {GraduationCap, Send, Copy, Check} from 'lucide-react'
import { ReportCard } from '@/components/reports/ReportCard'
import { ParentMomentsPage } from '@/components/parents/ParentMomentsPage'
import { PageGhostLoader } from '@/components/ui/PageGhostLoader'
import { ParentBottomHoverMenu } from '@/components/parents/ParentBottomHoverMenu'

const T = {
  ink: '#1A1A1A',
  ink2: '#5F6268',
  ink3: '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg: '#FFFFFF',
  soft: '#F5F5F7',
  soft2: '#F8F8F9',
  white: '#FFFFFF',
  accent: '#8FA6A1',
  accentSoft: '#EEF3F1',
}


function getReportScore(report: any) {
  const values = Object.values(report?.scores || {})
    .map((value: any) => Number(value))
    .filter((value: number) => Number.isFinite(value))

  if (!values.length) return 0

  const average = values.reduce((sum: number, value: number) => sum + value, 0) / values.length
  return Math.max(0, Math.min(5, average))
}

function getReportPerformance(score: number) {
  if (score >= 4.5) return 'Excellent progress'
  if (score >= 4) return 'Very good progress'
  if (score >= 3) return 'Good progress'
  if (score >= 2.5) return 'Fair progress'
  return 'Needs support'
}

function getReportDateLabel(report: any) {
  const raw = report?.week_starting || report?.published_at || report?.created_at

  if (!raw) return 'Previous report'

  const start = new Date(raw)
  if (!Number.isFinite(start.getTime())) return 'Previous report'

  if (report?.week_starting) {
    const end = new Date(start)
    end.setDate(start.getDate() + 4)

    const dayMonth = { day: 'numeric', month: 'short' } as Intl.DateTimeFormatOptions
    const year = start.getFullYear()

    return `${start.toLocaleDateString('en-ZA', dayMonth)} – ${end.toLocaleDateString('en-ZA', dayMonth)} ${year}`
  }

  return start.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function PreviousReportsCard({ reports, childName }: { reports: any[], childName: string }) {
  const [showAllPreviousReports, setShowAllPreviousReports] = useState(false)
  const safeReports = Array.isArray(reports) ? reports.filter(Boolean) : []
  const trophyReports = safeReports.filter((report: any) => getReportScore(report) >= 4.5).length
  const starReports = safeReports.filter((report: any) => getReportScore(report) >= 4).length
  const bestScore = safeReports.reduce((best: number, report: any) => Math.max(best, getReportScore(report)), 0)
  const bestScoreText = bestScore > 0 ? bestScore.toFixed(1) : '—'
  const visibleReports = showAllPreviousReports ? safeReports : safeReports.slice(0, 4)

  if (!safeReports.length) return null

  return (
    <section
      className="sc-previous-reports-history-card-v1"
      aria-label="Progress history history"
      style={{
        width: '100%',
        maxWidth: 370,
        margin: '14px auto 0',
        borderRadius: 28,
        background: '#f7f7f7',
        padding: '16px 16px 12px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
      }}>
        <div style={{ minWidth: 0 }}>
<p style={{
            margin: '4px 0 0',
            fontSize: 13.5,
            fontWeight: 650,
            color: '#5F6268',
            lineHeight: 1.15,
          }}>
            Recent report history
          </p>
        </div>

        <span style={{
          fontSize: 11.5,
          fontWeight: 650,
          color: '#5F6268',
          background: '#FFFFFF',
          borderRadius: 999,
          padding: '6px 10px',
          flexShrink: 0,
        }}>
          {safeReports.length} {safeReports.length === 1 ? 'report' : 'reports'}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 8,
        marginBottom: 12,
      }}>
        <div style={{
          borderRadius: 18,
          background: '#FFFFFF',
          padding: '10px 8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 17, lineHeight: 1 }}>🏆</div>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>
            {trophyReports}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 10.5, fontWeight: 520, color: '#6B6F76', lineHeight: 1.05 }}>
            Trophies
          </p>
        </div>

        <div style={{
          borderRadius: 18,
          background: '#FFFFFF',
          padding: '10px 8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 17, lineHeight: 1 }}>⭐</div>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>
            {starReports}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 10.5, fontWeight: 520, color: '#6B6F76', lineHeight: 1.05 }}>
            Stars
          </p>
        </div>

        <div style={{
          borderRadius: 18,
          background: '#FFFFFF',
          padding: '10px 8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 17, lineHeight: 1 }}>✨</div>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>
            {bestScoreText}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 10.5, fontWeight: 520, color: '#6B6F76', lineHeight: 1.05 }}>
            Best
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gap: 8,
      }}>
        {visibleReports.map((report: any, index: number) => {
          const score = getReportScore(report)
          const scoreText = score > 0 ? score.toFixed(1) : '—'
          const performance = getReportPerformance(score)
          const scorePercent = score > 0 ? Math.max(0, Math.min(100, (score / 5) * 100)) : 0

          return (
            <article
              key={report?.id || report?.token || report?.week_starting || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderRadius: 22,
                background: '#FFFFFF',
                padding: '11px 12px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 620,
                  color: '#1A1A1A',
                  lineHeight: 1.18,
                  letterSpacing: '-0.02em',
                }}>
                  {getReportDateLabel(report)}
                </p>
                <p style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  fontWeight: 430,
                  color: '#5F6268',
                  lineHeight: 1.25,
                }}>
                  {performance}
                </p>
              </div>

              <div
                aria-label={`Previous report score ${scoreText} out of 5`}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  padding: 2,
                  boxSizing: 'border-box',
                  background: score > 0
                    ? `conic-gradient(#252525 ${scorePercent}%, rgba(0,0,0,0.08) 0)`
                    : 'rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 999,
                  background: '#FFFFFF',
                  color: '#1A1A1A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11.5,
                  fontWeight: 650,
                  letterSpacing: '-0.02em',
                }}>
                  {scoreText}
                </span>
              </div>
            </article>
          )
        })}
      </div>

      {safeReports.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAllPreviousReports(value => !value)}
          style={{
            width: '100%',
            marginTop: 10,
            border: 'none',
            background: 'transparent',
            color: '#252525',
            fontSize: 12.5,
            fontWeight: 650,
            lineHeight: 1,
            padding: '8px 0 4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {showAllPreviousReports ? 'View less' : `View more`}
        </button>
      )}
    </section>
  )
}


function MomentBellLink({ token, onOpen }: { token: string, onOpen: () => void }) {
  const [hasNew, setHasNew] = useState(false)

  useEffect(() => {
    if (!token) return

    let alive = true

    fetch(`/api/parent/moments?token=${encodeURIComponent(token)}&peek=1`, { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (!alive) return

        const nextHasNew = Array.isArray(json.moments)
          ? json.moments.some((moment: any) => !moment?.recipient?.viewed_at)
          : false

        setHasNew(nextHasNew)
      })
      .catch(() => {
        if (alive) setHasNew(false)
      })

    return () => {
      alive = false
    }
  }, [token])

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="View Moments"
      style={{
        position: 'relative',
        top: 'auto',
        right: 'auto',
        width: 38,
        height: 38,
        borderRadius: 999,
        border: 'none',
        background: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        flexShrink: 0,
        overflow: 'visible',
        zIndex: 30,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <iframe
        src="https://lottie.host/embed/282102dd-9f81-471f-8ce5-2aa3f37cca26/QoO9r7Ad2Y.lottie"
        title="Moments"
        aria-hidden="true"
        style={{
          width: 30,
          height: 30,
          border: 'none',
          display: 'block',
          pointerEvents: 'none',
        }}
      />

      {hasNew && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: '#ef4444',
            boxShadow: '0 0 0 2px #FFFFFF',
          }}
        />
      )}
    </button>
  )
}


function reportTeacherInitials(name: any) {
  return String(name || 'Teacher')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'T'
}

function ReportTeacherActionAvatar({ teacher, school, child }: any) {

  const [open, setOpen] = useState(false)

  const teacherName = teacher?.name || 'Teacher'
  const teacherPhoto =
    teacher?.photo_url ||
    teacher?.avatar_url ||
    teacher?.image_url ||
    ''

  const childName = child?.name || child?.first_name || 'Your child'
  const childFirstName = String(childName || '').trim().split(/\s+/)[0] || 'Your child'
  const childTeacherLabel = childFirstName === 'Your child'
    ? 'Your child’s teacher'
    : `${childFirstName}${childFirstName.toLowerCase().endsWith('s') ? '’' : '’s'} teacher`

  const schoolName = school?.name || teacher?.school_name || ''

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* report-action-teacher-avatar-v435 */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="View teacher information"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(37,37,37,0.10)',
          background: teacherPhoto ? `url(${teacherPhoto}) center/cover` : '#FFFFFF',
          color: '#5F6268',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 620,
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 8px 18px rgba(0,0,0,0.05)',
        }}
      >
        {!teacherPhoto && reportTeacherInitials(teacherName)}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 48,
          left: 0,
          zIndex: 100,
          width: 'min(300px, calc(100vw - 42px))',
          borderRadius: 22,
          border: '1px solid rgba(37,37,37,0.08)',
          background: '#FFFFFF',
          boxShadow: '0 18px 46px rgba(0,0,0,0.14)',
          padding: 14,
          textAlign: 'left',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 11,
          }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: teacherPhoto ? `url(${teacherPhoto}) center/cover` : '#F4F4F5',
              color: '#5F6268',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 640,
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {!teacherPhoto && reportTeacherInitials(teacherName)}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                fontSize: 14,
                fontWeight: 620,
                color: '#252525',
                letterSpacing: '-0.02em',
                margin: '1px 0 4px',
              }}>
                {teacherName}
              </p>

              <p style={{
                fontSize: 12.6,
                color: '#5F6268',
                lineHeight: 1.35,
                margin: 0,
              }}>
                {childTeacherLabel}
              </p>

              {schoolName ? (
                <p style={{
                  fontSize: 12.3,
                  color: '#5F6268',
                  lineHeight: 1.35,
                  margin: '9px 0 0',
                }}>
                  {schoolName}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close teacher information"
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: 'none',
                background: '#F6F6F7',
                color: '#5F6268',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 16,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


function FamilyShareButton({ token, variant = 'icon' }: { token: string, variant?: 'icon' | 'card' }) {
  const [creating, setCreating] = useState(false)

  async function getShareUrl() {
    if (!token || creating) return ''

    setCreating(true)

    try {
      const res = await fetch(`/api/report/${encodeURIComponent(token)}/family-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in_days: 14 }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json.error || 'Could not create family link')
      }

      return json.share_url || ''
    } catch (err: any) {
      alert(err?.message || 'Could not create family link')
      return ''
    } finally {
      setCreating(false)
    }
  }

  async function shareReport() {
    const url = await getShareUrl()
    if (!url) return

    const shareData = {
      title: 'School report',
      text: 'I am sharing a read-only school report with you.',
      url,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {}
      return
    }

    alert('Sharing is not available on this device. Please open this report on your phone to share it.')
  }

  if (variant === 'card') {
    return (
      <button
        type="button"
        className="sc-family-share-card-v2"
        onClick={shareReport}
        disabled={creating}
        aria-label="Share report with family"
        style={{
          width: '100%',
          maxWidth: 370,
          margin: '14px auto 0',
          border: 'none',
          borderRadius: 26,
          background: '#f7f7f7',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 16px',
          cursor: creating ? 'default' : 'pointer',
          opacity: creating ? 0.65 : 1,
          textAlign: 'left',
          fontFamily: 'inherit',
          boxShadow: 'none',
        }}
      >
        <span style={{
          minWidth: 0,
          flex: 1,
          display: 'block',
        }}>
          <span style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 650,
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
            lineHeight: 1.15,
          }}>
            Share with family
          </span>
          <span style={{
            display: 'block',
            marginTop: 4,
            fontSize: 12.5,
            fontWeight: 430,
            color: '#5F6268',
            lineHeight: 1.25,
          }}>
            Only this report is shared.
          </span>
        </span>

        <span style={{
          width: 32,
          height: 32,
          borderRadius: 12,
          border: 'none',
          background: '#252525',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Send size={16} strokeWidth={1.75} />
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={shareReport}
      disabled={creating}
      aria-label="Share report with family"
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        border: 'none',
        background: '#FFFFFF',
        color: '#252525',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: creating ? 'default' : 'pointer',
        opacity: creating ? 0.55 : 1,
        padding: 0,
      }}
    >
      <Send size={18} strokeWidth={2} />
    </button>
  )
}


function ReportSafeAreaStyle() {
  return null
}

function LoadingState() {
  return <PageGhostLoader />
}

function ErrorState({ message }: { message: string }) {
  return (
    <main style={centerPage}>
      <section style={card}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: T.soft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: T.ink3,
        }}>
          <GraduationCap size={28} strokeWidth={1.5} />
        </div>

        <h1 style={{
          fontSize: 20,
          fontWeight: 650,
          color: T.ink,
          letterSpacing: '-0.03em',
          margin: '0 0 7px',
        }}>
          Report unavailable
        </h1>

        <p style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: T.ink3,
          margin: 0,
        }}>
          {message || 'This private report link could not be opened.'}
        </p>
      </section>
    </main>
  )
}

export default function ParentMagicReportPage() {
  const params = useParams<{ token: string }>()
  const rawToken = params?.token
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken
  const [parentView, setParentView] = useState<'report' | 'moments'>(() => {
    if (typeof window === 'undefined') return 'report'
    return new URLSearchParams(window.location.search).get('view') === 'moments' ? 'moments' : 'report'
  })

  useEffect(() => {
    const syncParentViewFromUrl = () => {
      const nextView = new URLSearchParams(window.location.search).get('view') === 'moments' ? 'moments' : 'report'
      setParentView(nextView)
    }

    window.addEventListener('popstate', syncParentViewFromUrl)
    return () => window.removeEventListener('popstate', syncParentViewFromUrl)
  }, [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState<any>(null)

  useEffect(() => {
    // report-route-shell-lock-v251
    const html = document.documentElement
    const body = document.body

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      htmlBackground: html.style.background,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyBackground: body.style.background,
      bodyTouchAction: body.style.touchAction,
    }

    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    html.style.background = '#FFFFFF'

    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    body.style.background = '#FFFFFF'
    body.style.touchAction = 'pan-y'

    return () => {
      html.style.overflow = previous.htmlOverflow
      html.style.overscrollBehavior = previous.htmlOverscroll
      html.style.background = previous.htmlBackground

      body.style.overflow = previous.bodyOverflow
      body.style.overscrollBehavior = previous.bodyOverscroll
      body.style.background = previous.bodyBackground
      body.style.touchAction = previous.bodyTouchAction
    }
  }, [])


  useEffect(() => {
    if (!token) {
      setError('Missing report link.')
      setLoading(false)
      return
    }

    let alive = true

    fetch(`/api/report/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async res => {
        const json = await res.json().catch(() => ({}))

        if (!alive) return

        if (!res.ok) {
          setError(json.error || 'This report link is invalid or has expired.')
          return
        }

        setPayload(json)
      })
      .catch(() => {
        if (alive) setError('Could not open this report right now.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [token])
  if (loading) return <LoadingState />
  if (error || !payload?.report) return <ErrorState message={error} />


  const openReportView = () => {
    setParentView('report')
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/report/${encodeURIComponent(token || '')}`)
    }
  }

  const openMomentsView = () => {
    setParentView('moments')
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/report/${encodeURIComponent(token || '')}?view=moments`)
    }
  }

  const childName = payload.child?.name || 'Your child'
  const teacherName = payload.teacher?.name || 'Teacher'
  const school = payload.school || null
  const isFamilyShare = payload?.link_type === 'family_share'
  const reports = (payload.reports?.length ? payload.reports : [payload.report])
    .slice()
    .sort((a: any, b: any) => {
      const aDate = new Date(a.week_starting || a.published_at || a.created_at || 0).getTime()
      const bDate = new Date(b.week_starting || b.published_at || b.created_at || 0).getTime()
      return bDate - aDate
    })
    .map((report: any, index: number) => ({
      ...report,
      child_name: childName,
      teacher_name: teacherName,
      teacher_photo_url:
        payload.teacher?.photo_url ||
        payload.teacher?.avatar_url ||
        payload.teacher?.image_url ||
        report.teacher_photo_url ||
        report.teacher_avatar_url ||
        report.teacher_image_url ||
        '',
      display_position: index === 0 ? 'latest' : 'previous',
    }))

  return (
    <main className="sc-parent-report-page sc-report-clean-page-v276" style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      overscrollBehavior: 'none',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: T.ink,
      background: '#FFFFFF',
    }}>
      <div className="sc-parent-report-shell sc-report-clean-shell-v276" style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
      }}>
        <header style={{
          flexShrink: 0,
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 8px',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{
              position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <MomentBellLink token={token || ''} onOpen={openMomentsView} />
            </div>
          </div>
        </header>

        <section className="sc-report-clean-scroll-v276" style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
          padding: '0 16px calc(18px + env(safe-area-inset-bottom, 0px))',
          background: '#FFFFFF',
        }}>
          {parentView === 'moments' ? (
            <div style={{
              width: '100%',
              maxWidth: 430,
              margin: '0 auto',
            }}>
              <ParentMomentsPage
                token={token || ''}
                embedded={true}
                onClose={openReportView}
                insideReportShell={true}
              />
            </div>
          ) : (
          <div style={{
            width: '100%',
            maxWidth: 430,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: reports.length > 1 ? 18 : 0,
          }}>
            {reports[0] && (
              <div className="sc-main-report-card-v292" style={{
                background: '#FFFFFF',
                borderRadius: 28,
                padding: '6px 10px 16px',
                border: 'none',
                overflow: 'hidden',
              }}>
                <ReportCard
                  key={reports[0].id || `${reports[0].week_starting || 'latest-report'}-latest`}
                  report={reports[0]}
                  childName={childName}
                />
              {!isFamilyShare && <FamilyShareButton token={token || ''} variant="card" />}
</div>
            )}
            {reports.length > 1 && (
              <section style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                marginTop: 8,
              }}>
{reports.slice(1).length > 0 && (
                    <PreviousReportsCard reports={reports.slice(1)} childName={childName} />
                  )}
              </section>
            )}
          </div>
          )}
        </section>
      </div>
</main>
  )
}

const centerPage: any = {
  minHeight: '100dvh',
  height: '100dvh',
  overflow: 'hidden',
  background: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
}

const card: any = {
  width: '100%',
  maxWidth: 360,
  textAlign: 'center',
  background: T.white,
  border: `1px solid ${T.border}`,
  borderRadius: 24,
  padding: '34px 24px',
  boxShadow: '0 18px 48px rgba(0,0,0,0.08)'}
