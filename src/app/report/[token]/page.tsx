// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {GraduationCap, Send, Copy, Check, ChevronLeft} from 'lucide-react'
import { ReportCard } from '@/components/reports/ReportCard'
import { ParentMomentsPage } from '@/components/parents/ParentMomentsPage'
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

  if (!raw) return 'Previous progress'

  const start = new Date(raw)
  if (!Number.isFinite(start.getTime())) return 'Previous progress'

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

  if (!safeReports.length) return null

  return (
    <section
      className="sc-previous-reports-history-card-v1 sc-report-lower-card-motion-v1 sc-report-scroll-reveal-v1"
      aria-label="Previous reports"
      style={{
        width: '100%',
        maxWidth: 370,
        margin: '0 auto 0',
        borderRadius: 24,
        background: '#F7F7F8',
        padding: 11,
        boxSizing: 'border-box',
        border: '1px solid rgba(0,0,0,0.025)',
      }}
    >
      <button
        type="button"
        onClick={() => setShowAllPreviousReports(value => !value)}
        aria-expanded={showAllPreviousReports}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '4px 4px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          transition: 'opacity 160ms ease, transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{
            display: 'block',
            fontSize: 13.8,
            fontWeight: 570,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: '#1A1A1A',
          }}>
            Previous reports
          </span>

          <span style={{
            display: 'block',
            marginTop: 3,
            fontSize: 12,
            fontWeight: 430,
            color: '#5F6268',
            lineHeight: 1.25,
          }}>
            {safeReports.length} {safeReports.length === 1 ? 'report' : 'reports'} available
          </span>
        </span>

        <span style={{
          flexShrink: 0,
          minWidth: 52,
          height: 42,
          borderRadius: 999,
          background: '#FFFFFF',
          color: '#252525',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 680,
          lineHeight: 1,
          padding: '0 12px',
          boxShadow: '0 1px 0 rgba(0,0,0,0.025)',
        }}>
          {showAllPreviousReports ? 'Hide' : 'View'}
        </span>
      </button>

      {showAllPreviousReports ? (
        <div style={{
          display: 'grid',
          gap: 8,
          marginTop: 9,
        }}>
          {safeReports.map((report: any, index: number) => {
            const score = getReportScore(report)
            const scoreText = score > 0 ? score.toFixed(1) : '—'
            const performance = getReportPerformance(score)

            return (
              <article
                key={report?.id || report?.token || report?.week_starting || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  borderRadius: 20,
                  background: '#FFFFFF',
                  padding: '10px 11px',
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

                <span style={{
                  width: 36,
                  height: 28,
                  borderRadius: 999,
                  background: '#F5F5F7',
                  color: '#252525',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11.5,
                  fontWeight: 650,
                  flexShrink: 0,
                }}>
                  {scoreText}
                </span>
              </article>
            )
          })}
        </div>
      ) : null}
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
        color: '#252525',
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



function MomentsActionCard({ onOpen }: { onOpen: () => void }) {
  return (
    <section
      className="sc-premium-moments-card-v1 sc-report-lower-card-motion-v1 sc-report-scroll-reveal-v1"
      aria-label="Class moments"
    >
      <span className="sc-premium-moments-copy-v1">
        <span className="sc-premium-moments-title-v1">Class moments</span>
        <span className="sc-premium-moments-subtitle-v1">View photos and updates shared from class.</span>
      </span>

      <button
        type="button"
        onClick={onOpen}
        className="sc-premium-moments-button-v1"
      >
        View
      </button>
    </section>
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
      <section
        className="sc-family-share-card-v2 sc-report-lower-card-motion-v1 sc-report-scroll-reveal-v1"
        aria-label="Share report with family"
        style={{
          width: '100%',
          maxWidth: 370,
          margin: '0 auto 0',
          border: '1px solid rgba(17,17,17,0.055)',
          borderRadius: 28,
          background: '#FFFFFF',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '15px 15px 15px 18px',
          textAlign: 'left',
          fontFamily: 'inherit',
          boxShadow: '0 14px 36px rgba(17,17,17,0.035)',
          boxSizing: 'border-box',
        }}
      >
        <span style={{
          minWidth: 0,
          flex: 1,
          display: 'block',
        }}>
          <span style={{
            display: 'block',
            fontSize: 14,
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

        <button
          type="button"
          onClick={shareReport}
          disabled={creating}
          aria-label="Share report with family"
          style={{
            width: 42,
            height: 32,
            borderRadius: 999,
            border: 'none',
            background: 'rgba(244,83,31,0.09)',
            color: '#F4531F',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: creating ? 'default' : 'pointer',
            opacity: creating ? 0.65 : 1,
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          <Send size={16} strokeWidth={1.75} />
        </button>
      </section>
    )
  }

  return (
    <button
      type="button"
      onClick={shareReport}
      disabled={creating}
      aria-label="Share report with family"
      style={{
        width: 36,
        height: 36,
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
  return (
    <style jsx global>{`
      @keyframes scReportPageSlideIn {
        from {
          opacity: 0;
          transform: translateY(18px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes scReportLowerCardIn {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes scReportLoaderSpin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes scReportLoaderFade {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .sc-report-page-motion-v1 {
        animation: scReportPageSlideIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .sc-report-lower-card-motion-v1,
      .sc-report-subject-panel-inline {
        animation: scReportLowerCardIn 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        will-change: transform, opacity;
      }

      .sc-family-share-card-v2 {
        animation-delay: 60ms;
      }

      .sc-previous-reports-history-card-v1 {
        animation-delay: 120ms;
      }


      /* premium report bottom actions */
      .sc-report-subject-panel-inline {
        margin-bottom: 18px !important;
        padding-bottom: 0 !important;
      }

      .sc-premium-moments-card-v1,
      .sc-family-share-card-v2,
      .sc-previous-reports-history-card-v1 {
        width: 100% !important;
        max-width: 370px !important;
        margin: 0 auto 12px !important;
        border-radius: 26px !important;
        box-sizing: border-box !important;
      }

      .sc-premium-moments-card-v1 {
        background: #FFFFFF !important;
        border: 1px solid rgba(17,17,17,0.06) !important;
        box-shadow: 0 16px 38px rgba(15, 23, 42, 0.045) !important;
        padding: 14px 14px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px !important;
      }

      .sc-premium-moments-copy-v1 {
        min-width: 0 !important;
        flex: 1 !important;
        display: block !important;
      }

      .sc-premium-moments-title-v1 {
        display: block !important;
        color: #10141A !important;
        font-size: 13.8px !important;
        font-weight: 700 !important;
        letter-spacing: -0.025em !important;
        line-height: 1.15 !important;
      }

      .sc-premium-moments-subtitle-v1 {
        display: block !important;
        margin-top: 4px !important;
        color: #6B7280 !important;
        font-size: 12.4px !important;
        font-weight: 430 !important;
        line-height: 1.28 !important;
        letter-spacing: -0.01em !important;
      }

      .sc-premium-moments-button-v1 {
        min-width: 58px !important;
        height: 34px !important;
        border-radius: 999px !important;
        border: none !important;
        background: #F4531F !important;
        color: #FFFFFF !important;
        font-family: inherit !important;
        font-size: 12.4px !important;
        font-weight: 720 !important;
        cursor: pointer !important;
        padding: 0 15px !important;
        flex-shrink: 0 !important;
      }

      .sc-family-share-card-v2 {
        background: #FFF7F3 !important;
        border: 1px solid rgba(244,83,31,0.12) !important;
        box-shadow: none !important;
        padding: 14px 14px !important;
      }

      .sc-family-share-card-v2 button {
        background: #F4531F !important;
        color: #FFFFFF !important;
      }

      .sc-previous-reports-history-card-v1 {
        background: #FFFFFF !important;
        border: 1px solid rgba(17,17,17,0.06) !important;
        box-shadow: 0 16px 38px rgba(15, 23, 42, 0.035) !important;
        padding: 11px !important;
      }

      @media (max-width: 520px) {
        .sc-premium-moments-card-v1,
        .sc-family-share-card-v2,
        .sc-previous-reports-history-card-v1 {
          margin-bottom: 11px !important;
          border-radius: 24px !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .sc-report-page-motion-v1,
        .sc-report-lower-card-motion-v1,
        .sc-report-subject-panel-inline {
          animation: none !important;
        }
      }
    `}</style>
  )
}

function LoadingState() {
  return (
    <main style={centerPage}>
      <ReportSafeAreaStyle />

      <section
        aria-label="Loading report"
        style={{
          width: 96,
          minHeight: 96,
          borderRadius: 30,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'scReportLoaderFade 260ms ease-out both',
        }}
      >
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          border: '2px solid rgba(37,37,37,0.10)',
          borderTopColor: '#252525',
          animation: 'scReportLoaderSpin 780ms linear infinite',
        }} />
      </section>
    </main>
  )
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
    if (typeof window === 'undefined') return

    const syncParentViewFromUrl = () => {
      setParentView(new URLSearchParams(window.location.search).get('view') === 'moments' ? 'moments' : 'report')
    }

    syncParentViewFromUrl()
    window.addEventListener('popstate', syncParentViewFromUrl)
    return () => window.removeEventListener('popstate', syncParentViewFromUrl)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const html = document.documentElement
    const body = document.body

    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
    }

    html.style.overflow = 'auto'
    body.style.overflow = 'auto'
    html.style.overscrollBehavior = 'auto'
    body.style.overscrollBehavior = 'auto'

    return () => {
      html.style.overflow = previous.htmlOverflow
      body.style.overflow = previous.bodyOverflow
      html.style.overscrollBehavior = previous.htmlOverscroll
      body.style.overscrollBehavior = previous.bodyOverscroll
    }
  }, [])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const styleId = 'sc-report-motion-runtime-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes scReportPageSlideInRuntime {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.992);
            filter: blur(1px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .sc-report-page-motion-v1 {
          animation: scReportPageSlideInRuntime 560ms cubic-bezier(0.16, 1, 0.3, 1) both !important;
          will-change: transform, opacity;
        }

        .sc-report-scroll-reveal-v1 {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 520ms cubic-bezier(0.16, 1, 0.3, 1), transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }

        .sc-report-scroll-reveal-v1.sc-report-is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .sc-report-page-motion-v1,
          .sc-report-scroll-reveal-v1 {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `
      document.head.appendChild(style)
    }

    const runReveal = () => {
      const items = Array.from(document.querySelectorAll('.sc-report-scroll-reveal-v1'))
      if (!items.length) return

      if (!('IntersectionObserver' in window)) {
        items.forEach((item) => item.classList.add('sc-report-is-visible'))
        return
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sc-report-is-visible')
            observer.unobserve(entry.target)
          }
        })
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px',
      })

      items.forEach((item) => observer.observe(item))
      return () => observer.disconnect()
    }

    let cleanup: void | (() => void)
    const frame = window.requestAnimationFrame(() => {
      cleanup = runReveal()
    })

    return () => {
      window.cancelAnimationFrame(frame)
      if (cleanup) cleanup()
    }
  }, [loading, parentView])

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
      background: '#E9ECE8',
    }}>
      <div className="sc-parent-report-shell sc-report-clean-shell-v276" style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#FBFAF7',
      }}>
        <style jsx global>{`
          @keyframes scParentMomentsEnterV1 {
            from {
              opacity: 0;
              transform: translateX(18px);
              filter: blur(2px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
              filter: blur(0);
            }
          }

          @keyframes scParentReportEnterV1 {
            from {
              opacity: 0;
              transform: translateX(-14px);
              filter: blur(2px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
              filter: blur(0);
            }
          }

          .sc-parent-view-motion-v1 {
            will-change: transform, opacity, filter;
            backface-visibility: hidden;
          }

          .sc-parent-moments-enter-v1 {
            animation: scParentMomentsEnterV1 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .sc-parent-report-enter-v1 {
            animation: scParentReportEnterV1 340ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          @media (prefers-reduced-motion: reduce) {
            .sc-parent-moments-enter-v1,
            .sc-parent-report-enter-v1 {
              animation: none !important;
            }
          }
        `}</style>

        <header style={{
          flexShrink: 0,
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 8px',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: parentView === 'moments' ? 'space-between' : 'flex-end',
          position: 'relative',
          zIndex: 10,
        }}>
          {parentView === 'moments' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
              flex: 1,
            }}>
              <button
                type="button"
                onClick={openReportView}
                aria-label="Back to report"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: 'none',
                  background: 'transparent',
                  color: '#252525',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  fontFamily: 'inherit',
                }}
              >
                <span style={{
                  width: 13,
                  height: 13,
                  borderLeft: '2.6px solid currentColor',
                  borderBottom: '2.6px solid currentColor',
                  borderRadius: 1.5,
                  transform: 'rotate(45deg) translate(1px, -1px)',
                  display: 'block',
                }} />
              </button>

              <h1 style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 620,
                color: '#252525',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                Moments
              </h1>
            </div>
          ) : null}

          {parentView !== 'moments' ? (
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginLeft: 'auto',
            }}>
              <MomentBellLink token={token || ''} onOpen={openMomentsView} />
            </div>
          ) : null}
        </header>

        <section className="sc-report-clean-scroll-v276" style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
          padding: parentView === 'moments'
            ? '0 16px calc(18px + env(safe-area-inset-bottom, 0px))'
            : '0 0 calc(18px + env(safe-area-inset-bottom, 0px))',
          background: parentView === 'moments' ? '#FFFFFF' : '#FBFAF7',
        }}>
          {parentView === 'moments' ? (
            <div
              key="moments-view"
              className="sc-parent-view-motion-v1 sc-parent-moments-enter-v1"
              style={{
                width: '100%',
                maxWidth: 430,
                margin: '0 auto',
                boxSizing: 'border-box',
              }}
            >
              <ParentMomentsPage
                token={token || ''}
                embedded={true}
                onClose={openReportView}
                insideReportShell={true}
              />
            </div>
          ) : (
          <div
            key="report-view"
            className="sc-parent-view-motion-v1 sc-parent-report-enter-v1"
            style={{
              width: '100%',
              maxWidth: 430,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: reports.length > 1 ? 18 : 0,
            }}
          >
            {reports[0] && (
              <div className="sc-report-page-motion-v1">
                <ReportCard
                  key={reports[0].id || `${reports[0].week_starting || 'latest-report'}-latest`}
                  report={reports[0]}
                  childName={childName}
                />

                <div
                  className="sc-report-bottom-family-share-wrap-v1"
                  style={{
                    margin: '10px 24px 0',
                    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                  }}
                >
                  <FamilyShareButton token={token} variant="card" />
                </div>
              </div>
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
