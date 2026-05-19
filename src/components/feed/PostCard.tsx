'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Pencil, Trash2, MoreHorizontal, Download } from 'lucide-react'
import { formatFeedDate, formatEventDate, formatFileSize, getDocumentIcon } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { CommentThread } from '@/components/feed/CommentThread'
import { ImageCarousel } from '@/components/feed/ImageCarousel'
import { EventBlock }    from '@/components/feed/EventBlock'
import type { Post, ReactionType } from '@/lib/types'
import toast from 'react-hot-toast'

interface PostCardProps {
  index?:           number
  post:             Post
  isSchool:         boolean
  isOptimistic?:    boolean
  userId:           string
  schoolId:         string
  schoolName:       string
  schoolLogoUrl?:   string
  onReactionChange: (postId: string, type: ReactionType | null, prevType: ReactionType | null) => void
  onEditPost:       (post: Post) => void
  onPostDeleted:    (postId: string) => void
  onPinToggled:     (postId: string, pinned: boolean) => void
  canManagePost?:   boolean
  authorOverride?:  {
    id: string
    name: string
    photo_url: string | null
    grade?: string | null
    class_name?: string | null
  }
}

/* ─── Icons ─────────────────────────────────────────── */
const CHARCOAL = '#3D3D3D'

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 27.2s-1.1-.8-2.7-2C7.4 20.6 4.2 17 4.2 12.3c0-3.5 2.5-6.1 5.9-6.1 2.4 0 4.5 1.4 5.7 3.4 1.2-2 3.3-3.4 5.7-3.4 3.4 0 5.9 2.6 5.9 6.1 0 4.7-3.2 8.3-9.1 12.9-1.6 1.2-2.3 2-2.3 2Z"
        stroke={active ? '#FF3040' : CHARCOAL}
        fill={active ? '#FF3040' : 'none'}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'all 0.18s' }}
      />
    </svg>
  )
}

function IconThumb({ active }: { active: boolean }) {
  const c = active ? '#78A6FE' : CHARCOAL
  return (
    <svg width="26" height="26" viewBox="0 0 14 14" fill="none" aria-hidden
         stroke={c} strokeLinecap="round" strokeLinejoin="round"
         style={{ transition: 'all 0.18s' }}>
      {/* Thumb / finger area — fills blue when active */}
      <path d="M4.11253 11.3226H3.5V5.60118L6.51906 1.3041C6.7631 0.956742 7.16102 0.75 7.58554 0.75c0.79165 0 1.4005 0.69994 1.29083 1.48395l-0.22754 1.62676h1.99047c0.8702 0 2.6107 0.87023 2.6107 2.6107 0 1.74047 -1.75 5.72139 -3.60117 5.72139 -2.43666 0 -4.52102 -0.5801 -5.5363 -0.8702Z"
        strokeWidth="0.7" fill={active ? '#78A6FE' : 'none'} />
      {/* Base / wrist — always no fill, just stroke */}
      <path d="M0.75 5.375C0.75 4.61561 1.36561 4 2.125 4v0C2.88439 4 3.5 4.61561 3.5 5.375v5.75c0 0.7594 -0.61561 1.375 -1.375 1.375v0c-0.75939 0 -1.375 -0.6156 -1.375 -1.375v-5.75Z"
        strokeWidth="0.7" fill="none" />
    </svg>
  )
}

function IconComment({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7.2 18.2 4.2 20v-3.7A7.4 7.4 0 0 1 3 12.2C3 7.8 6.8 4.6 12 4.6s9 3.2 9 7.6-3.8 7.6-9 7.6c-1.8 0-3.4-.3-4.8-1.1Z"
        stroke={CHARCOAL} fill={active ? 'rgba(0,0,0,0.09)' : 'none'}
        strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'fill 0.18s' }}
      />
    </svg>
  )
}

const supabase = createClient()

