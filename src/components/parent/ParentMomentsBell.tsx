'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type MomentItem = {
  id?: string | number
  _id?: string | number
  createdAt?: string
  updatedAt?: string
  timestamp?: string
  date?: string
}

type ParentMomentsBellProps = {
  token: string
  href?: string
  label?: string
}

function getMomentList(payload: unknown): MomentItem[] {
  if (Array.isArray(payload)) return payload as MomentItem[]

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const possibleLists = [
      record.moments,
      record.items,
      record.posts,
      record.data,
      record.results,
      record.notifications,
    ]

    for (const list of possibleLists) {
      if (Array.isArray(list)) return list as MomentItem[]
    }
  }

  return []
}

function getMomentMarker(moment: MomentItem, index: number) {
  return String(
    moment.updatedAt ||
      moment.createdAt ||
      moment.timestamp ||
      moment.date ||
      moment.id ||
      moment._id ||
      index,
  )
}

function getLatestMarker(moments: MomentItem[]) {
  if (!moments.length) return ''

  return moments
    .map((moment, index) => getMomentMarker(moment, index))
    .sort()
    .at(-1) || ''
}

export function ParentMomentsBell({
  token,
  href,
  label = 'Moments',
}: ParentMomentsBellProps) {
  const [latestMarker, setLatestMarker] = useState('')
  const [hasNewMoments, setHasNewMoments] = useState(false)

  const momentsHref = href || `/report/${encodeURIComponent(token)}?view=moments`
  const storageKey = useMemo(() => `school-connect-moments-last-seen-${token}`, [token])

  const refreshMoments = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch(`/api/parent/moments?token=${encodeURIComponent(token)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })

      if (!response.ok) return

      const payload = await response.json()
      const moments = getMomentList(payload)
      const newest = getLatestMarker(moments)

      setLatestMarker(newest)

      if (!newest) {
        setHasNewMoments(false)
        return
      }

      const lastSeen = window.localStorage.getItem(storageKey)
      setHasNewMoments(!lastSeen || newest > lastSeen)
    } catch {
      setHasNewMoments(false)
    }
  }, [storageKey, token])

  useEffect(() => {
    refreshMoments()
    const timer = window.setInterval(refreshMoments, 60000)
    return () => window.clearInterval(timer)
  }, [refreshMoments])

  function markMomentsAsSeen() {
    if (latestMarker) {
      window.localStorage.setItem(storageKey, latestMarker)
      setHasNewMoments(false)
    }
  }

  return (
    <Link
      href={momentsHref}
      aria-label={hasNewMoments ? 'New moments available' : label}
      title={hasNewMoments ? 'New moments available' : label}
      onClick={markMomentsAsSeen}
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        border: 'none',
        background: '#FFFFFF',
        color: '#21222D',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        textDecoration: 'none',
        boxShadow: 'none',
        boxSizing: 'border-box',
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M10.27 21a2 2 0 0 0 3.46 0" />
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      </svg>

      {hasNewMoments ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            width: 9,
            height: 9,
            borderRadius: 999,
            background: '#EF4444',
            border: '2px solid #FFFFFF',
            boxSizing: 'border-box',
          }}
        />
      ) : null}
    </Link>
  )
}
