// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, FileText, Heart, Smile, ThumbsUp, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { SCEmptyState, SCTopBar, SCIconButton } from '@/components/ui'
import SCStartupLoader from '@/components/ui/SCStartupLoader'

const T = {
  ink: '#252525',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.045)',
  bg: '#FFFFFF',
  soft: '#F7F7F8',
  accent: '#717171',
  accentSoft: '#F5F5F5',
  white: '#FFFFFF',
}

function initials(name?: string) {
  return String(name || '?')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatShortDate(value?: string) {
  if (!value) return ''

  try {
    return new Date(value).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function parentMomentsCacheKey(token: string) {
  return `school-connect:parent-moments:${token}:v1`
}

function formatTimeAgo(value?: string) {
  if (!value) return ''

  const then = new Date(value).getTime()
  if (!Number.isFinite(then)) return ''

  const diff = Math.max(0, Date.now() - then)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (diff < minute) return 'now'
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < week) return `${Math.floor(diff / day)}d ago`

  return new Date(value).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  })
}


function SafeStyle() {
  return (
    <style>{`
      html,
      body {
        background: #FFFFFF !important;
        overflow: hidden;
      }

      @keyframes momentDotBounce {
        0%, 80%, 100% { transform: scale(0.72); opacity: 0.45; }
        40% { transform: scale(1); opacity: 1; }
      }

      @keyframes parentMomentReactionFly {
        0% {
          transform: translate(-50%, 16px) scale(0.65) rotate(-8deg);
          opacity: 0;
        }
        14% {
          transform: translate(-50%, 0) scale(1.12) rotate(5deg);
          opacity: 1;
        }
        58% {
          transform: translate(-50%, -46px) scale(1.22) rotate(-3deg);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -78px) scale(0.92) rotate(3deg);
          opacity: 0;
        }
      }


      @keyframes scMomentImageGhost {
        0% { background-position: 120% 0; }
        100% { background-position: -120% 0; }
      }
    `}</style>
  )
}

function LoadingDots() {
  const ghost = (width: string | number, height = 12, radius = 999) => (
    <span
      style={{
        width,
        height,
        borderRadius: radius,
        display: 'block',
        background: 'linear-gradient(90deg, #F1F2F3 0%, #FAFAFA 48%, #F1F2F3 100%)',
        backgroundSize: '220% 100%',
        animation: 'scMomentGhost 1.35s ease-in-out infinite',
      }}
    />
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      padding: '4px 0 10px',
    }}>
      <style>{`
        @keyframes scMomentGhost {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
      `}</style>

      {[0, 1, 2].map((item) => (
        <div key={item} style={{ width: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}>
            {ghost(38, 38, 999)}
            <div style={{ flex: 1 }}>
              {ghost('44%', 12)}
              <div style={{ height: 7 }} />
              {ghost('28%', 9)}
            </div>
          </div>

          {ghost('100%', 220, 22)}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 12,
          }}>
            {ghost(28, 28, 999)}
            {ghost(28, 28, 999)}
            {ghost(28, 28, 999)}
          </div>
        </div>
      ))}
    </div>
  )
}


function reactionEmoji(reaction: string) {
  if (reaction === 'heart') return '❤️'
  if (reaction === 'like') return '👍'
  if (reaction === 'smile') return '😊'
  return '✨'
}

function reactionTone(reaction: string) {
  if (reaction === 'heart') return '#E25563'
  if (reaction === 'like') return '#3B82F6'
  if (reaction === 'smile') return '#F59E0B'
  return T.ink
}


function parentMomentScope(moment: any): 'child' | 'class' {
  const raw = String(
    moment?.moment_scope ||
    moment?.scope ||
    moment?.audience ||
    moment?.target ||
    moment?.share_mode ||
    ''
  ).trim().toLowerCase()

  if (
    moment?.is_class_moment === true ||
    ['all', 'class', 'classroom', 'whole_class', 'whole-class', 'everyone', 'all_parents', 'all-parents'].includes(raw)
  ) {
    return 'class'
  }

  if (
    moment?.is_child_moment === true ||
    ['child', 'learner', 'student', 'selected', 'private', 'direct', 'individual', 'specific'].includes(raw)
  ) {
    return 'child'
  }

  // Older saved class posts may not have share_mode populated. If the API sends
  // a recipient count and it clearly went to more than one learner, treat it as class.
  const recipientCount = Number(moment?.recipient_count || moment?.recipients_count || 0)
  if (recipientCount > 1) return 'class'

  return 'child'
}

