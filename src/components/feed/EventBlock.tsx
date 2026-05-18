// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, MapPin, Users, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatEventDate } from '@/lib/utils'
import type { Post, RSVPStatus, RSVP } from '@/lib/types'

interface EventBlockProps {
  post:     Post
  userId:   string
  schoolId: string
  isSchool: boolean
}

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#F7F7F7',
  white:  '#FFFFFF',
  green:  '#22C55E',
}

export function EventBlock({ post, userId, schoolId, isSchool }: EventBlockProps) {
  const [myRsvp,        setMyRsvp]        = useState<RSVPStatus | null>(null)
  const [goingCount,    setGoingCount]    = useState(0)
  const [attendees,     setAttendees]     = useState<RSVP[]>([])
  const [showAttendees, setShowAttendees] = useState(false)
  const [submitting,    setSubmitting]    = useState(false)

  const fetchRsvps = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('event_rsvps')
        .select('*, profile:profiles(id, full_name, child_name, child_grade, child_class)')
        .eq('post_id', post.id)
      if (!data) return
      setMyRsvp(data.find(r => r.profile_id === userId)?.status ?? null)
      setGoingCount(data.filter(r => r.status === 'going').length)
      setAttendees(data as RSVP[])
    } catch {}
  }, [post.id, userId])

  useEffect(() => { fetchRsvps() }, [fetchRsvps])

  const handleRsvp = async () => {
    if (submitting) return
    setSubmitting(true)
    if (myRsvp === 'going') {
      setMyRsvp(null)
      setGoingCount(c => Math.max(0, c - 1))
      await supabase.from('event_rsvps').delete()
        .eq('post_id', post.id).eq('profile_id', userId)
    } else {
      setMyRsvp('going')
      setGoingCount(c => c + 1)
      await supabase.from('event_rsvps').upsert({
        post_id: post.id, school_id: schoolId,
        profile_id: userId, status: 'going',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'post_id,profile_id' })
    }
    setSubmitting(false)
    fetchRsvps()
  }

  const isGoing = myRsvp === 'going'

  return (
    <>
      {/* Event details card — aligned with text */}
      <div style={{
        margin: '0 20px 10px 70px',
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {post.event_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <CalendarDays style={{ width: 12, height: 12, color: T.ink3, flexShrink: 0 }} strokeWidth={1.5} />
              <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>
                {formatEventDate(post.event_date, post.event_time)}
              </span>
            </div>
          )}
          {post.event_location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MapPin style={{ width: 12, height: 12, color: T.ink3, flexShrink: 0 }} strokeWidth={1.5} />
              <span style={{ fontSize: 13, color: T.ink2 }}>{post.event_location}</span>
            </div>
          )}
          {goingCount > 0 && (
            <button onClick={() => isSchool && setShowAttendees(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', padding: 0,
              cursor: isSchool ? 'pointer' : 'default', fontFamily: 'inherit',
            }}>
              <Users style={{ width: 12, height: 12, color: T.ink3 }} strokeWidth={1.5} />
              <span style={{ fontSize: 12, color: T.ink3 }}>
                {goingCount} going
              </span>
            </button>
          )}
        </div>

        {/* Going button — bottom right corner of card */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
        }}>
          <button onClick={handleRsvp} disabled={submitting} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20,
            border: `1px solid ${isGoing ? T.green : T.border}`,
            background: isGoing ? '#F0FFF4' : T.white,
            color: isGoing ? T.green : T.ink3,
            fontSize: 12, fontWeight: isGoing ? 600 : 500,
            cursor: submitting ? 'wait' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            <Check style={{ width: 12, height: 12 }} strokeWidth={isGoing ? 2.5 : 1.8} />
            {isGoing ? 'Going' : 'Going?'}
          </button>
        </div>
      </div>

      {/* Attendee list — school only */}
      {isSchool && showAttendees && attendees.length > 0 && (
        <div style={{
          margin: '0 20px 10px 70px', borderRadius: 12,
          border: `1px solid ${T.border}`, overflow: 'hidden',
        }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: T.ink3, textTransform: 'uppercase',
            letterSpacing: '0.06em', margin: 0, padding: '8px 12px 4px',
          }}>
            Going ({goingCount})
          </p>
          {attendees.filter(r => r.status === 'going').map(r => (
            <div key={r.id} style={{
              display: 'flex', flexDirection: 'column',
              padding: '7px 12px', borderTop: `1px solid ${T.border}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>
                {r.profile?.full_name ?? 'Parent'}
              </span>
              {r.profile?.child_name && (
                <span style={{ fontSize: 11, color: T.ink3 }}>
                  {r.profile.child_name}
                  {r.profile.child_grade ? ` · ${r.profile.child_grade}` : ''}
                  {r.profile.child_class ? ` ${r.profile.child_class}` : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
