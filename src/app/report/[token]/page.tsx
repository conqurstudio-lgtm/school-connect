// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { ReportCard } from '@/components/reports/ReportCard'
import { ParentMomentsPage } from '@/components/parents/ParentMomentsPage'

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

function PreviousReportDropdown({ report, childName }: { report: any, childName: string }) {
  const score = getReportScore(report)
  const scoreText = score > 0 ? score.toFixed(1) : '—'
  const performance = getReportPerformance(score)
  const scorePercent = score > 0 ? Math.max(0, Math.min(100, (score / 5) * 100)) : 0

  return (
    <details className="sc-previous-report-flat-v278" style={{
      borderTop: '1px solid rgba(0,0,0,0.06)',
      background: 'transparent',
    }}>
      <summary style={{
        listStyle: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        padding: '14px 2px',
      }}>
        <div style={{
          minWidth: 0,
          flex: 1,
        }}>
          <p style={{
            fontSize: 13.5,
            fontWeight: 540,
            color: T.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            {getReportDateLabel(report)}
          </p>

          <p style={{
            fontSize: 12.5,
            color: T.ink3,
            lineHeight: 1.35,
            margin: '3px 0 0',
          }}>
            {performance}
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          flexShrink: 0,
        }}>
          <div
            aria-label={`Score ${scoreText} out of 5`}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              padding: 2,
              boxSizing: 'border-box',
              background: score > 0
                ? `conic-gradient(${T.accent} ${scorePercent}%, rgba(0,0,0,0.06) 0)`
                : 'rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{
              width: '100%',
              height: '100%',
              borderRadius: 999,
              background: '#FFFFFF',
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 560,
              letterSpacing: '-0.02em',
            }}>
              {scoreText}
            </span>
          </div>
        </div>
      </summary>

      <div className="sc-previous-report-open-body-v288" style={{
        padding: '14px 10px 18px',
        background: '#F8F8F7',
        borderRadius: 20,
        margin: '0 0 14px',
      }}>
        <ReportCard report={report} childName={childName} />
      </div>
    </details>
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
    </button>
  )
}



function SchoolQuickView({ school }: { school: any }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const schoolInitial = String(school?.name || 'S').slice(0, 1).toUpperCase()

  const location = [
    school?.address,
    school?.province,
    school?.country,
  ].filter(Boolean).join(' · ')

  const rawWebsite = String(school?.website || '').trim()
  const websiteHref = rawWebsite
    ? (/^https?:\/\//i.test(rawWebsite) ? rawWebsite : `https://${rawWebsite}`)
    : ''

  useEffect(() => {
    if (!open) return

    const closeOnOutside = (event: PointerEvent) => {
      if (!wrapRef.current) return

      if (!wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={wrapRef} style={{
      position: 'relative',
      width: 'fit-content',
      marginTop: 0,
    }}>
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 17,
          padding: 0,
          borderRadius: 0,
          background: 'transparent',
          border: 'none',
          color: '#7C8486',
          fontSize: 10.5,
          fontWeight: 430,
          lineHeight: 1,
          userSelect: 'none',
          fontFamily: 'inherit',
        }}
      >
        View school
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 25,
          left: 0,
          zIndex: 100,
          width: 272,
          padding: 12,
          borderRadius: 20,
          background: '#FFFFFF',
          boxShadow: '0 18px 45px rgba(0,0,0,0.10)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 15,
              background: school?.logo_url ? `url(${school.logo_url}) center/cover` : '#EEF3F1',
              color: '#8FA6A1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 560,
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {!school?.logo_url && schoolInitial}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13.5,
                fontWeight: 560,
                color: '#252525',
                margin: 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                {school?.name || 'School'}
              </p>

              <p style={{
                fontSize: 12,
                color: '#9A9A9A',
                margin: '2px 0 0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                School profile
              </p>
            </div>
          </div>

          <div style={{
            marginTop: 11,
            paddingTop: 10,
            borderTop: '1px solid rgba(0,0,0,0.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}>
            {school?.tagline && (
              <p style={{
                fontSize: 12.5,
                color: '#5F6268',
                lineHeight: 1.45,
                margin: 0,
              }}>
                {school.tagline}
              </p>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              <span style={{
                fontSize: 10.5,
                color: '#B8B8BC',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.055em',
              }}>
                Location
              </span>

              <span style={{
                fontSize: 12.5,
                color: '#5F6268',
                lineHeight: 1.4,
              }}>
                {location || 'Location not added yet'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              <span style={{
                fontSize: 10.5,
                color: '#B8B8BC',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.055em',
              }}>
                Website
              </span>

              {websiteHref ? (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 12.5,
                    color: '#8FA6A1',
                    lineHeight: 1.4,
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                  }}
                >
                  {rawWebsite}
                </a>
              ) : (
                <span style={{
                  fontSize: 12.5,
                  color: '#9A9A9A',
                  lineHeight: 1.4,
                }}>
                  Website not added yet
                </span>
              )}
            </div>

            {(school?.phone || school?.email) && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                paddingTop: 2,
              }}>
                {school?.phone && (
                  <span style={{ fontSize: 12.2, color: '#9A9A9A' }}>
                    {school.phone}
                  </span>
                )}

                {school?.email && (
                  <span style={{
                    fontSize: 12.2,
                    color: '#9A9A9A',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}>
                    {school.email}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


function ReportSafeAreaStyle() {
  return null
}

function LoadingState() {
  return (
    <main className="parent-report-safe-screen" style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes reportDotBounce {
          0%, 80%, 100% { transform: scale(0.72); opacity: 0.45; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          height: 24,
          margin: '0 auto 14px',
        }}>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: dot === 1 ? '#8FA6A1' : '#D8DFDD',
                animation: 'reportDotBounce 1.05s ease-in-out infinite',
                animationDelay: `${dot * 0.14}s`,
                display: 'block',
              }}
            />
          ))}
        </div>

        <p style={{ fontSize: 14, color: '#9A9CA3', margin: 0 }}>
          Opening weekly report...
        </p>
      </div>
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState<any>(null)
  const [showMoments, setShowMoments] = useState(false)

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
    // report-fixed-touch-lock-v250
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

  if (showMoments) {
    return (
      <ParentMomentsPage
        token={token || ''}
        embedded={true}
        onClose={() => setShowMoments(false)}
      />
    )
  }

  const childName = payload.child?.name || 'Your child'
  const teacherName = payload.teacher?.name || 'Teacher'
  const school = payload.school || null
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
          <MomentBellLink token={token} onOpen={() => setShowMoments(true)} />
        </header>

        <section className="sc-report-clean-scroll-v276" style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
          padding: '4px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
          background: '#FFFFFF',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 430,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: reports.length > 1 ? 18 : 0,
          }}>
            {reports[0] && (
              <ReportCard
                key={reports[0].id || `${reports[0].week_starting || 'latest-report'}-latest`}
                report={reports[0]}
                childName={childName}
              />
            )}
{reports.length > 1 && (
              <section style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                marginTop: 8,
              }}>
                <p style={{
                  fontSize: 12.5,
                  fontWeight: 540,
                  color: T.ink3,
                  margin: '0 2px 6px',
                }}>
                  Previous reports
                </p>

                {reports.slice(1).map((report: any, index: number) => (
                  <PreviousReportDropdown
                    key={report.id || `${report.week_starting || 'previous-report'}-${index}`}
                    report={report}
                    childName={childName}
                  />
                ))}
              </section>
            )}
          </div>
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
