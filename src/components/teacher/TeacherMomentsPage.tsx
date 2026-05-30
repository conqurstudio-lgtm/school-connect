// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, FileText, Heart, Smile, ThumbsUp, X } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  ink: '#252525',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  bg: '#FFFFFF',
  soft: '#F7F7F8',
  accent: '#8FA6A1',
  accentSoft: '#EEF3F1',
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

function reactionLabel(reaction: string) {
  if (reaction === 'heart') return 'Loved'
  if (reaction === 'like') return 'Liked'
  if (reaction === 'smile') return 'Smiled'
  return 'Reacted'
}

function reactionIcon(reaction: string) {
  if (reaction === 'heart') return '♡'
  if (reaction === 'like') return '👍'
  if (reaction === 'smile') return '😊'
  return '•'
}

function SafeStyle() {
  return (
    <style>{`
      html,
      body {
        background: #FFFFFF !important;
        overflow: hidden;
      }

      @keyframes teacherMomentDotBounce {
        0%, 80%, 100% { transform: scale(0.72); opacity: 0.45; }
        40% { transform: scale(1); opacity: 1; }
      }
    `}</style>
  )
}

function LoadingDots() {
  return (
    <div style={{ padding: '34px 0', textAlign: 'center' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 24,
      }}>
        {[0, 1, 2].map(dot => (
          <span key={dot} style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: dot === 1 ? T.accent : '#D8DFDD',
            animation: 'teacherMomentDotBounce 1.05s ease-in-out infinite',
            animationDelay: `${dot * 0.14}s`,
            display: 'block',
          }} />
        ))}
      </div>
    </div>
  )
}

