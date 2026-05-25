// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, GraduationCap } from 'lucide-react'

const T = {
  ink: '#262626',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  bg: '#FFFFFF',
  soft: '#F8F8F9',
  white: '#FFFFFF',
}

function getAverage(scores: any) {
  const values = Object.values(scores || {}).map(Number).filter(Number.isFinite)
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function scoreLabel(score: number) {
  if (score >= 4.5) return 'Excellent'
  if (score >= 3.5) return 'Very good'
  if (score >= 2.5) return 'Good'
  if (score >= 1.5) return 'Needs support'
  return 'Needs attention'
}

export default function ParentMagicReportPage() {
  const params = useParams<{ token: string }>()
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    let alive = true

    fetch(`/api/report/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async res => {
        const json = await res.json().catch(() => ({}))
        if (!alive) return

        if (!res.ok) {
          setError(json.error || 'Report not found')
          return
        }

        setData(json)
      })
      .catch(() => {
        if (alive) setError('Could not open this report')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => { alive = false }
  }, [token])

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: `2px solid ${T.border}`,
          borderTopColor: T.ink,
          animation: 'spin 0.7s linear infinite',
        }} />
      </main>
    )
  }

  if (error || !data?.report) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <GraduationCap size={30} color={T.ink3} />
          <h1 style={titleStyle}>Report unavailable</h1>
          <p style={textStyle}>{error || 'This private report link could not be opened.'}</p>
        </section>
      </main>
    )
  }

  const { report, child, teacher, school } = data
  const scores = report.scores || {}
  const average = getAverage(scores)

  return (
    <main style={{
      minHeight: '100dvh',
      background: T.bg,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      color: T.ink,
      padding: 'calc(18px + env(safe-area-inset-top, 0px)) 14px calc(24px + env(safe-area-inset-bottom, 0px))',
    }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <section style={{
          ...cardStyle,
          textAlign: 'center',
          marginBottom: 12,
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: school?.logo_url ? `url(${school.logo_url}) center/cover` : T.soft,
            border: `1px solid ${T.border}`,
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.ink3,
            fontWeight: 650,
          }}>
            {!school?.logo_url && (school?.name || 'S').charAt(0)}
          </div>

          <p style={{ fontSize: 12, color: T.ink3, margin: 0 }}>
            {school?.name || 'School Connect'}
          </p>

          <h1 style={{
            fontSize: 22,
            lineHeight: 1.1,
            fontWeight: 650,
            letterSpacing: '-0.04em',
            color: T.ink,
            margin: '6px 0 6px',
          }}>
            {child?.name || 'Your child'}'s weekly update
          </h1>

          <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>
            Week starting {report.week_starting}
          </p>
        </section>

        <section style={{
          ...cardStyle,
          textAlign: 'center',
          marginBottom: 12,
        }}>
          <div style={{
            width: 150,
            height: 150,
            borderRadius: '50%',
            margin: '0 auto 12px',
            border: `10px solid ${T.soft}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <strong style={{ fontSize: 34, fontWeight: 650, color: T.ink }}>
              {average.toFixed(1)}
            </strong>
            <span style={{ fontSize: 12, color: T.ink3 }}>/ 5</span>
          </div>

          <p style={{ fontSize: 15, fontWeight: 620, color: T.ink, margin: 0 }}>
            {scoreLabel(average)}
          </p>
        </section>

        <section style={{
          ...cardStyle,
          marginBottom: 12,
        }}>
          <h2 style={sectionTitleStyle}>Progress areas</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(scores).map(([name, score]: any) => (
              <div key={name} style={{
                padding: '11px 0',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <span style={{ fontSize: 13.5, color: T.ink2 }}>
                  {name}
                </span>
                <strong style={{ fontSize: 13.5, color: T.ink, fontWeight: 650 }}>
                  {Number(score).toFixed(1)}/5
                </strong>
              </div>
            ))}
          </div>
        </section>

        {report.comment && (
          <section style={{
            ...cardStyle,
            marginBottom: 12,
          }}>
            <h2 style={sectionTitleStyle}>Teacher note</h2>
            <p style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: T.ink2,
              margin: 0,
            }}>
              {report.comment}
            </p>
          </section>
        )}

        <section style={{
          padding: 14,
          borderRadius: 20,
          background: T.soft,
          border: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <CheckCircle2 size={18} color="#1F9D55" strokeWidth={1.8} style={{ marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 620, color: T.ink, margin: 0 }}>
              Private report link
            </p>
            <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.45, margin: '3px 0 0' }}>
              This page only opens with the private link sent by the school.
            </p>
          </div>
        </section>

        <p style={{
          fontSize: 11,
          color: '#C4C4C8',
          textAlign: 'center',
          margin: '18px 0 0',
          letterSpacing: '0.04em',
          fontWeight: 600,
        }}>
          Powered by School Connect
        </p>
      </div>
    </main>
  )
}

const pageStyle: any = {
  minHeight: '100dvh',
  background: T.bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
}

const cardStyle: any = {
  background: T.white,
  border: `1px solid ${T.border}`,
  borderRadius: 24,
  padding: 18,
  boxShadow: '0 12px 34px rgba(0,0,0,0.035)',
}

const titleStyle: any = {
  fontSize: 20,
  fontWeight: 650,
  color: T.ink,
  margin: '14px 0 6px',
}

const textStyle: any = {
  fontSize: 14,
  color: T.ink3,
  lineHeight: 1.5,
  margin: 0,
}

const sectionTitleStyle: any = {
  fontSize: 14,
  fontWeight: 650,
  color: T.ink,
  margin: '0 0 10px',
}
