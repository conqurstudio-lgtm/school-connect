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
function isReportWithinLastDays(report: any, days = 30) {
  const raw = report?.week_starting || report?.published_at || report?.created_at
  if (!raw) return false

  const time = new Date(raw).getTime()
  if (!Number.isFinite(time)) return false

  const age = Date.now() - time
  return age >= 0 && age <= days * 24 * 60 * 60 * 1000
}

function PreviousReportScoreRing({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(5, Number(value) || 0))
  const radius = 15.5
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(1, safeValue / 5))

  return (
    <span
      aria-label={`Score ${safeValue.toFixed(1)} out of 5`}
      style={{
        width: 38,
        height: 38,
        position: 'relative',
        flexShrink: 0,
        display: 'inline-grid',
        placeItems: 'center',
      }}
    >
      <svg viewBox="0 0 40 40" aria-hidden="true" style={{
        width: 38,
        height: 38,
        display: 'block',
      }}>
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="rgba(17,17,17,0.085)"
          strokeWidth="1.55"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#F4531F"
          strokeWidth="1.55"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 20 20)"
        />
      </svg>

      <span style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        color: '#45484D',
        fontSize: 10.4,
        fontWeight: 480,
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        {safeValue > 0 ? safeValue.toFixed(1) : '—'}
      </span>
    </span>
  )
}

