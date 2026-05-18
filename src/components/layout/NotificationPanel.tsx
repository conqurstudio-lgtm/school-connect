'use client'

import { X, Bell } from 'lucide-react'
import { formatFeedDate } from '@/lib/utils'
import type { Notification } from '@/lib/types'

interface NotificationPanelProps {
  notifications: Notification[]
  schoolName:    string
  schoolLogo?:   string
  onMarkRead:    (id: string) => void
  onClose:       () => void
}

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  white:  '#FFFFFF',
  bg:     '#FAFAFA',
}

function groupByTime(ns: Notification[]) {
  const now   = Date.now()
  const week  = 7  * 86400000
  const month = 30 * 86400000
  const last7: Notification[] = [], last30: Notification[] = [], older: Notification[] = []
  ns.forEach(n => {
    const age = now - new Date(n.created_at).getTime()
    if (age < week)       last7.push(n)
    else if (age < month) last30.push(n)
    else                  older.push(n)
  })
  return { last7, last30, older }
}

const TYPE_LABEL: Record<string, string> = {
  comment_reply:      'Replied to you',
  comment_liked:      'Liked your comment',
  comment_made_public:'Comment made public',
  new_post:           'New post',
}

export function NotificationPanel({
  notifications, schoolName, schoolLogo, onMarkRead, onClose,
}: NotificationPanelProps) {
  const { last7, last30, older } = groupByTime(notifications)

  const Card = ({ n }: { n: Notification }) => (
    <div style={{
      background: n.is_read ? T.bg : T.white,
      borderRadius: 12, border: `1px solid ${T.border}`,
      padding: '12px 14px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {/* School logo */}
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          overflow: 'hidden', background: '#EFEFEF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${T.border}`,
        }}>
          {schoolLogo
            ? <img src={schoolLogo} alt={schoolName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 13, fontWeight: 700, color: T.ink3 }}>{schoolName.charAt(0)}</span>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{schoolName}</span>
            <span style={{ fontSize: 11, color: T.ink3 }}>{formatFeedDate(n.created_at)}</span>
          </div>
          <p style={{ fontSize: 11, color: T.ink3, margin: '0 0 4px' }}>
            {TYPE_LABEL[n.type] ?? n.type}
          </p>
          <p style={{ fontSize: 13, color: T.ink2, margin: 0, lineHeight: 1.5 }}>
            {n.message}
          </p>
          {!n.is_read && (
            <button
              onClick={() => onMarkRead(n.id)}
              style={{
                marginTop: 8, fontSize: 12, fontWeight: 500, color: T.ink3,
                background: 'none', border: `1px solid ${T.border}`,
                borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Mark read
            </button>
          )}
        </div>

        {/* Unread dot */}
        {!n.is_read && (
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#E8281E', flexShrink: 0, marginTop: 4,
          }} />
        )}
      </div>
    </div>
  )

  const Section = ({ label, items }: { label: string; items: Notification[] }) => {
    if (!items.length) return null
    return (
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: T.ink3, textTransform: 'uppercase',
                    letterSpacing: '0.06em', margin: '0 0 10px' }}>
          {label}
        </p>
        {items.map(n => <Card key={n.id} n={n} />)}
      </div>
    )
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        padding: 0,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, margin: '0 auto',
          background: T.white, borderRadius: 20,
          border: `1px solid ${T.border}`,
          maxHeight: '85dvh', display: 'flex', flexDirection: 'column',
          animation: 'popUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 16px', borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em' }}>
            Notifications
          </span>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: '#F5F5F5', cursor: 'pointer', color: T.ink3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 16px 24px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <Bell style={{ width: 32, height: 32, color: '#DDDDDD', margin: '0 auto 12px', display: 'block' }} strokeWidth={1.4} />
              <p style={{ fontSize: 14, color: T.ink3, margin: 0 }}>No notifications yet</p>
            </div>
          ) : (
            <>
              <Section label="Last 7 days"  items={last7}  />
              <Section label="Last 30 days" items={last30} />
              <Section label="Older"        items={older}  />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