export function TeacherMomentsPage({ teacher, onBack, onChanged }: any) {
  const [loading, setLoading] = useState(true)
  const [moments, setMoments] = useState<any[]>([])
  const [openImage, setOpenImage] = useState('')
  const [reactionMoment, setReactionMoment] = useState<any>(null)

  const load = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/teacher/moments/list', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(json.error || 'Could not load Moments')

      setMoments(json.moments || [])
      onChanged?.(json.summary)
    } catch (error: any) {
      toast.error(error.message || 'Could not load Moments')
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: T.bg,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      color: T.ink,
      overscrollBehavior: 'none',
    }}>
      <SafeStyle />

      <div style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
      }}>
        <header style={{
          flexShrink: 0,
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 8px',
          background: T.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={onBack} style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: 'none',
              background: T.soft,
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}>
              <ArrowLeft size={16} />
            </button>

            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 560, color: T.ink, margin: 0 }}>
                Moments preview
              </p>
              <p style={{
                fontSize: 12.5,
                color: T.ink3,
                margin: '2px 0 0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                Parent view of your shared updates
              </p>
            </div>
          </div>
        </header>

        <section style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '34px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
          background: T.bg,
        }}>
          {loading ? (
            <LoadingDots />
          ) : moments.length === 0 ? (
            <div style={{
              padding: '38px 18px',
              textAlign: 'center',
              borderRadius: 22,
              border: `1px dashed ${T.border}`,
              background: 'transparent',
            }}>
              <p style={{ fontSize: 15, fontWeight: 560, color: T.ink, margin: '0 0 5px' }}>
                No Moments shared yet
              </p>
              <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: 0 }}>
                Share a Moment from the teacher page to preview it here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
              {moments.map((moment, index) => (
                <TeacherPreviewMomentPost
                  key={moment.id}
                  moment={moment}
                  teacher={teacher}
                  isLast={index === moments.length - 1}
                  onImage={setOpenImage}
                  onReactions={() => setReactionMoment(moment)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {reactionMoment && (
        <ReactionSheet
          moment={reactionMoment}
          onClose={() => setReactionMoment(null)}
        />
      )}

      {openImage && (
        <div
          onClick={() => setOpenImage('')}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            background: '#101114',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
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
            }}
          >
            <X size={18} />
          </button>

          <img
            src={openImage}
            alt=""
            onClick={event => event.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      )}
    </main>
  )
}

function TeacherPreviewMomentPost({ moment, teacher, isLast, onImage, onReactions }: any) {
  const teacherName = teacher?.name || 'Teacher'
  const isPrivate = moment.share_mode === 'child'
  const isImage = moment.file_type === 'image'
  const reactionTotal = Number(moment.reaction_count || 0)

  return (
    <article style={{
      display: 'grid',
      gridTemplateColumns: '38px 1fr',
      gap: 10,
      padding: '0 0 24px',
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
      background: 'transparent',
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 14,
        background: teacher?.photo_url ? `url(${teacher.photo_url}) center/cover` : T.accentSoft,
        color: T.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 560,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {!teacher?.photo_url && initials(teacherName)}
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
            </span>
          </p>

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
          {isPrivate ? 'Shared only to parent' : 'Shared with class'}
        </span>

        <div style={{ marginTop: 12 }}>
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
                style={{
                  width: 'auto',
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: 360,
                  objectFit: 'contain',
                  objectPosition: 'left center',
                  display: 'block',
                  borderRadius: 22,
                  background: 'transparent',
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
        </div>

        <button
          type="button"
          onClick={onReactions}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 13,
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: T.ink3,
          }}
        >
          <ReactionCount Icon={Heart} value={moment.reaction_counts?.heart || 0} active={moment.reaction_counts?.heart > 0} />
          <ReactionCount Icon={ThumbsUp} value={moment.reaction_counts?.like || 0} active={moment.reaction_counts?.like > 0} />
          <ReactionCount Icon={Smile} value={moment.reaction_counts?.smile || 0} active={moment.reaction_counts?.smile > 0} />

          <span style={{
            fontSize: 12.2,
            color: T.ink3,
            marginLeft: 2,
          }}>
            {reactionTotal === 0 ? 'No reactions yet' : `${reactionTotal} reactions`}
          </span>
        </button>
      </div>
    </article>
  )
}

function ReactionCount({ Icon, value, active }: any) {
  return (
    <span style={{
      minWidth: 34,
      height: 34,
      borderRadius: 999,
      border: 'none',
      background: active ? T.accentSoft : T.soft,
      color: active ? T.accent : T.ink3,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      padding: '0 8px',
      fontSize: 12,
      fontWeight: 560,
    }}>
      <Icon size={14} strokeWidth={1.9} />
      {value}
    </span>
  )
}

function ReactionSheet({ moment, onClose }: any) {
  const reactions = moment.reactions || []

  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 4500,
      background: 'rgba(0,0,0,0.30)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
    }}>
      <div onClick={event => event.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        maxHeight: '82dvh',
        overflowY: 'auto',
        background: T.white,
        borderRadius: '24px 24px 0 0',
        padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: T.ink, margin: 0 }}>
              Reactions
            </h2>
            <p style={{ fontSize: 13, color: T.ink3, margin: '3px 0 0' }}>
              Parents who reacted to this Moment.
            </p>
          </div>

          <button type="button" onClick={onClose} style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            border: 'none',
            background: T.soft,
            color: T.ink3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <X size={16} />
          </button>
        </div>

        {reactions.length === 0 ? (
          <div style={{
            padding: '30px 16px',
            textAlign: 'center',
            border: `1px dashed ${T.border}`,
            borderRadius: 18,
          }}>
            <p style={{ fontSize: 14.5, fontWeight: 540, color: T.ink, margin: '0 0 4px' }}>
              No reactions yet
            </p>
            <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: 0 }}>
              Parent reactions will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {reactions.map((item: any, index: number) => (
              <div key={`${item.child_id}-${item.reaction}-${index}`} style={{
                padding: '12px 0',
                borderBottom: index === reactions.length - 1 ? 'none' : `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 14,
                  background: T.accentSoft,
                  color: T.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 560,
                  flexShrink: 0,
                }}>
                  {initials(item.child?.name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13.8,
                    fontWeight: 540,
                    color: T.ink,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.child?.name || 'Parent'}
                  </p>

                  <p style={{
                    fontSize: 12.2,
                    color: T.ink3,
                    margin: '2px 0 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.parent_whatsapp || item.parent_email || 'Parent contact hidden'}
                  </p>
                </div>

                <span style={{
                  minHeight: 30,
                  borderRadius: 999,
                  background: T.accentSoft,
                  color: T.accent,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '0 10px',
                  fontSize: 12.2,
                  fontWeight: 540,
                  flexShrink: 0,
                }}>
                  <span>{reactionIcon(item.reaction)}</span>
                  {reactionLabel(item.reaction)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
