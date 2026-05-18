// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  white:  '#FFFFFF',
}

type Filter = 'all' | 'moments' | 'updates' | 'events' | 'documents' | 'pinned'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'moments',   label: 'Moments' },
  { key: 'updates',   label: 'Updates' },
  { key: 'events',    label: 'Events' },
  { key: 'documents', label: 'Documents' },
  { key: 'pinned',    label: 'Pinned' },
]

interface Props {
  scope: 'school' | 'class'
}

export function TeacherFeed({ scope }: Props) {
  const [posts,    setPosts]   = useState<any[]>([])
  const [filter,   setFilter]  = useState<Filter>('all')
  const [loading,  setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/teacher/feed?scope=${scope}&filter=${filter}`)
      const json = await res.json()
      setPosts(json.posts ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [scope, filter])

  return (
    <div>
      {/* Filter bar */}
      <div style={{
        borderBottom: `1px solid rgba(0,0,0,0.06)`,
        marginTop: 4, marginBottom: 24,
      }}>
        <div style={{
          display: 'flex', overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          padding: '0 20px', gap: 28,
        }}>
          {FILTERS.map(({ key, label }) => {
            const isActive = key === filter
            return (
              <button key={key} onClick={() => setFilter(key)}
                style={{
                  position: 'relative',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: 42, padding: '0 14px',
                  background: 'none', border: 'none',
                  borderBottom: isActive ? '2px solid #1A1A1A' : '2px solid transparent',
                  marginBottom: -1,
                  color: isActive ? '#1A1A1A' : '#9A9A9A',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Posts list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%',
                        border: `2px solid ${T.border}`, borderTopColor: T.ink,
                        animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : posts.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: T.ink, fontWeight: 600,
                      margin: '0 0 6px', letterSpacing: '-0.005em' }}>
            {scope === 'school' ? 'No school posts yet' : 'No class posts yet'}
          </p>
          <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
            {scope === 'school'
              ? 'When your admin posts updates, they\'ll appear here.'
              : 'Tap the + button to share with your class.'}
          </p>
        </div>
      ) : (
        <div>
          {posts.map(post => <SimplePost key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}

// Simplified post card for the teacher view
function SimplePost({ post }: { post: any }) {
  return (
    <article style={{
      padding: '14px 20px',
      borderBottom: `1px solid rgba(0,0,0,0.05)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline',
                    justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: T.ink3,
                    letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
          {post.type || 'Update'}
        </p>
        <p style={{ fontSize: 12, color: T.ink3, margin: 0 }}>
          {relTime(post.created_at)}
        </p>
      </div>

      {post.body && (
        <p style={{ fontSize: 15, color: T.ink, margin: '0 0 10px',
                    lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {post.body}
        </p>
      )}

      {/* Images */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
          marginTop: 8,
        }}>
          {post.image_urls.map((url: string, i: number) => (
            <div key={i} style={{
              flex: '0 0 100%', height: 460,
              background: `#F0F0F2 url(${url}) center/cover`,
              scrollSnapAlign: 'center',
            }} />
          ))}
        </div>
      )}

      {/* Reaction counts */}
      {post.reaction_count > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 10,
                      fontSize: 12, color: T.ink3 }}>
          {Object.entries(post.reaction_counts || {}).map(([type, count]: any) => (
            <span key={type}>
              {type === 'love' ? '❤️' : type === 'like' ? '👍' : '👏'} {count}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)         return 'just now'
  if (min < 60)        return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24)         return `${hr}h`
  const d = Math.floor(hr / 24)
  if (d < 7)           return `${d}d`
  return new Date(iso).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}
