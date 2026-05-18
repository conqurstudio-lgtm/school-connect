// @ts-nocheck
'use client'

import { useEffect, useState, useRef } from 'react'
import { MoreHorizontal, LogOut, Camera, Plus, Users, ChevronRight, Pin, Pencil, Trash2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { ImageCarousel } from '@/components/feed/ImageCarousel'
import { TeacherComposer } from './TeacherComposer'
import { PhotoCropper } from './PhotoCropper'
import { EngagementSheet } from './EngagementSheet'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
  blue:   '#78A6FE',
  red:    '#EF4444',
}

interface Props { token: string }

export function TeacherDashboard({ token }: Props) {
  const [session,    setSession]    = useState<any>(null)
  const [classPosts, setClassPosts] = useState<any[]>([])
  const [schoolPosts, setSchoolPosts] = useState<any[]>([])
  const [loadingSes, setLoadingSes] = useState(true)
  const [composing,  setComposing]  = useState(false)
  const [cropFile,   setCropFile]   = useState<File | null>(null)
  const [showMenu,   setShowMenu]   = useState(false)
  const [showRoster, setShowRoster] = useState(false)
  const [engagement, setEngagement] = useState<{ postId: string; tab: 'reactions' | 'comments' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadSession = async () => {
    try {
      const res = await fetch(`/api/teacher-session?token=${encodeURIComponent(token)}`)
      const json = await res.json()
      if (res.ok) setSession(json)
    } catch {}
    setLoadingSes(false)
  }

  const loadPosts = async () => {
    try {
      const [classRes, schoolRes] = await Promise.all([
        fetch('/api/teacher/feed?scope=class&filter=all'),
        fetch('/api/teacher/feed?scope=school&filter=all'),
      ])
      const [classJson, schoolJson] = await Promise.all([classRes.json(), schoolRes.json()])
      setClassPosts(classJson.posts ?? [])
      setSchoolPosts(schoolJson.posts ?? [])
    } catch {}
  }

  useEffect(() => { loadSession() }, [token])
  useEffect(() => { if (session) loadPosts() }, [session])

  if (loadingSes || !session) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          border: `2px solid ${T.border}`, borderTopColor: T.ink,
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    )
  }

  const { teacher, school, children } = session
  const initials = teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const visibleChildren = children.slice(0, 5)

  const uploadPhoto = async (blob: Blob) => {
    setCropFile(null)
    const tid = toast.loading('Uploading…')
    try {
      const form = new FormData()
      form.append('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      const res = await fetch('/api/teacher/photo', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success('Photo updated', { id: tid })
      setSession((s: any) => ({ ...s, teacher: { ...s.teacher, photo_url: `${json.photo_url}?t=${Date.now()}` } }))
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: tid })
    }
  }

  const signOut = async () => {
    if (!confirm("Sign out? You'll need your link to come back.")) return
    await fetch('/api/teacher-session', { method: 'POST' })
    window.location.href = '/teacher'
  }

  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      maxWidth: 520, margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
      paddingBottom: 120,
      background: T.bg,
    }}>

      {/* ─── HERO ─── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '40px 28px 12px',
      }}>
        <button onClick={() => fileRef.current?.click()}
          onMouseDown ={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp   ={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            background: teacher.photo_url
              ? `url(${teacher.photo_url}) center/cover`
              : '#F0F0F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${T.border}`,
            cursor: 'pointer', padding: 0, position: 'relative',
            transition: 'transform 0.15s ease',
            fontSize: 24, fontWeight: 600, color: T.ink2,
          }}>
          {!teacher.photo_url && initials}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 22, height: 22, borderRadius: '50%',
            background: T.ink, color: T.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${T.bg}`,
          }}>
            <Camera size={10} strokeWidth={2} />
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) setCropFile(f)
            e.target.value = ''
          }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 18 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(v => !v)} aria-label="More" style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'none', border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T.ink2,
            }}>
              <MoreHorizontal size={14} strokeWidth={1.8} />
            </button>
            {showMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                     onClick={() => setShowMenu(false)} />
                <div className="dropdown-in" style={{
                  position: 'absolute', right: 0, top: 38, width: 180,
                  background: T.white, borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.1)',
                  zIndex: 50, padding: '5px 0',
                }}>
                  <button onClick={() => { fileRef.current?.click(); setShowMenu(false) }}
                    style={menuItemStyle}>
                    <Camera size={13} strokeWidth={1.8} /> Change photo
                  </button>
                  <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 12px' }} />
                  <button onClick={() => { signOut(); setShowMenu(false) }}
                    style={{ ...menuItemStyle, color: '#E8281E' }}>
                    <LogOut size={13} strokeWidth={1.8} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div style={{ padding: '0 28px 28px' }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: T.ink,
          letterSpacing: '-0.025em', margin: 0, lineHeight: 1.2,
        }}>
          {teacher.name}
        </h1>
        <p style={{ fontSize: 13, color: T.ink3, margin: '4px 0 0' }}>
          {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''} · {school.name}
        </p>
      </div>

      {/* ─── CLASS ROSTER ─── */}
      <Section title="Your Class" count={children.length}
        action={
          <button onClick={() => setShowRoster(true)} style={iconButtonStyle}>
            <Plus size={13} strokeWidth={2.2} /> Add child
          </button>
        }>
        {children.length === 0 ? (
          <div style={{
            padding: '24px 20px', textAlign: 'center',
            border: `1px dashed ${T.border}`, borderRadius: 14,
            margin: '0 20px',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: '#F0F0F4',
              margin: '0 auto 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={18} color={T.ink3} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
              Add children so parents can find them when they join.
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              padding: '0 20px',
            }}>
              {visibleChildren.map((c: any) => (
                <ChildRow key={c.id} child={c} />
              ))}
            </div>
            {children.length > 5 && (
              <button onClick={() => setShowRoster(true)} style={seeAllStyle}>
                See all ({children.length}) <ChevronRight size={13} strokeWidth={2} />
              </button>
            )}
          </>
        )}
      </Section>

      {/* ─── YOUR POSTS ─── */}
      <Section title="Your Posts" count={classPosts.length}>
        {classPosts.length === 0 ? (
          <EmptyHint
            title="No posts yet"
            body="Tap the + button to share your first class moment."
          />
        ) : (
          classPosts.slice(0, 5).map((p: any, i: number) => (
            <TeacherPostCard key={p.id} post={p} teacher={teacher} index={i}
              onOpenEngagement={(tab) => setEngagement({ postId: p.id, tab })} />
          ))
        )}
      </Section>

      {/* ─── FROM YOUR SCHOOL ─── */}
      <Section title="From Your School" count={schoolPosts.length}>
        {schoolPosts.length === 0 ? (
          <EmptyHint
            title="No school posts yet"
            body="Announcements from your admin will appear here."
          />
        ) : (
          schoolPosts.slice(0, 5).map((p: any, i: number) => (
            <SchoolPostCard key={p.id} post={p} school={school} index={i} />
          ))
        )}
      </Section>

      {/* ─── FAB ─── */}
      <button onClick={() => setComposing(true)}
        className="fab" aria-label="Post to my class">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Modals */}
      {cropFile && (
        <PhotoCropper
          file={cropFile}
          onClose={() => setCropFile(null)}
          onSave={uploadPhoto}
        />
      )}
      {composing && (
        <TeacherComposer
          teacherName={teacher.name}
          grade={teacher.grade}
          className={teacher.class_name}
          onClose={() => setComposing(false)}
          onPosted={() => {
            setComposing(false)
            loadPosts()
            toast.success('Your class will see it')
          }}
        />
      )}
      {showRoster && (
        <RosterModal
          children={children}
          onClose={() => setShowRoster(false)}
          onChanged={loadSession}
        />
      )}

      {engagement && (
        <EngagementSheet
          postId={engagement.postId}
          initialTab={engagement.tab}
          teacher={teacher}
          onClose={() => setEngagement(null)}
          onChanged={loadPosts}
        />
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Reusable section wrapper — uppercase label + count + content
   ────────────────────────────────────────────────────────── */
function Section({ title, count, action, children }: any) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: T.ink3,
            letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
          }}>
            {title}
          </p>
          {count > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: T.ink3,
              letterSpacing: '0.05em',
            }}>· {count}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function EmptyHint({ title, body }: any) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: T.ink, fontWeight: 600,
                  margin: '0 0 4px', letterSpacing: '-0.005em' }}>
        {title}
      </p>
      <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
        {body}
      </p>
    </div>
  )
}

