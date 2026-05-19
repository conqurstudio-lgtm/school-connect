// @ts-nocheck
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { ReportSwiper } from './ReportSwiper'

function ReportLoadingSkeleton() {
  const cell = '#F0F0F2'
  return (
    <div style={{ opacity: 0.7, padding: '0 24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 180, height: 22, background: cell, borderRadius: 6,
                      margin: '0 auto 10px' }} />
        <div style={{ width: 140, height: 11, background: cell, borderRadius: 4,
                      margin: '0 auto 36px' }} />
      </div>
      <div style={{ width: 200, height: 200, background: cell, borderRadius: '50%',
                    margin: '0 auto 24px' }} />
      <div style={{ width: 110, height: 14, background: cell, borderRadius: 4,
                    margin: '0 auto 36px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                    alignItems: 'center', marginBottom: 36 }}>
        <div style={{ width: '78%', height: 11, background: cell, borderRadius: 4 }} />
        <div style={{ width: '60%', height: 11, background: cell, borderRadius: 4 }} />
      </div>
      <div style={{ width: '100%', height: 44, background: cell, borderRadius: 6 }} />
    </div>
  )
}

const T = {
  ink:    '#1A1A1A',
  ink3:   '#9A9A9A',
}

export function ReportsClient() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [childName, setChildName] = useState('Your child')

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const res = await fetch('/api/parent/reports', { cache: 'no-store' })

        if (res.status === 401) {
          window.location.href = '/auth/login'
          return
        }

        if (res.status === 403) {
          router.push('/feed')
          return
        }

        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Could not load reports')

        if (!alive) return
        setReports(json.reports ?? [])
        setChildName(json.child_name ?? 'Your child')
      } catch {
        if (!alive) return
        setReports([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => { alive = false }
  }, [router])

  return (
    <div className="slide-from-left" style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 520,
      margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{ padding: '20px 24px 0' }}>
        <button onClick={() => {
          try { sessionStorage.setItem('feed-left', '1') } catch {}
          window.history.back()
        }} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          color: T.ink3,
          fontFamily: 'inherit',
          padding: 0,
          letterSpacing: '-0.005em',
        }}>
          <ArrowLeft size={16} strokeWidth={1.8} />
          Back
        </button>
      </div>

      <div style={{ flex: 1, paddingTop: 56 }}>
        {loading ? (
          <ReportLoadingSkeleton />
        ) : reports.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#F0F0F4',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GraduationCap size={28} color={T.ink3} strokeWidth={1.4} />
            </div>
            <h2 style={{
              fontSize: 16,
              fontWeight: 600,
              color: T.ink,
              letterSpacing: '-0.02em',
              margin: '0 0 6px',
            }}>
              No reports yet
            </h2>
            <p style={{
              fontSize: 13.5,
              color: T.ink3,
              margin: 0,
              lineHeight: 1.5,
              maxWidth: 280,
              marginInline: 'auto',
            }}>
              Weekly reports from {childName}'s teacher will appear here.
            </p>
          </div>
        ) : (
          <ReportSwiper reports={reports} childName={childName} />
        )}

        {reports.length > 0 && (
          <div style={{ textAlign: 'center', padding: '24px 20px 40px' }}>
            <p style={{
              fontSize: 11,
              color: '#CCCCCC',
              margin: 0,
              letterSpacing: '0.04em',
              fontWeight: 500,
            }}>
              Powered by <span style={{ fontWeight: 600, color: '#AAAAAA' }}>School Connect</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