function PreviousReportsCard({ reports, childName }: { reports: any[], childName: string }) {
  const [open, setOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const safeReports = Array.isArray(reports) ? reports.filter(Boolean) : []
  if (!safeReports.length) return null

  const visibleReports = showMore ? safeReports : safeReports.slice(0, 3)
  const hasMore = safeReports.length > 3

  return (
    <section
      className="sc-previous-reports-history-plain-v1"
      aria-label="Previous reports"
      style={{
        width: '100%',
        maxWidth: 370,
        margin: '0 auto',
        padding: '0',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          color: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '6px 0 9px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span style={{
          display: 'block',
          minWidth: 0,
          fontSize: 13.1,
          fontWeight: 480,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          color: '#1A1A1A',
        }}>
          Previous reports
        </span>

        <span style={{
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 560,
          color: '#5F6268',
          lineHeight: 1,
        }}>
          {open ? 'Hide' : 'View'}
        </span>
      </button>

      {open ? (
        <div
          style={{
            borderTop: '1px solid rgba(17,17,17,0.07)',
          }}
        >
          {visibleReports.map((report: any, index: number) => {
            const score = getReportScore(report)
            const scoreText = score > 0 ? `${score.toFixed(1)} / 5` : '—'
            const performance = getReportPerformance(score)

            return (
              <article
                key={report?.id || report?.token || report?.week_starting || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  padding: '11px 0',
                  borderBottom: '1px solid rgba(17,17,17,0.07)',
                }}
              >
                <span style={{
                  display: 'grid',
                  gap: 3,
                  minWidth: 0,
                }}>
                  <span style={{
                    color: '#1A1A1A',
                    fontSize: 12,
                    fontWeight: 480,
                    letterSpacing: '-0.015em',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {getReportDateLabel(report)}
                  </span>

                  <span style={{
                    color: '#8A8F96',
                    fontSize: 12.4,
                    fontWeight: 430,
                    lineHeight: 1.15,
                  }}>
                    {performance}
                  </span>
                </span>

                <PreviousReportScoreRing value={score} />
              </article>
            )
          })}

          {hasMore ? (
            <button
              type="button"
              onClick={() => setShowMore(value => !value)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                color: '#45484D',
                padding: '10px 0 2px',
                fontSize: 12.1,
                fontWeight: 480,
                fontFamily: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {showMore ? 'Show less' : `See more (${safeReports.length - 3})`}
            </button>
          ) : null}
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


function RecentMomentsHighlight({ token, onOpen }: { token: string, onOpen: () => void }) {
  const [loading, setLoading] = useState(true)
  const [moments, setMoments] = useState<any[]>([])
  const [activeMomentIndex, setActiveMomentIndex] = useState(0)

  useEffect(() => {
    let alive = true

    setLoading(true)

    fetch(`/api/parent/moments?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async res => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || 'Could not load moments')
        if (!alive) return

        setMoments(Array.isArray(json?.moments) ? json.moments.slice(0, 5) : [])
        setActiveMomentIndex(0)
      })
      .catch(() => {
        if (alive) setMoments([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [token])

  useEffect(() => {
    if (loading || moments.length <= 1) return

    const timer = window.setInterval(() => {
      setActiveMomentIndex(current => (current + 1) % moments.length)
    }, 6800)

    return () => window.clearInterval(timer)
  }, [loading, moments.length])

  if (!loading && moments.length === 0) return null

  const activeMoment = moments[activeMomentIndex] || moments[0] || null

  const image =
    activeMoment?.file_type === 'image'
      ? (activeMoment?.file_url || activeMoment?.image_url || activeMoment?.media_url || '')
      : ''

  const caption =
    activeMoment?.caption ||
    activeMoment?.message ||
    activeMoment?.text ||
    activeMoment?.title ||
    'See the latest classroom moments and activities.'

  return (
    <section
      aria-label="Moments highlight"
      style={{
        width: '100%',
        maxWidth: 370,
        margin: '22px auto 0',
        boxSizing: 'border-box',
      }}
    >
      <style jsx>{`
        @keyframes scMomentsImageFadeIn {
          from {
            opacity: 0.35;
            transform: scale(1.015);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          borderRadius: 26,
          overflow: 'hidden',
          background: '#FFFFFF',
          border: '1px solid rgba(17,17,17,0.055)',
          boxShadow: '0 10px 26px rgba(17,17,17,0.026)',
        }}
      >
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open moments"
          style={{
            width: '100%',
            border: 'none',
            background: loading ? '#F1F2F3' : '#F7F7F8',
            padding: 0,
            display: 'block',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          {loading ? (
            <span style={{
              display: 'block',
              height: 188,
              background: '#F1F2F3',
            }} />
          ) : image ? (
            <img
              key={activeMoment?.id || activeMomentIndex}
              src={image}
              alt=""
              style={{
                width: '100%',
                height: 188,
                objectFit: 'cover',
                objectPosition: 'center center',
                display: 'block',
                animation: 'scMomentsImageFadeIn 1200ms ease both',
              }}
            />
          ) : (
            <span style={{
              height: 188,
              display: 'grid',
              placeItems: 'center',
              fontSize: 34,
              background: '#F7F7F8',
              color: '#8A8F96',
            }}>
              ✨
            </span>
          )}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 13px 13px',
          background: '#FFFFFF',
        }}>
          <div style={{
            minWidth: 0,
            display: 'grid',
            gap: 4,
            flex: 1,
          }}>
            <p style={{
              margin: 0,
              color: '#1A1A1A',
              fontSize: 13,
              fontWeight: 520,
              letterSpacing: '-0.02em',
              lineHeight: 1.18,
            }}>
              Explore your child’s class life
            </p>

            <p style={{
              margin: 0,
              color: '#8A8F96',
              fontSize: 11.4,
              fontWeight: 380,
              lineHeight: 1.25,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}>
              {loading ? 'Loading the latest moment...' : caption}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            style={{
              border: 'none',
              borderRadius: 999,
              background: '#252525',
              color: '#FFFFFF',
              minHeight: 34,
              padding: '0 14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11.5,
              fontWeight: 560,
              letterSpacing: '-0.01em',
              lineHeight: 1,
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            View
          </button>
        </div>

        {!loading && moments.length > 1 ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 5,
            padding: '0 0 12px',
            background: '#FFFFFF',
          }}>
            {moments.slice(0, 5).map((moment: any, index: number) => (
              <span
                key={moment?.id || index}
                aria-hidden="true"
                style={{
                  width: index === activeMomentIndex ? 14 : 5,
                  height: 5,
                  borderRadius: 999,
                  background: index === activeMomentIndex ? '#252525' : 'rgba(17,17,17,0.14)',
                  transition: 'width 220ms ease, background 220ms ease',
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
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
            width: creating ? 86 : 42,
            height: 32,
            borderRadius: 999,
            border: 'none',
            background: '#252525',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: creating ? 'default' : 'pointer',
            opacity: 1,
            padding: 0,
            fontFamily: 'inherit',
            transition: 'width 180ms ease, opacity 180ms ease, transform 180ms ease',
          }}
        >
          {creating ? (
            <span style={{
              fontSize: 11.2,
              fontWeight: 560,
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}>
              Opening...
            </span>
          ) : (
            <Send size={16} strokeWidth={1.75} />
          )}
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

                {reports.length > 1 ? (
                  <div
                    className="sc-report-previous-history-wrap-v1"
                    style={{
                      margin: '10px 24px 0',
                      paddingBottom: 'calc(22px + env(safe-area-inset-bottom, 0px))',
                    }}
                  >
                    <PreviousReportsCard
                      reports={reports.slice(1).filter((report: any) => isReportWithinLastDays(report, 30))}
                      childName={childName}
                    />
                  </div>
                ) : null}
                <RecentMomentsHighlight token={token || ''} onOpen={openMomentsView} />



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
