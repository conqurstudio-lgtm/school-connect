// @ts-nocheck
'use client'
import { useRouter } from 'next/navigation'

import { useEffect, useState } from 'react'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ReportCard } from './ReportCard'
import { ReportSwiper } from './ReportSwiper'

const supabase = createClient()

// Light static skeleton — matches the feed skeleton style
function ReportLoadingSkeleton() {
  const cell = '#F0F0F2'
  return (
    <div style={{ opacity: 0.7, padding: '0 24px' }}>
      {/* Name + date */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 180, height: 22, background: cell, borderRadius: 6,
                      margin: '0 auto 10px' }} />
        <div style={{ width: 140, height: 11, background: cell, borderRadius: 4,
                      margin: '0 auto 36px' }} />
      </div>
      {/* Ring placeholder */}
      <div style={{ width: 200, height: 200, background: cell, borderRadius: '50%',
                    margin: '0 auto 24px' }} />
      {/* Label */}
      <div style={{ width: 110, height: 14, background: cell, borderRadius: 4,
                    margin: '0 auto 36px' }} />
      {/* Comment lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                    alignItems: 'center', marginBottom: 36 }}>
        <div style={{ width: '78%', height: 11, background: cell, borderRadius: 4 }} />
        <div style={{ width: '60%', height: 11, background: cell, borderRadius: 4 }} />
      </div>
      {/* Subjects bar */}
      <div style={{ width: '100%', height: 44, background: cell, borderRadius: 6 }} />
    </div>
  )
}

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.08)',
  bg:     '#FFFFFF',
  white:  '#FFFFFF',
}

export function ReportsClient() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [childName, setChildName] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }

      // Get my profile to know child name
      const { data: profile } = await supabase
        .from('profiles').select('child_name, role').eq('id', session.user.id).single()

      if (!profile || profile.role !== 'parent') {
        router.push('/feed'); return
      }
      setChildName(profile.child_name ?? 'Your child')

      // Fetch published reports
      const { data } = await supabase
        .from('child_reports')
        .select('*, teacher:teacher_id(full_name)')
        .eq('parent_id', session.user.id)
        .eq('status', 'published')
        .order('week_starting', { ascending: false })
        .limit(20)

      // Data comes newest-first. Reverse it so the array is OLDEST → NEWEST.
      // The swiper will start at the last (newest) slide; swiping right walks back in time.
      const newestFirst = data ?? []
      const oldestFirst = [...newestFirst].reverse()
      setReports(oldestFirst.map((r, i) => ({
        ...r,
        teacher_name:    r.teacher?.full_name,
        // previous = the slide BEFORE this one chronologically = i - 1 (older)
        previous_scores: i > 0 ? oldestFirst[i - 1].scores : null,
      })))
      setLoading(false)
    })
  }, [])

  return (
    <div className="slide-from-left" style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      display: 'flex', flexDirection: 'column',
      maxWidth: 520, margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Top bar */}
      {/* Minimal back nav */}
      <div style={{ padding: '20px 24px 0' }}>
        <button onClick={() => {
          try { sessionStorage.setItem('feed-left', '1') } catch {}
          window.history.back()
        }} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 500, color: T.ink3, fontFamily: 'inherit',
          padding: 0, letterSpacing: '-0.005em',
        }}>
          <ArrowLeft size={16} strokeWidth={1.8} />
          Back
        </button>
      </div>



      {/* Content */}
      <div style={{ flex: 1, paddingTop: 56 }}>
        {loading ? (
          <ReportLoadingSkeleton />
        ) : reports.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: '#F0F0F4', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={28} color={T.ink3} strokeWidth={1.4} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: T.ink,
                         letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              No reports yet
            </h2>
            <p style={{ fontSize: 13.5, color: T.ink3, margin: 0, lineHeight: 1.5,
                        maxWidth: 280, marginInline: 'auto' }}>
              Weekly reports from {childName}'s teachers will appear here every Friday.
            </p>
          </div>
        ) : (
          <ReportSwiper reports={reports} childName={childName} />
        )}

        {reports.length > 0 && (
          <div style={{ textAlign: 'center', padding: '24px 20px 40px' }}>
            <p style={{ fontSize: 11, color: '#CCCCCC', margin: 0,
                        letterSpacing: '0.04em', fontWeight: 500 }}>
              Powered by <span style={{ fontWeight: 600, color: '#AAAAAA' }}>School Connect</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
