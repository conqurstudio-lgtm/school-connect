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
            animation: 'momentDotBounce 1.05s ease-in-out infinite',
            animationDelay: `${dot * 0.14}s`,
            display: 'block',
          }} />
        ))}
      </div>
    </div>
  )
}

export function ParentMomentsPage({ token }: { token: string }) {
  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<any>(null)
  const [moments, setMoments] = useState<any[]>([])
  const [openImage, setOpenImage] = useState('')
  const [reacting, setReacting] = useState('')

  const load = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/parent/moments?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(json.error || 'Could not load Moments')

      setChild(json.child)
      setMoments(json.moments || [])
    } catch (error: any) {
      toast.error(error.message || 'Could not load Moments')
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [token])

  const react = async (moment: any, reaction: string) => {
    setReacting(moment.id)

    try {
      const res = await fetch('/api/parent/moments/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, moment_id: moment.id, reaction }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not react')

      setMoments(current => current.map(item =>
        item.id === moment.id ? { ...item, reaction } : item
      ))
    } catch (error: any) {
      toast.error(error.message || 'Could not react')
    }

    setReacting('')
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
            <a href={`/report/${token}`} style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: 'none',
              background: T.soft,
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              flexShrink: 0,
            }}>
              <ArrowLeft size={16} />
            </a>

            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 14,
                fontWeight: 560,
                color: T.ink,
                margin: 0,
              }}>
                Moments
              </p>
              <p style={{
                fontSize: 12.5,
                color: T.ink3,
                margin: '2px 0 0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                {child?.name ? `Private updates for ${child.name}` : 'Private updates'}
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
                No Moments yet
              </p>
              <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: 0 }}>
                Private teacher updates will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
              {moments.map((moment, index) => (
                <MomentPost
                  key={moment.id}
                  moment={moment}
                  isLast={index === moments.length - 1}
                  onImage={setOpenImage}
                  onReact={react}
                  reacting={reacting === moment.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

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

function MomentPost({ moment, isLast, onImage, onReact, reacting }: any) {
  const teacherName = moment.teacher?.name || 'Teacher'
  const isPrivate = moment.share_mode === 'child'
  const isImage = moment.file_type === 'image'

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
        <p style={{
          fontSize: 13.8,
          fontWeight: 560,
          color: T.ink,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {teacherName}
        </p>

        <p style={{
          fontSize: 12.2,
          color: T.ink3,
          margin: '2px 0 0',
          lineHeight: 1.35,
        }}>
          Your teacher · {formatShortDate(moment.created_at)}
        </p>

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

            return (
              <button
                key={key}
                type="button"
                disabled={reacting}
                onClick={() => onReact(moment, key)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: 'none',
                  background: active ? T.accentSoft : T.soft,
                  color: active ? T.accent : T.ink3,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: reacting ? 'wait' : 'pointer',
                  opacity: reacting ? 0.65 : 1,
                }}
              >
                <Icon size={15} strokeWidth={1.9} />
              </button>
            )
          })}
        </div>
      </div>
    </article>
  )
}
