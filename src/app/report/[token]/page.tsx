// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { ReportSwiper } from '@/components/reports/ReportSwiper'

const T = {
  ink: '#1A1A1A',
  ink3: '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg: '#FFFFFF',
  soft: '#F5F5F7',
  white: '#FFFFFF',
}

function LoadingState() {
  return (
    <main style={centerPage}>
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

        <p style={{ fontSize: 14, color: T.ink3, margin: 0 }}>
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
      display_position: index === 0 ? 'latest' : 'previous',
    }))

  return (
    <main style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      overscrollBehaviorX: 'none',
      background: T.bg,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: T.ink,
    }}>
      <div style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
      }}>
        <header style={{
          flexShrink: 0,
          padding: 'calc(14px + env(safe-area-inset-top, 0px)) 18px 12px',
          background: 'rgba(255,255,255,0.98)',
          position: 'relative',
          zIndex: 10,
        }}>
        <div style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 58,
          marginBottom: 2,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <iframe
            title="Weekly report header animation"
            src="https://lottie.host/embed/e470db9b-42fb-4a33-af38-29232edfef77/skj4jI35E9.lottie"
            style={{
              width: 88,
              height: 88,
              border: 'none',
              display: 'block',
              marginTop: -12,
              pointerEvents: 'none',
            }}
          />
        </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              background: school?.logo_url ? `url(${school.logo_url}) center/cover` : T.soft,
              border: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.ink3,
              fontSize: 13,
              fontWeight: 650,
              flexShrink: 0,
            }}>
              {!school?.logo_url && String(school?.name || 'S').slice(0, 1)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13.5,
                fontWeight: 620,
                color: T.ink,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.08,
              }}>
                {school?.name || 'School Connect'}
              </p>
              <p style={{ fontSize: 12, color: T.ink3, margin: '0', lineHeight: 1.1 }}>
                Weekly reports
              </p>
            </div>

          </div>
        </header>

        <section style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'none',
          padding: '18px 0 8px',
        }}>
          <ReportSwiper reports={reports} childName={childName} />
        </section>

        <footer style={{
          flexShrink: 0,
          padding: '9px 18px calc(14px + env(safe-area-inset-bottom, 0px))',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.98)',
        }}>
          <p style={{
            fontSize: 11,
            color: '#CCCCCC',
            margin: 0,
            letterSpacing: '0.04em',
            fontWeight: 500,
          }}>
            Powered by <span style={{ fontWeight: 600, color: '#AAAAAA' }}>School Connect</span>
          </p>
        </footer>
      </div>
    </main>
  )
}

const centerPage: any = {
  minHeight: '100dvh',
  height: '100dvh',
  overflow: 'hidden',
  background: T.bg,
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
  boxShadow: '0 18px 48px rgba(0,0,0,0.04)',
}