function ChildRow({ child }: any) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 10,
      background: T.white, border: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: '#F0F0F4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 11, color: T.ink2, fontWeight: 600,
      }}>
        {child.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: T.ink,
                    margin: 0, letterSpacing: '-0.005em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {child.name}
        </p>
        <p style={{ fontSize: 11, color: T.ink3, margin: '1px 0 0' }}>
          {child.guardian_count === 0 ? 'No parents yet'
          : child.guardian_count === 1 ? '1 parent linked'
          : `${child.guardian_count} parents linked`}
        </p>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   PostCard layout — identical to parent feed PostCard.
   Two variants: TeacherPostCard (teacher's own posts) and
   SchoolPostCard (admin's school-wide posts).
   ────────────────────────────────────────────────────────── */
function TeacherPostCard({ post, teacher, index, onOpenEngagement }: any) {
  return <BasePostCard post={post} index={index}
    avatarUrl={teacher.photo_url}
    avatarInitials={teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
    name={teacher.name}
    showEngagement
    onOpenEngagement={onOpenEngagement} />
}

function SchoolPostCard({ post, school, index }: any) {
  return <BasePostCard post={post} index={index}
    avatarUrl={school.logo_url}
    avatarInitials={school.name.charAt(0)}
    name={school.name}
    isSquare />
}

function BasePostCard({ post, index, avatarUrl, avatarInitials, name, isSquare, showEngagement, onOpenEngagement }: any) {
  const TRUNCATE = 180
  const body = post.body ?? ''
  const isTrunc = body.length > TRUNCATE
  const [expanded, setExpanded] = useState(false)
  const display = (isTrunc && !expanded) ? body.slice(0, TRUNCATE).trimEnd() : body

  return (
    <article>
      <div style={{ display: 'flex', gap: 12, padding: '18px 20px 10px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            overflow: 'hidden',
            background: avatarUrl
              ? `url(${avatarUrl}) center/${isSquare ? 'contain' : 'cover'} no-repeat`
              : '#F0F0F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid rgba(0,0,0,0.06)`,
            fontSize: 13, fontWeight: 600, color: T.ink2,
          }}>
            {!avatarUrl && avatarInitials}
          </div>
          <div style={{
            width: 1, flex: 1, minHeight: 24,
            marginTop: 6, background: 'rgba(0,0,0,0.07)',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
            <span style={{
              fontSize: 14, fontWeight: 500, color: '#1A1A1A',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>{name}</span>
            {post.is_pinned && <Pin style={{ width: 10, height: 10, color: '#B0B0B0', flexShrink: 0 }} />}
            <span style={{ fontSize: 12, color: '#B0B0B0', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {relTime(post.created_at)}
            </span>
          </div>

          {body && (
            <p style={{
              fontSize: 14, fontWeight: 400, lineHeight: 1.55,
              color: '#2A2A2A', margin: '4px 0 0',
              whiteSpace: 'pre-wrap',
            }}>
              {display}
              {isTrunc && !expanded && (
                <> {'…'} <button onClick={() => setExpanded(true)} style={{
                  color: T.blue, background: 'none', border: 'none',
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

      {post.image_urls && post.image_urls.length > 0 && (
        <div style={{ padding: '0 20px 0 70px', overflow: 'visible' }}>
          <ImageCarousel
            priority={index < 2}
            images={post.image_urls}
            onTap={() => {}}
            flyEmoji={null}
          />
        </div>
      )}

      {/* Engagement footer */}
      {showEngagement ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '8px 20px 14px 70px',
        }}>
          <button onClick={() => onOpenEngagement && onOpenEngagement('reactions')}
            style={engagementBtn}>
            <span style={{ fontSize: 14 }}>❤️</span>
            <span style={{ fontSize: 13, color: T.ink }}>{post.reaction_count || 0}</span>
            {post.new_reactions > 0 && <NewChip n={post.new_reactions} />}
          </button>
          <button onClick={() => onOpenEngagement && onOpenEngagement('comments')}
            style={engagementBtn}>
            <span style={{ fontSize: 13, color: T.ink2 }}>💬</span>
            <span style={{ fontSize: 13, color: T.ink }}>{post.comment_count || 0}</span>
            {post.new_comments > 0 && <NewChip n={post.new_comments} />}
          </button>
        </div>
      ) : post.reaction_count > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '6px 20px 14px 70px',
        }}>
          {Object.entries(post.reaction_counts || {}).map(([type, count]: any) => (
            <div key={type} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: '#6A6A6A',
            }}>
              <span style={{ fontSize: 14 }}>
                {type === 'love' ? '❤️' : type === 'like' ? '👍' : type === 'celebrate' ? '🎉' : '👏'}
              </span>
              {count}
            </div>
          ))}
        </div>
      )}

      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }} />
    </article>
  )
}

/* ──────────────────────────────────────────────────────────
   Full roster modal — opened when teacher taps "Add child" or "See all"
   ────────────────────────────────────────────────────────── */
function RosterModal({ children, onClose, onChanged }: any) {
  const [showAdd,  setShowAdd]  = useState(false)
  const [editing,  setEditing]  = useState<any>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const addChild = async (name: string) => {
    const tid = toast.loading('Adding…')
    try {
      const res = await fetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success(`${name} added`, { id: tid })
      onChanged()
      setShowAdd(false)
    } catch (e: any) { toast.error(e.message || 'Failed', { id: tid }) }
  }

  const renameChild = async (id: string, name: string) => {
    const tid = toast.loading('Saving…')
    try {
      const res = await fetch('/api/teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success('Renamed', { id: tid })
      setEditing(null); onChanged()
    } catch (e: any) { toast.error(e.message || 'Failed', { id: tid }) }
  }

  const removeChild = async (id: string, name: string) => {
    setOpenMenu(null)
    if (!confirm(`Remove ${name} from your class?`)) return
    const tid = toast.loading('Removing…')
    try {
      const res = await fetch(`/api/teacher?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      toast.success(`${name} removed`, { id: tid })
      onChanged()
    } catch { toast.error('Could not remove', { id: tid }) }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '20px 20px 0 0',
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.ink,
                         letterSpacing: '-0.02em', margin: 0 }}>Your class</h3>
            <p style={{ fontSize: 12, color: T.ink3, margin: '2px 0 0' }}>
              {children.length} {children.length === 1 ? 'child' : 'children'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAdd(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 999,
              background: T.ink, color: T.white, border: 'none',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              <Plus size={12} strokeWidth={2.4} /> Add
            </button>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.ink3,
            }}>
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {children.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              border: `1px dashed ${T.border}`, borderRadius: 14,
            }}>
              <Users size={22} color={T.ink3} strokeWidth={1.5}
                style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
                Tap Add to start your class list.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {children.map((c: any) => (
                <div key={c.id} style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: T.white, border: `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                  position: 'relative',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#F0F0F4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 12, color: T.ink2, fontWeight: 600,
                  }}>
                    {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  {editing?.id === c.id ? (
                    <InlineRename value={editing.name}
                      onCancel={() => setEditing(null)}
                      onSave={v => renameChild(c.id, v)} />
                  ) : (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: T.ink,
                                  margin: 0, overflow: 'hidden',
                                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </p>
                      <p style={{ fontSize: 11, color: T.ink3, margin: '2px 0 0' }}>
                        {c.guardian_count === 0 ? 'No parents yet'
                        : c.guardian_count === 1 ? '1 parent linked'
                        : `${c.guardian_count} parents linked`}
                      </p>
                    </div>
                  )}
                  {!editing && (
                    <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                      aria-label="Options" style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: T.ink3,
                      }}>
                      <MoreHorizontal size={14} strokeWidth={1.8} />
                    </button>
                  )}
                  {openMenu === c.id && (
                    <div className="dropdown-in" style={{
                      position: 'absolute', right: 10, top: 46, zIndex: 10,
                      background: T.white, borderRadius: 12,
                      border: `1px solid ${T.border}`,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      padding: '4px 0', minWidth: 150,
                    }}>
                      <button onClick={() => { setOpenMenu(null); setEditing(c) }}
                        style={{ ...menuItemStyle, padding: '9px 12px' }}>
                        <Pencil size={13} strokeWidth={1.8} /> Rename
                      </button>
                      <button onClick={() => removeChild(c.id, c.name)}
                        style={{ ...menuItemStyle, padding: '9px 12px', color: T.red }}>
                        <Trash2 size={13} strokeWidth={1.8} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {showAdd && <AddChildOverlay onAdd={addChild} onClose={() => setShowAdd(false)} />}
      </div>
    </div>
  )
}

function InlineRename({ value, onCancel, onSave }: any) {
  const [v, setV] = useState(value)
  return (
    <div style={{ flex: 1, display: 'flex', gap: 6 }}>
      <input value={v} onChange={e => setV(e.target.value)} autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') onSave(v.trim())
          if (e.key === 'Escape') onCancel()
        }}
        style={{ flex: 1, padding: '7px 10px', fontSize: 13,
          border: `1px solid ${T.border}`, borderRadius: 8,
          fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={() => onSave(v.trim())} style={{
        width: 30, height: 30, borderRadius: 8,
        background: T.ink, color: T.white, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Check size={12} strokeWidth={2.4} /></button>
      <button onClick={onCancel} style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'none', border: `1px solid ${T.border}`, cursor: 'pointer',
        color: T.ink3, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}><X size={12} strokeWidth={1.8} /></button>
    </div>
  )
}

function AddChildOverlay({ onAdd, onClose }: any) {
  const [name, setName] = useState('')
  const submit = () => { const n = name.trim(); if (n) onAdd(n) }
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '20px 20px 0 0', padding: 24,
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: T.ink,
                     letterSpacing: '-0.02em', margin: '0 0 16px' }}>
          Add a child
        </h3>
        <input autoFocus value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="Emma Johnson"
          style={{
            width: '100%', padding: '12px 14px', fontSize: 15,
            border: `1px solid ${T.border}`, borderRadius: 12,
            background: T.white, color: T.ink, outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }} />
        <button onClick={submit} style={{
          width: '100%', marginTop: 12, padding: '14px',
          borderRadius: 12, background: T.ink, color: T.white, border: 'none',
          fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>Add child</button>
      </div>
    </div>
  )
}

/* Styling tokens */
const menuItemStyle: any = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
  padding: '11px 16px', background: 'none', border: 'none',
  cursor: 'pointer', fontSize: 13, fontWeight: 500,
  color: T.ink, fontFamily: 'inherit', textAlign: 'left',
}
const iconButtonStyle: any = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '6px 12px', borderRadius: 999,
  background: T.ink, color: T.white, border: 'none',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'inherit',
}
const seeAllStyle: any = {
  display: 'flex', alignItems: 'center', gap: 4,
  margin: '12px auto 0', padding: '6px 12px',
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, color: T.ink3,
  fontFamily: 'inherit',
}

const engagementBtn: any = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '4px 8px', borderRadius: 999,
  background: 'transparent', border: '1px solid transparent',
  cursor: 'pointer', fontFamily: 'inherit',
  position: 'relative',
}

function NewChip({ n }: { n: number }) {
  return (
    <span style={{
      marginLeft: 4, padding: '2px 6px', borderRadius: 999,
      background: T.blue, color: T.white,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
    }}>
      {n} new
    </span>
  )
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}