export function PostCard({
  index = 99,
  post, isSchool, isOptimistic, userId, schoolId,
  schoolName, schoolLogoUrl,
  onReactionChange, onEditPost, onPostDeleted, onPinToggled,
  canManagePost = true, authorOverride,
}: PostCardProps) {
  const router = useRouter()

  // Detect if this is a teacher post and resolve teacher info from cache
  const isTeacherPost = post.posted_by_kind === 'teacher' && post.teacher_id
  const [teacherInfo, setTeacherInfo] = useState<{
    id: string; name: string; photo_url: string | null;
    grade: string; class_name: string | null
  } | null>(authorOverride ? {
    id: authorOverride.id,
    name: authorOverride.name,
    photo_url: authorOverride.photo_url,
    grade: authorOverride.grade || '',
    class_name: authorOverride.class_name || null,
  } : null)

  useEffect(() => {
    if (authorOverride) {
      setTeacherInfo({
        id: authorOverride.id,
        name: authorOverride.name,
        photo_url: authorOverride.photo_url,
        grade: authorOverride.grade || '',
        class_name: authorOverride.class_name || null,
      })
      return
    }
    if (!isTeacherPost) return
    try {
      const cached = sessionStorage.getItem('teachers-cache')
      if (cached) {
        const { teachers } = JSON.parse(cached)
        const t = teachers?.find((x: any) => x.id === post.teacher_id)
        if (t) setTeacherInfo(t)
      }
    } catch {}
  }, [isTeacherPost, post.teacher_id, authorOverride?.id])

  // Tap handler — saves feed scroll position and navigates to teacher profile
  const handleTeacherTap = () => {
    if (!teacherInfo) return
    try {
      sessionStorage.setItem('feed-scroll-y', String(window.scrollY))
    } catch {}
    router.push(`/teachers/${teacherInfo.id}`)
  }

  // Resolved display values
  const displayName = isTeacherPost && teacherInfo ? teacherInfo.name : schoolName
  const displayLogo = isTeacherPost && teacherInfo
    ? teacherInfo.photo_url
    : schoolLogoUrl
  const displayCls  = isTeacherPost && teacherInfo
    ? `${teacherInfo.grade}${teacherInfo.class_name ? ` · ${teacherInfo.class_name}` : ''}`
    : null

  const [myReaction,    setMyReaction]    = useState<ReactionType | null>((post.my_reaction as ReactionType) ?? null)
  const [showComments,  setShowComments]  = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)
  const [lightbox,      setLightbox]      = useState<string | null>(null)
  const [expanded,      setExpanded]      = useState(false)
  const submitting    = useRef(false)
  const reactionRef   = useRef<ReactionType | null>((post.my_reaction as ReactionType) ?? null)
  const [flyEmoji, setFlyEmoji] = useState<{ emoji: string; key: number } | null>(null)

  useEffect(() => {
    const r = (post.my_reaction as ReactionType) ?? null
    setMyReaction(r)
    reactionRef.current  = r
    submitting.current   = false   // always reset lock on post change
  }, [post.id, post.my_reaction, post.reaction_count])

  const handleReaction = async (type: ReactionType) => {
    if (submitting.current) return
    submitting.current = true

    const emojiMap: Record<string, string> = { love: '❤️', like: '👍', celebrate: '⭐' }
    const prev    = reactionRef.current          // always fresh — never stale
    const isSame  = prev === type
    const next    = isSame ? null : type
    const delta   = isSame ? -1 : prev === null ? 1 : 0

    // Optimistic update
    reactionRef.current = next
    setMyReaction(next)
    onReactionChange(post.id, next, prev)

    if (!isSame) {
      setFlyEmoji({ emoji: emojiMap[type], key: Date.now() })
      setTimeout(() => setFlyEmoji(null), 950)
    }

    try {
      if (isSame) {
        await supabase.from('reactions').delete().eq('post_id', post.id).eq('user_id', userId)
      } else if (prev !== null) {
        await supabase.from('reactions').update({ type }).eq('post_id', post.id).eq('user_id', userId)
      } else {
        await supabase.from('reactions').insert({ post_id: post.id, user_id: userId, school_id: schoolId, type })
      }
    } catch {
      // Rollback
      reactionRef.current = prev
      setMyReaction(prev)
      onReactionChange(post.id, prev, next)
      toast.error('Could not save reaction.')
    } finally {
      submitting.current = false
    }
  }

  const handlePin = async () => {
    setShowMenu(false)
    const next = !post.is_pinned
    await supabase.from('posts')
      .update({ is_pinned: next, pinned_at: next ? new Date().toISOString() : null })
      .eq('id', post.id)
    onPinToggled(post.id, next)
    toast.success(next ? 'Pinned' : 'Unpinned')
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    setShowMenu(false)
    await supabase.from('posts').delete().eq('id', post.id)
    onPostDeleted(post.id)
    toast.success('Deleted')
  }

  const TRUNCATE = 180
  const body     = post.body ?? ''
  const isTrunc  = body.length > TRUNCATE

  // Optimistic skeleton shimmer
  if (isOptimistic) {
    return (
      <article style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
                        backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite linear' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 10, width: '40%', borderRadius: 6, marginBottom: 8,
                          background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
                          backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite linear' }} />
            <div style={{ height: 10, width: '90%', borderRadius: 6, marginBottom: 6,
                          background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
                          backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite linear' }} />
            <div style={{ height: 10, width: '70%', borderRadius: 6,
                          background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
                          backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite linear' }} />
            {post.image_urls?.length > 0 && (
              <div style={{ height: 200, borderRadius: 16, marginTop: 12,
                            background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
                            backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite linear' }} />
            )}
          </div>
        </div>
      </article>
    )
  }

  const display  = (isTrunc && !expanded) ? body.slice(0, TRUNCATE).trimEnd() : body

  return (
    <>
      <article style={{ position: 'relative', marginBottom: 4 }}>

        {/* ── Header row: logo | name · time · menu ── */}
        <div style={{ display: 'flex', gap: 12, padding: '18px 20px 10px', alignItems: 'flex-start' }}>

          {/* Left column — logo + thread line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>

          {/* Avatar — school logo OR teacher photo, tappable if teacher */}
          <div
            onClick={isTeacherPost && teacherInfo ? handleTeacherTap : undefined}
            style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              overflow: 'hidden', background: '#EFEFEF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(0,0,0,0.06)',
              cursor: isTeacherPost && teacherInfo ? 'pointer' : 'default',
            }}>
            {displayLogo
              ? <img src={displayLogo} alt={displayName}
                     loading="eager" decoding="async"
                 style={{
                   width: '100%', height: '100%',
                   objectFit: isTeacherPost ? 'cover' : 'contain',
                 }} />
              : <span style={{ fontSize: 15, fontWeight: 700, color: '#888' }}>
                  {displayName.charAt(0)}
                </span>
            }
          </div>

          {/* Thread line — from logo down to reactions */}
          <div style={{
            width: 1,
            flex: 1,
            minHeight: 24,
            marginTop: 6,
            background: 'rgba(0,0,0,0.07)',
          }} />

          </div>{/* end left column */}

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
              <span
                onClick={isTeacherPost && teacherInfo ? handleTeacherTap : undefined}
                style={{
                  fontSize: 14, fontWeight: 500, color: '#1A1A1A',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  cursor: isTeacherPost && teacherInfo ? 'pointer' : 'default',
                }}>
                {displayName}
              </span>
              {post.is_pinned && <Pin style={{ width: 10, height: 10, color: '#B0B0B0', flexShrink: 0 }} />}
              <span style={{ fontSize: 12, color: '#B0B0B0', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {formatFeedDate(post.created_at)}
              </span>
              {isSchool && canManagePost !== false && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={() => setShowMenu(v => !v)} style={{
                    width: 24, height: 24, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#C8C8C8', borderRadius: 6,
                  }}>
                    <MoreHorizontal style={{ width: 14, height: 14 }} />
                  </button>
                  {showMenu && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 30 }}
                           onClick={() => setShowMenu(false)} />
                      <div style={{
                        position: 'absolute', right: 0, top: 28, width: 148,
                        background: '#fff', borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.07)',
                        boxShadow: '0 8px 28px rgba(0,0,0,0.1)',
                        zIndex: 40, padding: '5px 0',
                        animation: 'pop-in 0.16s cubic-bezier(0.34,1.56,0.64,1)',
                      }}>
                        <button onClick={handlePin} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 13px', background: 'none', border: 'none',
                          cursor: 'pointer', fontSize: 13, color: '#1A1A1A',
                          textAlign: 'left', fontFamily: 'inherit',
                        }}>
                          <Pin style={{ width: 13, height: 13, color: '#9A9A9A' }} />
                          {post.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button onClick={() => { setShowMenu(false); onEditPost(post) }} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 13px', background: 'none', border: 'none',
                          cursor: 'pointer', fontSize: 13, color: '#1A1A1A',
                          textAlign: 'left', fontFamily: 'inherit',
                        }}>
                          <Pencil style={{ width: 13, height: 13, color: '#9A9A9A' }} />
                          Edit
                        </button>
                        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '2px 10px' }} />
                        <button onClick={handleDelete} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 13px', background: 'none', border: 'none',
                          cursor: 'pointer', fontSize: 13, color: '#E8281E',
                          textAlign: 'left', fontFamily: 'inherit',
                        }}>
                          <Trash2 style={{ width: 13, height: 13 }} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Class subtitle — only on teacher posts */}
            {displayCls && (
              <p
                onClick={isTeacherPost && teacherInfo ? handleTeacherTap : undefined}
                style={{
                  fontSize: 11, fontWeight: 500, color: '#9A9A9A',
                  letterSpacing: '0.02em', margin: '1px 0 0',
                  cursor: isTeacherPost && teacherInfo ? 'pointer' : 'default',
                }}>
                {displayCls}
              </p>
            )}

            {/* Body text — directly under name */}
            {body && (
              <p style={{
                fontSize: 14, fontWeight: 400, lineHeight: 1.55,
                color: '#2A2A2A', margin: '4px 0 0',
              }}>
                {display}
                {isTrunc && !expanded && (
                  <> {'…'} <button onClick={() => setExpanded(true)} style={{
                    color: '#78A6FE', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, fontSize: 14, fontFamily: 'inherit',
                    fontWeight: 500,
                  }}>more</button></>
                )}
                {isTrunc && expanded && (
                  <> <button onClick={() => setExpanded(false)} style={{
                    color: '#9A9A9A', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, fontSize: 14, fontFamily: 'inherit',
                    fontWeight: 500,
                  }}>show less</button></>
                )}
              </p>
            )}
          </div>
        </div>

        {/* ── Event block with RSVP ── */}
        {post.type === 'event' && (
          <EventBlock
            post={post}
            userId={userId}
            schoolId={schoolId}
            isSchool={isSchool}
          />
        )}

        {/* ── Document block ── */}
        {post.type === 'document' && post.document_url && (
          <a href={post.document_url} target="_blank" rel="noopener noreferrer"
             download={post.document_name}
             style={{
               display: 'flex', alignItems: 'center', gap: 10,
               margin: '0 20px 10px', padding: '9px 12px',
               border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10,
               textDecoration: 'none',
             }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{getDocumentIcon(post.document_type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {post.document_name || 'Download'}
              </p>
              {post.document_size && (
                <p style={{ fontSize: 10, color: '#9A9A9A', margin: '2px 0 0' }}>
                  {formatFileSize(post.document_size)}
                </p>
              )}
            </div>
            <Download style={{ width: 13, height: 13, color: '#9A9A9A', flexShrink: 0 }} />
          </a>
        )}

        {/* ── Images ── */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div style={{ padding: '0 20px 0 70px', overflow: 'visible' }}>
            <ImageCarousel
              priority={index < 2}
              images={post.image_urls}
              onTap={setLightbox}
              flyEmoji={flyEmoji}
            />
          </div>
        )}

        {/* ── Reactions — always below image ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 20px 14px 20px',
        }}>
          {([
            { type: 'love' as ReactionType, Icon: IconHeart },
            { type: 'like' as ReactionType, Icon: IconThumb },
          ] as const).map(({ type, Icon }) => {
            const isActive = myReaction === type
            const typeCount = post.reaction_counts?.[type] ?? 0
            return (
              <button key={type} onClick={() => handleReaction(type)}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: 5,
                  padding: '6px 8px',
                  borderRadius: 999, border: 'none', background: 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <Icon active={isActive} />
                {typeCount > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 500,
                                 color: isActive ? '#1A1A1A' : '#6A6A6A',
                                 fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {typeCount}
                  </span>
                )}
              </button>
            )
          })}

          {/* Comment */}
          <button onClick={() => setShowComments(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 8px', borderRadius: 999, border: 'none',
              background: 'none', cursor: 'pointer',
            }}>
            <IconComment active={showComments} />
            {(post.comment_count ?? 0) > 0 && (
              <span style={{ fontSize: 13, fontWeight: 500, color: '#4A4A4A',
                             fontFamily: 'Inter, system-ui, sans-serif' }}>
                {post.comment_count}
              </span>
            )}
          </button>
        </div>

        {/* Comments thread */}
        {showComments && (
          <div style={{ margin: '0 20px 12px', borderRadius: 12,
                        overflow: 'hidden', background: 'rgba(0,0,0,0.025)' }}>
            <CommentThread
              postId={post.id} schoolId={schoolId}
              userId={userId} isSchool={isSchool}
            />
          </div>
        )}
      </article>

      {/* Post divider */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 0 8px' }} />

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox-backdrop" onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 20, right: 20,
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            fontSize: 32, lineHeight: 1, padding: 4,
          }}>×</button>
          <img src={lightbox} alt="" loading="eager" decoding="async" style={{
            maxWidth: '100%', maxHeight: '90dvh',
            objectFit: 'contain', borderRadius: 12,
          }} />
        </div>
      )}
    </>
  )
}
