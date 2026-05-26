// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  FileText,
  Heart,
  MoreVertical,
  Pin,
  PinOff,
  Smile,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { TeacherMomentComposer } from '@/components/teacher/TeacherMomentComposer'

const T = {
  ink: '#252525',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  bg: '#FFFFFF',
  soft: '#F7F7F8',
  soft2: '#F4F5F5',
  accent: '#8FA6A1',
  accentSoft: '#EEF3F1',
  white: '#FFFFFF',
  red: '#B42318',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 24 }}>
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

function MiniStat({ label, value }: any) {
  return (
    <div style={{
      padding: '10px 8px',
      borderRadius: 17,
      background: T.soft,
      textAlign: 'center',
    }}>
      <p style={{ fontSize: 18, fontWeight: 560, color: T.ink, margin: 0 }}>
        {value}
      </p>
      <p style={{ fontSize: 11.5, color: T.ink3, margin: '2px 0 0' }}>
        {label}
      </p>
    </div>
  )
}

export function TeacherMomentsPage({ teacher, learners = [], onBack, onChanged }: any) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [moments, setMoments] = useState<any[]>([])
  const [summary, setSummary] = useState({ moments: 0, reactions: 0 })
  const [openImage, setOpenImage] = useState('')
  const [momentDraft, setMomentDraft] = useState<any>(null)
  const [reactionMoment, setReactionMoment] = useState<any>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/teacher/moments/list', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(json.error || 'Could not load Moments')

      setMoments(json.moments || [])
      setSummary({
        moments: Number(json.summary?.moments || 0),
        reactions: Number(json.summary?.reactions || 0),
      })
      onChanged?.(json.summary)
    } catch (error: any) {
      toast.error(error.message || 'Could not load Moments')
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleMomentFileChange = (event: any) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const allowed =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.type.includes('word') ||
      file.type.includes('document')

    if (!allowed) {
      toast.error('Choose an image or document')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Moment file must be under 8 MB')
      return
    }

    setMomentDraft({ file })
  }

  const refreshAfterCreate = async () => {
    setMomentDraft(null)
    await load()
  }

  const updateMoment = async (moment: any, action: 'pin' | 'unpin' | 'delete') => {
    setOpenMenu(null)

    if (action === 'delete' && !confirm('Delete this Moment from your workspace?')) return

    const tid = toast.loading(
      action === 'delete'
        ? 'Deleting Moment...'
        : action === 'pin'
          ? 'Pinning Moment...'
          : 'Unpinning Moment...'
    )

    try {
      const res = await fetch('/api/teacher/moments/list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: moment.id, action }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not update Moment')

      toast.success(
        action === 'delete'
          ? 'Moment deleted'
          : action === 'pin'
            ? 'Moment pinned'
            : 'Moment unpinned',
        { id: tid }
      )

      await load()
    } catch (error: any) {
      toast.error(error.message || 'Could not update Moment', { id: tid })
    }
  }

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

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf,.pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleMomentFileChange}
      />

      {momentDraft && (
        <TeacherMomentComposer
          draft={momentDraft}
          learners={learners}
          onClose={() => setMomentDraft(null)}
          onCreated={refreshAfterCreate}
        />
      )}

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
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 4px',
          background: T.bg,
          display: 'flex',
          justifyContent: 'flex-start',
        }}>
          <button type="button" onClick={onBack} style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            border: 'none',
            background: T.bg,
            color: T.ink3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}>
            <ArrowLeft size={16} />
          </button>
        </header>

        <section style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
          background: T.bg,
        }}>
          <section style={{
            textAlign: 'center',
            minHeight: 260,
            padding: '28px 18px 26px',
            borderRadius: 28,
            background: T.bg,
            border: 'none',
            marginBottom: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 92,
              height: 92,
              borderRadius: 32,
              background: T.accentSoft,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: T.accent,
              fontSize: 32,
              fontWeight: 560,
              overflow: 'hidden',
            }}>
              M
            </div>

            <h1 style={{
              fontSize: 22,
              lineHeight: 1.08,
              fontWeight: 560,
              letterSpacing: '-0.045em',
              color: T.ink,
              margin: '0 0 7px',
            }}>
              Moments
            </h1>

            <p style={{
              maxWidth: 300,
              fontSize: 12.8,
              color: T.ink3,
              lineHeight: 1.4,
              margin: 0,
            }}>
              Create updates and see how parents respond.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 9,
              width: '100%',
              maxWidth: 260,
              marginTop: 20,
            }}>
              <MiniStat label="Moments" value={summary.moments} />
              <MiniStat label="Reactions" value={summary.reactions} />
            </div>
          </section>

          <CreateMomentCard onCreate={() => fileRef.current?.click()} />

          <div style={{
            marginTop: 20,
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 560, color: T.ink, margin: 0 }}>
                Moments shared
              </p>
              <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0' }}>
                Pin important updates or manage old ones.
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingDots />
          ) : moments.length === 0 ? (
            <div style={{
              padding: '34px 18px',
              textAlign: 'center',
              borderRadius: 22,
              border: `1px dashed ${T.border}`,
              background: 'transparent',
            }}>
              <p style={{ fontSize: 15, fontWeight: 560, color: T.ink, margin: '0 0 5px' }}>
                No Moments yet
              </p>
              <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: 0 }}>
                Create your first private photo or document update.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {moments.map((moment, index) => (
                <TeacherMomentPost
                  key={moment.id}
                  moment={moment}
                  teacher={teacher}
                  isLast={index === moments.length - 1}
                  onImage={setOpenImage}
                  onReactions={() => setReactionMoment(moment)}
                  openMenu={openMenu}
                  setOpenMenu={setOpenMenu}
                  onPin={() => updateMoment(moment, moment.is_pinned ? 'unpin' : 'pin')}
                  onDelete={() => updateMoment(moment, 'delete')}
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

function CreateMomentCard({ onCreate }: any) {
  return (
    <section style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 15px',
      borderRadius: 24,
      background: '#EEF3F1',
      border: 'none',
      marginBottom: 14,
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 14,
        background: T.white,
        color: T.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Camera size={17} strokeWidth={1.8} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 540, color: T.ink, margin: 0 }}>
          Create Moment
        </p>
        <p style={{ fontSize: 12.5, color: T.ink2, lineHeight: 1.35, margin: '2px 0 0' }}>
          Share a private update with parents.
        </p>
      </div>

      <button type="button" onClick={onCreate} style={{
        minHeight: 36,
        borderRadius: 999,
        border: 'none',
        background: T.accent,
        color: T.white,
        fontSize: 13,
        fontWeight: 560,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 14px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        flexShrink: 0,
      }}>
        Add
      </button>
    </section>
  )
}

function TeacherMomentPost({
  moment,
  teacher,
  isLast,
  onImage,
  onReactions,
  openMenu,
  setOpenMenu,
  onPin,
  onDelete,
}: any) {
  const teacherName = teacher?.name || 'You'
  const isPrivate = moment.share_mode === 'child'
  const isImage = moment.file_type === 'image'
  const names = (moment.recipients || [])
    .map((row: any) => row.child?.name)
    .filter(Boolean)
    .slice(0, 3)

  const sharedText = isPrivate
    ? (names.length ? `Shared to ${names.join(', ')}` : 'Shared to parent')
    : `Shared with class · ${moment.recipient_count || 0} parents`

  const reactionTotal = Number(moment.reaction_count || 0)
  const isMenuOpen = openMenu === moment.id

  return (
    <article style={{
      display: 'grid',
      gridTemplateColumns: '38px 1fr',
      gap: 10,
      padding: '0 0 24px',
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
      background: 'transparent',
      position: 'relative',
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

      <div style={{ minWidth: 0, position: 'relative' }}>
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
              · Your Moment
            </span>
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            flexShrink: 0,
          }}>
            {moment.is_pinned && (
              <span style={{ color: T.accent, display: 'inline-flex' }}>
                <Pin size={12} strokeWidth={1.8} />
              </span>
            )}

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

            <button
              type="button"
              onClick={() => setOpenMenu(isMenuOpen ? null : moment.id)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                border: 'none',
                background: 'transparent',
                color: T.ink3,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <MoreVertical size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div style={{
            position: 'absolute',
            top: 30,
            right: 0,
            zIndex: 50,
            minWidth: 150,
            padding: 6,
            borderRadius: 16,
            background: T.white,
            border: `1px solid ${T.border}`,
            boxShadow: '0 14px 38px rgba(0,0,0,0.10)',
          }}>
            <MenuItem
              Icon={moment.is_pinned ? PinOff : Pin}
              label={moment.is_pinned ? 'Unpin' : 'Pin'}
              onClick={onPin}
            />
            <MenuItem
              Icon={Trash2}
              label="Delete"
              onClick={onDelete}
              danger
            />
          </div>
        )}

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
          {sharedText}
        </span>

        <div style={{ marginTop: 12 }}>
          {isImage ? (
            <button
              type="button"
              onClick={() => onImage(moment.file_url)}
              style={{
                display: 'block',
                width: '100%',
                maxWidth: 390,
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'zoom-in',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <img
                src={moment.file_url}
                alt=""
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 360,
                  objectFit: 'contain',
                  objectPosition: 'left center',
                  display: 'block',
                  borderRadius: 22,
                  background: T.soft,
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

function MenuItem({ Icon, label, onClick, danger }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 36,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '0 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 12,
        cursor: 'pointer',
        fontSize: 12.8,
        fontWeight: 520,
        color: danger ? T.red : T.ink2,
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      <Icon size={14} strokeWidth={1.8} />
      {label}
    </button>
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
