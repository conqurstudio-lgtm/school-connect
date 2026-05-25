'use client'
// mirror-teacher-class-life-layout-v1
// One class-life post layout. Teacher sees it. Parent sees the same layout.

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const T = {
  ink: '#262626',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  white: '#FFFFFF',
  soft: '#F8F8F9',
  primary: '#2B2B2F',
  red: '#B42318',
}

function relTime(input?: string) {
  if (!input) return ''
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return ''

  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function reactionTotalFrom(counts: any) {
  return Object.values(counts || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0)
}

export function UnifiedClassLifePostCard({
  post,
  canDelete = false,
  onDelete,
  canReact = false,
  schoolId,
}: any) {
  const [openImage, setOpenImage] = useState<string | null>(null)
  const [reacting, setReacting] = useState(false)

  const initialCounts = post.reaction_counts || {}
  const [myReaction, setMyReaction] = useState<string | null>(post.my_reaction || null)
  const [reactionCounts, setReactionCounts] = useState<any>({
    love: Number(initialCounts.love || 0),
    like: Number(initialCounts.like || 0),
    celebrate: Number(initialCounts.celebrate || 0),
  })

  const images = Array.isArray(post.image_urls)
    ? post.image_urls
    : post.image_url
      ? [post.image_url]
      : []

  const typeLabel =
    post.type === 'event' ? 'Event'
    : post.type === 'moment' ? 'Moment'
    : post.type === 'document' ? 'Document'
    : 'Update'

  const totalReactions = reactionTotalFrom(reactionCounts)

  const buildCounts = (nextReaction: string | null, previousReaction: string | null, baseCounts = reactionCounts) => {
    const nextCounts = { ...baseCounts }

    if (previousReaction && nextCounts[previousReaction] > 0) {
      nextCounts[previousReaction] = nextCounts[previousReaction] - 1
    }

    if (nextReaction) {
      nextCounts[nextReaction] = Number(nextCounts[nextReaction] || 0) + 1
    }

    return nextCounts
  }

  const applyReactionState = (nextReaction: string | null, nextCounts: any) => {
    setMyReaction(nextReaction)
    setReactionCounts(nextCounts)
  }

  const handleReaction = async (type: 'love' | 'like' | 'celebrate') => {
    if (!canReact || reacting) return

    const previousReaction = myReaction
    const previousCounts = { ...reactionCounts }
    const nextReaction = previousReaction === type ? null : type
    const nextCounts = buildCounts(nextReaction, previousReaction, previousCounts)

    setReacting(true)
    applyReactionState(nextReaction, nextCounts)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user

      if (!user?.id) {
        throw new Error('Please sign in again.')
      }

      const { data: existing, error: existingError } = await supabase
        .from('reactions')
        .select('id,type')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingError) throw existingError

      if (!nextReaction) {
        if (existing?.id) {
          const { error } = await supabase
            .from('reactions')
            .delete()
            .eq('id', existing.id)

          if (error) throw error
        }
      } else if (existing?.id) {
        const { error } = await supabase
          .from('reactions')
          .update({ type: nextReaction })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('reactions')
          .insert({
            post_id: post.id,
            user_id: user.id,
            school_id: post.school_id || schoolId,
            type: nextReaction,
          })

        if (error) throw error
      }
    } catch (error: any) {
      applyReactionState(previousReaction, previousCounts)
      toast.error(error?.message || 'Could not save reaction.')
    } finally {
      setReacting(false)
    }
  }

  const reactionButton = (type: 'love' | 'like' | 'celebrate', label: string, icon: string) => {
    const active = myReaction === type
    const count = Number(reactionCounts[type] || 0)

    return (
      <button
        type="button"
        onClick={() => handleReaction(type)}
        disabled={reacting}
        aria-pressed={active}
        style={{
          height: 31,
          padding: '0 9px',
          borderRadius: 999,
          border: 'none',
          background: active ? T.primary : T.soft,
          color: active ? T.white : T.ink2,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          fontSize: 12.4,
          fontWeight: 580,
          fontFamily: 'inherit',
          cursor: reacting ? 'wait' : 'pointer',
        }}
      >
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
        {count > 0 && (
          <span style={{ opacity: active ? 0.92 : 0.72 }}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      <article style={{
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        overflow: 'visible',
        boxShadow: 'none',
      }}>
        <div style={{ padding: '0 0 10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: post.body || post.event_date || images.length ? 8 : 0,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 24,
                padding: '0 9px',
                borderRadius: 999,
                background: T.soft,
                color: T.ink2,
                fontSize: 12.8,
                fontWeight: 620,
                whiteSpace: 'nowrap',
              }}>
                {typeLabel}
              </span>

              <span style={{
                fontSize: 12.8,
                color: T.ink3,
                whiteSpace: 'nowrap',
              }}>
                {relTime(post.created_at || post.published_at)}
              </span>
            </div>

            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete post"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: 'none',
                  background: T.soft,
                  color: T.red,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={13} strokeWidth={1.9} />
              </button>
            )}
          </div>

          {post.body && (
            <p style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: T.ink,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {post.body}
            </p>
          )}

          {post.type === 'event' && (post.event_date || post.event_time || post.event_location) && (
            <div style={{
              marginTop: 9,
              padding: '10px 12px',
              borderRadius: 14,
              background: T.soft,
              fontSize: 13,
              color: T.ink2,
              lineHeight: 1.5,
            }}>
              {post.event_date && <div>Date: {post.event_date}</div>}
              {post.event_time && <div>Time: {post.event_time}</div>}
              {post.event_location && <div>Place: {post.event_location}</div>}
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div style={{
            display: 'grid',
            gap: 6,
            padding: '0 0 10px',
          }}>
            {images.slice(0, 4).map((url: string, i: number) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => setOpenImage(url)}
                aria-label="Open image"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 0,
                  margin: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'zoom-in',
                  fontFamily: 'inherit',
                  lineHeight: 0,
                }}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  style={{
                    width: '100%',
                    maxHeight: 260,
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: 13,
                    background: T.soft,
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {(canReact || totalReactions > 0) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '0 0 2px',
            flexWrap: 'wrap',
          }}>
            {canReact ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}>
                {reactionButton('love', 'Love', '♡')}
                {reactionButton('like', 'Like', '👍')}
                {reactionButton('celebrate', 'Celebrate', '⭐')}
              </div>
            ) : totalReactions > 0 ? (
              <span style={{
                color: T.ink3,
                fontSize: 12.4,
                fontWeight: 580,
              }}>
                {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
              </span>
            ) : null}

            {canReact && totalReactions > 0 && (
              <span style={{
                color: T.ink3,
                fontSize: 12.4,
                fontWeight: 580,
                whiteSpace: 'nowrap',
              }}>
                {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
              </span>
            )}
          </div>
        )}
      </article>

      {openImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            width: '100vw',
            height: '100dvh',
            minHeight: '100svh',
            background: '#101114',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px)',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            aria-label="Close image"
            onClick={(event) => {
              event.stopPropagation()
              setOpenImage(null)
            }}
            style={{
              position: 'fixed',
              top: 'calc(12px + env(safe-area-inset-top, 0px))',
              right: 12,
              zIndex: 10000,
              width: 36,
              height: 36,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(0,0,0,0.45)',
              color: '#FFFFFF',
              fontSize: 22,
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ×
          </button>

          <img
            src={openImage}
            alt=""
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      )}
    </>
  )
}