function ReactionBurstLayer({ bursts = [] }: any) {
  if (!bursts.length) return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 6,
      overflow: 'hidden',
      borderRadius: 22,
    }}>
      {bursts.map((burst: any, index: number) => (
        <span
          key={burst.id}
          style={{
            position: 'absolute',
            left: `${50 + ((index % 3) - 1) * 9}%`,
            top: '58%',
            fontSize: 34,
            lineHeight: 1,
            filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.16))',
            animation: 'parentMomentReactionFly 820ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {reactionEmoji(burst.reaction)}
        </span>
      ))}
    </div>
  )
}

// child-class-tabs-v420
// child-class-scope-fix-v421
// recent-default-v424
export function ParentMomentsPage({ token, embedded = false, onClose }: { token: string, embedded?: boolean, onClose?: () => void }) {
  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<any>(null)
  const [moments, setMoments] = useState<any[]>([])
  const [momentScope, setMomentScope] = useState<'recent' | 'child' | 'class'>('recent')
  const [openImage, setOpenImage] = useState('')
  const [reacting, setReacting] = useState('')
  const [reactionBursts, setReactionBursts] = useState<any[]>([])
  // parent-moments-progressive-v425
  const [renderLimit, setRenderLimit] = useState(6)
  const [momentsView, setMomentsView] = useState<'recent' | 'child' | 'class'>('recent')

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true)

    try {
      const res = await fetch(`/api/parent/moments?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(json.error || 'Could not load Moments')

      const nextChild = json.child
      const nextMoments = json.moments || []

      setChild(nextChild)
      setMoments(nextMoments)

      try {
        window.localStorage.setItem(parentMomentsCacheKey(token), JSON.stringify({
          child: nextChild,
          moments: nextMoments,
          saved_at: new Date().toISOString(),
        }))
      } catch {}
    } catch (error: any) {
      if (!quiet) toast.error(error.message || 'Could not load Moments')
    }

    setLoading(false)
  }

  useEffect(() => {
    let usedCache = false

    try {
      const raw = window.localStorage.getItem(parentMomentsCacheKey(token))
      if (raw) {
        const cached = JSON.parse(raw)
        if (cached?.moments) {
          setChild(cached.child || null)
          setMoments(cached.moments || [])
          setLoading(false)
          usedCache = true
        }
      }
    } catch {}

    load(usedCache)
  }, [token])


  const addReactionBurst = (momentId: string, reaction: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`

    setReactionBursts(current => [
      ...current,
      { id, momentId, reaction },
    ])

    window.setTimeout(() => {
      setReactionBursts(current => current.filter(item => item.id !== id))
    }, 900)
  }

  const react = async (moment: any, reaction: string) => {
    const previousMomentsSnapshot = moments

    addReactionBurst(moment.id, reaction)

    setMoments(current => current.map(item => {
      if (item.id !== moment.id) return item

      const previousReaction = item.reaction || null
      const nextCounts: any = {
        heart: Number(item.reaction_counts?.heart || 0),
        like: Number(item.reaction_counts?.like || 0),
        smile: Number(item.reaction_counts?.smile || 0),
      }

      if (previousReaction && previousReaction !== reaction && nextCounts[previousReaction] !== undefined) {
        nextCounts[previousReaction] = Math.max(0, Number(nextCounts[previousReaction] || 0) - 1)
      }

      if (!previousReaction || previousReaction !== reaction) {
        nextCounts[reaction] = Number(nextCounts[reaction] || 0) + 1
      }

      const reactionTotal = Number(nextCounts.heart || 0) +
        Number(nextCounts.like || 0) +
        Number(nextCounts.smile || 0)

      return {
        ...item,
        reaction,
        reaction_counts: nextCounts,
        reaction_count: reactionTotal,
      }
    }))

    setReacting(moment.id)

    try {
      const res = await fetch('/api/parent/moments/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, child_id: child?.id, moment_id: moment.id, reaction }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not react')
    } catch (error: any) {
      setMoments(previousMomentsSnapshot)
      toast.error(error.message || 'Could not react')
    }

    setReacting('')
  }



  const childMoments = moments.filter((moment: any) => parentMomentScope(moment) === 'child')
  const classMoments = moments.filter((moment: any) => parentMomentScope(moment) === 'class')
  const visibleMoments = momentScope === 'recent' ? moments : (momentScope === 'child' ? childMoments : classMoments)

  const renderedMoments = visibleMoments.slice(0, renderLimit)

  useEffect(() => {
    setRenderLimit(6)
  }, [momentScope, moments.length])

  useEffect(() => {
    if (renderLimit >= visibleMoments.length) return

    const timer = window.setTimeout(() => {
      setRenderLimit((current) => Math.min(current + 3, visibleMoments.length))
    }, 160)

    return () => window.clearTimeout(timer)
  }, [renderLimit, visibleMoments.length, momentScope])

  return (
    <main className="sc-screen-enter" style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: T.bg,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      color: T.ink,
      overscrollBehavior: 'none',
    }}>
      <SafeStyle />

      <SCStartupLoader
        show={loading && moments.length === 0}
        initials={initials(child?.name || child?.full_name || 'SC')}
      />

      <div style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
      }}>
        <SCTopBar
          title="Moments"
          align="left"
          compact
          left={
            embedded ? (
              <SCIconButton label="Back" onClick={onClose} tone="quiet" size={38}>
                <ArrowLeft size={19} strokeWidth={2.05} />
              </SCIconButton>
            ) : (
              <a
                href={`/report/${token}`}
                aria-label="Back to report"
                className="sc-icon-button"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: 'none',
                  background: 'transparent',
                  color: T.ink,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <ArrowLeft size={19} strokeWidth={2.05} />
              </a>
            )
          }
        />

        <section style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '12px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
          background: T.bg,
        }}>
          {true && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              margin: '0 0 22px 56px',
              borderBottom: `1px solid ${T.border}`,
            }}>
              {[
                ['recent', 'Recent'],
                ['child', 'Child'],
                ['class', 'Class'],
              ].map(([key, label]: any) => {
                const active = momentScope === key

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMomentScope(key)}
                    style={{
                      position: 'relative',
                      border: 'none',
                      background: 'transparent',
                      color: active ? T.ink : T.ink3,
                      fontSize: 13.2,
                      fontWeight: active ? 620 : 560,
                      padding: '0 0 10px',
                      margin: 0,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      lineHeight: 1,
                    }}
                  >
                    {label}
                    {active && (
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: -1,
                        height: 2,
                        borderRadius: 999,
                        background: T.ink,
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {moments.length === 0 ? (
            <SCEmptyState
              title={loading ? 'Loading Moments' : 'No Moments yet'}
              text={loading ? 'Getting the latest updates.' : 'Teacher Moments will appear here.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {renderedMoments.map((moment, index) => (
                <MomentPost
                  key={moment.id}
                  moment={moment}
                  isLast={index === renderedMoments.length - 1}
                  onImage={setOpenImage}
                  onReact={react}
                  reacting={reacting === moment.id}
                  imageIndex={index}
                  bursts={reactionBursts.filter(item => item.momentId === moment.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {openImage && createPortal(
        <div
          data-moments-fullscreen-lightbox-v427="true"
          onClick={() => setOpenImage('')}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483000,
            width: '100vw',
            height: '100dvh',
            background: 'rgba(2, 6, 23, 0.94)',
            backdropFilter: 'blur(7px)',
            WebkitBackdropFilter: 'blur(7px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'calc(18px + env(safe-area-inset-top, 0px)) 14px calc(18px + env(safe-area-inset-bottom, 0px))',
            boxSizing: 'border-box',
            overscrollBehavior: 'contain',
            touchAction: 'none',
          }}
        >
          <button
            type="button"
            aria-label="Close image preview"
            onClick={(event) => {
              event.stopPropagation()
              setOpenImage('')
            }}
            style={{
              position: 'fixed',
              top: 'calc(12px + env(safe-area-inset-top, 0px))',
              right: 14,
              width: 38,
              height: 38,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2147483001,
            }}
          >
            <X size={18} />
          </button>

          <img
            src={openImage}
            alt=""
            decoding="async"
            onClick={event => event.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100vw',
              maxHeight: '100dvh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>,
        document.body
      )}
    </main>
  )
}

function MomentPost({ moment, isLast, onImage, onReact, reacting, bursts = [], imageIndex = 0 }: any) {
  const teacherName = moment.teacher?.name || 'Teacher'
  const isPrivate = moment.share_mode === 'child'
  const isImage = moment.file_type === 'image'
  const [imageReady, setImageReady] = useState(false)

  return (
    <article className="sc-parent-moment-post-v414" style={{
      display: 'grid',
      gridTemplateColumns: '38px 1fr',
      gap: 10,
      padding: '0 0 22px',
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
      background: 'transparent',
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 14,
        background: moment.teacher?.photo_url ? `url(${moment.teacher.photo_url}) center/cover` : T.accentSoft,
        color: T.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 560,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {!moment.teacher?.photo_url && initials(teacherName)}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <p style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13.8,
            fontWeight: 560,
            color: T.ink,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {teacherName}
            <span style={{
              color: T.ink3,
              fontSize: 11.5,
              fontWeight: 520,
              marginLeft: 5,
            }}>
              · Your teacher
            </span>&nbsp;</p>

          <span style={{
            fontSize: 10.8,
            color: T.ink3,
            fontWeight: 520,
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
            marginTop: 1,
          }}>
            {formatTimeAgo(moment.created_at)}
          </span>
        </div>

        {moment.note && (
          <p style={{
            fontSize: 13.6,
            color: T.ink2,
            lineHeight: 1.5,
            margin: '10px 0 0',
            whiteSpace: 'pre-wrap',
          }}>
            {moment.note}
          </p>
        )}

        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: 22,
          padding: '0 9px',
          borderRadius: 999,
          background: isPrivate ? T.accentSoft : T.soft,
          color: isPrivate ? T.accent : T.ink3,
          fontSize: 11.5,
          fontWeight: 560,
          marginTop: 10,
        }}>
          {isPrivate ? 'Shared only to you' : 'Shared with class'}
        </span>

        <div style={{ marginTop: 12, position: 'relative' }}>
          {isImage ? (
            <button
              type="button"
              onClick={() => onImage(moment.file_url)}
              style={{
                display: 'inline-flex',
                width: 'fit-content',
                maxWidth: '100%',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'zoom-in',
                fontFamily: 'inherit',
                textAlign: 'left',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
              }}
            >
              <img
                src={moment.file_url}
                alt=""
                loading={imageIndex === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={imageIndex === 0 ? 'high' : 'auto'}
                onLoad={() => setImageReady(true)}
                style={{
                  width: 'auto',
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: 360,
                  objectFit: 'contain',
                  objectPosition: 'left center',
                  display: 'block',
                  borderRadius: 18,
                  background: 'transparent',
                  opacity: imageReady ? 1 : 0,
                  transition: 'opacity 220ms ease',
                }}
              />
            </button>
          ) : (
            <a
              href={moment.file_url}
              target="_blank"
              rel="noreferrer"
              style={{
                width: '100%',
                maxWidth: 390,
                padding: 13,
                borderRadius: 20,
                background: T.soft,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: T.ink,
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                background: T.accentSoft,
                color: T.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FileText size={19} strokeWidth={1.8} />
              </div>

              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 13.5,
                  fontWeight: 560,
                  color: T.ink,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {moment.file_name || 'Document'}
                </p>
                <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0' }}>
                  Open document
                </p>
              </div>
            </a>
          )}
          <ReactionBurstLayer bursts={bursts} />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 13,
        }}>
          {[
            ['heart', Heart],
            ['like', ThumbsUp],
            ['smile', Smile],
          ].map(([key, Icon]: any) => {
            const active = moment.reaction === key
            const count = Number(moment.reaction_counts?.[key] || 0)

            return (
              <button
                key={key}
                type="button"
                onClick={() => onReact(moment, key)}
                style={{
                  minWidth: 34,
                  height: 34,
                  borderRadius: 999,
                  border: 'none',
                  background: active ? 'rgba(113,113,113,0.08)' : T.soft,
                  color: active ? reactionTone(key) : T.ink3,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  opacity: reacting ? 0.72 : 1,
                  padding: '0 8px',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 560,
                  transition: 'background 160ms ease, color 160ms ease, transform 160ms ease, opacity 160ms ease',
                  transform: active ? 'translateY(-1px)' : 'none',
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.2 : 1.9} />
                {count > 0 && <span>{count}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </article>
  )
}
