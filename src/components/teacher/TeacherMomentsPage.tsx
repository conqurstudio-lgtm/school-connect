// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Heart, Smile, ThumbsUp, X, Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import { TeacherMomentComposer } from '@/components/teacher/TeacherMomentComposer'
import { SCBottomSheet, SCButton, SCTextArea, SCEmptyState, SCTopBar, SCIconButton } from '@/components/ui'

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

function teacherMomentsCacheKey(teacher: any) {
 const key = teacher?.id || teacher?.teacher_id || teacher?.email || 'teacher'
 return `school-connect:teacher-moments:${key}:v1`
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

 @keyframes teacherTabUnderlineIn {
 0% {
 transform: scaleX(0.72);
 opacity: 0.75;
 }
 100% {
 transform: scaleX(1);
 opacity: 1;
 }
 }

 @keyframes teacherTabContentIn {
 0% {
 opacity: 0.92;
 transform: translateY(4px);
 }
 100% {
 opacity: 1;
 transform: translateY(0);
 }
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

export function TeacherMomentsPage({ teacher, learners = [], onBack, onChanged }: any) {
 const [loading, setLoading] = useState(true)
 const [moments, setMoments] = useState<any[]>([])
 const [openImage, setOpenImage] = useState('')
 const [reactionMoment, setReactionMoment] = useState<any>(null)
 const [editingMoment, setEditingMoment] = useState<any>(null)
 const [deletingMoment, setDeletingMoment] = useState<any>(null)
 const [momentActionLoading, setMomentActionLoading] = useState(false)
 const [momentDraft, setMomentDraft] = useState<any>(null)
 const momentFileRef = useRef<HTMLInputElement | null>(null)
 const safeTeacherAvatarUrl =
 teacher?.photo_url ||
 teacher?.avatar_url ||
 teacher?.image_url ||
 teacher?.teacher_photo_url ||
 teacher?.profile_photo_url ||
 ''

 const load = async (quiet = false) => {
 if (!quiet) setLoading(true)

 try {
 const res = await fetch('/api/teacher/moments/list', { cache: 'no-store' })
 const json = await res.json().catch(() => ({}))

 if (!res.ok) throw new Error(json.error || 'Could not load Moments')

 const nextMoments = json.moments || []

 setMoments(nextMoments)
 onChanged?.(json.summary)

 try {
 window.localStorage.setItem(teacherMomentsCacheKey(teacher), JSON.stringify({
 moments: nextMoments,
 summary: json.summary || null,
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
 const raw = window.localStorage.getItem(teacherMomentsCacheKey(teacher))
 if (raw) {
 const cached = JSON.parse(raw)
 if (cached?.moments) {
 setMoments(cached.moments || [])
 if (cached.summary) onChanged?.(cached.summary)
 setLoading(false)
 usedCache = true
 }
 }
 } catch {}

 load(usedCache)
 }, [teacher?.id, teacher?.teacher_id, teacher?.email])


 const handleTeacherMomentFileChange = (event: any) => {
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


 const saveMomentEdit = async (note: string) => {
 if (!editingMoment?.id) return

 setMomentActionLoading(true)

 try {
 const res = await fetch('/api/teacher/moments', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 moment_id: editingMoment.id,
 note,
 }),
 })

 const json = await res.json().catch(() => ({}))
 if (!res.ok) throw new Error(json.error || 'Could not update Moment')

 setMoments(items => items.map(item => (
 item.id === editingMoment.id ? { ...item, note: json.moment?.note || null } : item
 )))

 setEditingMoment(null)
 toast.success('Moment updated')
 } catch (error: any) {
 toast.error(error.message || 'Could not update Moment')
 }

 setMomentActionLoading(false)
 }

 const deleteTeacherMoment = async () => {
 if (!deletingMoment?.id) return

 setMomentActionLoading(true)

 try {
 const res = await fetch('/api/teacher/moments', {
 method: 'DELETE',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 moment_id: deletingMoment.id,
 }),
 })

 const json = await res.json().catch(() => ({}))
 if (!res.ok) throw new Error(json.error || 'Could not delete Moment')

 setMoments(items => items.filter(item => item.id !== deletingMoment.id))
 setDeletingMoment(null)
 toast.success('Moment deleted')
 load()
 } catch (error: any) {
 toast.error(error.message || 'Could not delete Moment')
 }

 setMomentActionLoading(false)
 }

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

 <div style={{
 maxWidth: 520,
 height: '100dvh',
 margin: '0 auto',
 display: 'flex',
 flexDirection: 'column',
 background: T.bg,
 overflowY: 'auto',
 WebkitOverflowScrolling: 'touch',
 }}>
 <div style={{
 padding: 'calc(34px + env(safe-area-inset-top, 0px)) 24px 18px',
 background: '#FFFFFF',
 flexShrink: 0,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: 16,
 border: '0 solid transparent',
 boxShadow: 'none',
 }}>
 <button
 type="button"
 aria-label="Teacher profile"
 style={{
 width: 50,
 height: 50,
 borderRadius: '50%',
 border: '0 solid transparent',
 outline: 'none',
 background: '#F1F1F2',
 color: T.ink2,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: 15,
 fontWeight: 600,
 overflow: 'hidden',
 cursor: 'default',
 padding: 0,
 flexShrink: 0,
 boxShadow: 'none',
 appearance: 'none',
 WebkitAppearance: 'none',
 }}
 >
 {safeTeacherAvatarUrl ? (
 <img
 src={safeTeacherAvatarUrl}
 alt=""
 style={{
 width: '100%',
 height: '100%',
 objectFit: 'cover',
 display: 'block',
 borderRadius: '50%',
 border: 'none',
 boxShadow: 'none',
 }}
 />
 ) : (
 initials(teacher?.name)
 )}
 </button>

 <button
 type="button"
 onClick={() => momentFileRef.current?.click()}
 aria-label="Add Moment"
 style={{
 width: 48,
 height: 48,
 borderRadius: '50%',
 border: '0 solid transparent',
 outline: 'none',
 backgroundColor: '#f87645',
 color: '#FFFFFF',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 padding: 0,
 flexShrink: 0,
 boxShadow: 'none',
 appearance: 'none',
 WebkitAppearance: 'none',
 }}
 >
 <Plus size={27} strokeWidth={1.7} color="#FFFFFF" />
 </button>
 </div>

 <section style={{
 flex: 'none',
 minHeight: 0,
 overflowY: 'visible',
 overflowX: 'hidden',
 WebkitOverflowScrolling: 'touch',
 padding: '10px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
 background: T.bg,
 }}>
 <section
 className="teacher-main-tab-switcher-v1"
 style={{
 display: 'flex',
 alignItems: 'flex-end',
 gap: 16,
 padding: '0 0 26px',
 background: '#FFFFFF',
 }}
 >
 <button
 type="button"
 onClick={onBack}
 aria-label="View reports"
 style={{
 border: 'none',
 background: 'transparent',
 padding: 0,
 margin: 0,
 color: T.ink,
 fontSize: 18,
 lineHeight: 1,
 fontWeight: 600,
 letterSpacing: '-0.04em',
 fontFamily: 'inherit',
 cursor: 'pointer',
 }}
 >
 Reports
 </button>

 <button
 type="button"
 aria-label="View moments"
 style={{
 border: 'none',
 background: 'transparent',
 padding: 0,
 margin: 0,
 color: T.ink,
 fontSize: 18,
 lineHeight: 1,
 fontWeight: 600,
 letterSpacing: '-0.04em',
 fontFamily: 'inherit',
 cursor: 'default',
 position: 'relative',
 }}
 >
 Moments
 <span style={{
 position: 'absolute',
 left: 1,
 right: 1,
 bottom: -7,
 height: 1.4,
 borderRadius: 999,
 background: T.ink,
 transformOrigin: 'left center',
 animation: 'teacherTabUnderlineIn 150ms ease-out both',
 }} />
 </button>
 </section>

 <button
 type="button"
 onClick={() => momentFileRef.current?.click()}
 style={{
 width: '100%',
 height: 40,
 borderRadius: 999,
 border: 'none',
 outline: 'none',
 background: '#f7f7f7',
 color: '#6a6c6c',
 display: 'grid',
 gridTemplateColumns: '34px 1fr',
 alignItems: 'center',
 justifyContent: 'flex-start',
 textAlign: 'left',
 padding: '0 15px',
 margin: '0 0 22px',
 fontSize: 16,
 fontWeight: 500,
 letterSpacing: '-0.02em',
 fontFamily: 'inherit',
 cursor: 'pointer',
 boxShadow: 'none',
 appearance: 'none',
 WebkitAppearance: 'none',
 }}
 >
 <Plus size={18} strokeWidth={2.05} color="#6a6c6c" />
 <span style={{
 display: 'block',
 justifySelf: 'start',
 textAlign: 'left',
 }}>
 Share class moment
 </span>
 </button>

 <div style={{ animation: 'teacherTabContentIn 150ms ease-out both' }}>
 {loading ? (
 <LoadingDots />
 ) : moments.length === 0 ? (
 <SCEmptyState
 title="No Moments shared yet"
 text="Create a Moment from the plus button when there is something worth sharing."
 />
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
 {moments.map((moment, index) => (
 <TeacherPreviewMomentPost
 key={moment.id}
 moment={moment}
 teacher={teacher}
 isLast={index === moments.length - 1}
 onImage={setOpenImage}
 onReactions={() => setReactionMoment(moment)}
 onEdit={() => setEditingMoment(moment)}
 onDelete={() => setDeletingMoment(moment)}
 />
 ))}
 </div>
 )}
 </div>
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


 {editingMoment && (
 <EditMomentSheet
 moment={editingMoment}
 loading={momentActionLoading}
 onClose={() => setEditingMoment(null)}
 onSave={saveMomentEdit}
 />
 )}

 {deletingMoment && (
 <DeleteMomentSheet
 moment={deletingMoment}
 loading={momentActionLoading}
 onClose={() => setDeletingMoment(null)}
 onDelete={deleteTeacherMoment}
 />
 )}

 <input
 data-teacher-moments-upload-v267="true"
 ref={momentFileRef}
 type="file"
 accept="image/*,.pdf,.doc,.docx"
 style={{ display: 'none' }}
 onChange={handleTeacherMomentFileChange}
 />

 {momentDraft && (
 <TeacherMomentComposer
 draft={momentDraft}
 learners={learners}
 onClose={() => setMomentDraft(null)}
 onCreated={(summary: any) => {
 setMomentDraft(null)
 load()
 onChanged?.(summary)
 }}
 />
 )}
 </main>
 )
}

function TeacherPreviewMomentPost({ moment, teacher, isLast, onImage, onReactions, onEdit, onDelete }: any) {
 const teacherName = teacher?.name || 'Teacher'
 const isPrivate = moment.share_mode === 'child'
 const isImage = moment.file_type === 'image'
 const shareLabel = isPrivate ? 'Shared with parent' : 'Shared with class'
 const reactionTotal = Number(moment.reaction_count || 0)
 const [menuOpen, setMenuOpen] = useState(false)

 useEffect(() => {
 if (!menuOpen) return

 const close = () => setMenuOpen(false)
 const onKeyDown = (event: KeyboardEvent) => {
 if (event.key === 'Escape') close()
 }

 window.addEventListener('click', close)
 window.addEventListener('scroll', close, true)
 window.addEventListener('resize', close)
 window.addEventListener('keydown', onKeyDown)

 return () => {
 window.removeEventListener('click', close)
 window.removeEventListener('scroll', close, true)
 window.removeEventListener('resize', close)
 window.removeEventListener('keydown', onKeyDown)
 }
 }, [menuOpen])

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
 borderRadius: '50%',
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
 · {shareLabel}
 </span>&nbsp;</p>

 <div style={{
 display: 'flex',
 alignItems: 'center',
 gap: 6,
 flexShrink: 0,
 position: 'relative',
 }}>
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
 aria-label="Moment options"
 onClick={(event) => {
 event.stopPropagation()
 setMenuOpen(open => !open)
 }}
 style={{
 width: 30,
 height: 30,
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
 <MoreHorizontal size={18} strokeWidth={2} />
 </button>

 {menuOpen && (
 <>
 <div
 onClick={() => setMenuOpen(false)}
 style={{
 position: 'fixed',
 inset: 0,
 zIndex: 9000,
 background: 'transparent',
 }}
 />

 <div
 onClick={event => event.stopPropagation()}
 style={{
 position: 'absolute',
 top: 34,
 right: 0,
 zIndex: 9001,
 minWidth: 164,
 borderRadius: 16,
 background: T.white,
 boxShadow: '0 12px 34px rgba(15,23,42,0.08)',
 border: `1px solid ${T.border}`,
 padding: 6,
 }}
 >
 <button
 type="button"
 onClick={() => {
 setMenuOpen(false)
 onEdit?.()
 }}
 style={{
 width: '100%',
 minHeight: 36,
 borderRadius: 12,
 border: 'none',
 background: 'transparent',
 color: T.ink2,
 display: 'flex',
 alignItems: 'center',
 gap: 9,
 fontFamily: 'inherit',
 fontSize: 12.8,
 fontWeight: 520,
 cursor: 'pointer',
 padding: '0 10px',
 textAlign: 'left',
 }}
 >
 <Pencil size={14} strokeWidth={1.9} />
 Edit Moment
 </button>

 <div style={{ height: 1, background: 'var(--sc-border-soft)', margin: '5px 6px' }} />

 <button
 type="button"
 onClick={() => {
 setMenuOpen(false)
 onDelete?.()
 }}
 style={{
 width: '100%',
 minHeight: 36,
 borderRadius: 12,
 border: 'none',
 background: 'transparent',
 color: T.red,
 display: 'flex',
 alignItems: 'center',
 gap: 9,
 fontFamily: 'inherit',
 fontSize: 12.8,
 fontWeight: 520,
 cursor: 'pointer',
 padding: '0 10px',
 textAlign: 'left',
 }}
 >
 <Trash2 size={14} strokeWidth={1.9} />
 Delete Moment
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 {/* moments-caption-above-image-v429 */}
{moment.note && (
 <p style={{
 fontSize: 13.6,
 color: T.ink,
 lineHeight: 1.5,
 margin: '12px 0 0',
 whiteSpace: 'pre-wrap',
 }}>
 {moment.note}
 </p>
 )}

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
 borderRadius: 18,
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
 <ReactionCount Icon={Heart} value={moment.reaction_counts?.heart || 0} active={moment.reaction_counts?.heart > 0} tone="#E25563" />
 <ReactionCount Icon={ThumbsUp} value={moment.reaction_counts?.like || 0} active={moment.reaction_counts?.like > 0} tone="#3B82F6" />
 <ReactionCount Icon={Smile} value={moment.reaction_counts?.smile || 0} active={moment.reaction_counts?.smile > 0} tone="#F59E0B" fillOpacity={0.18} />

 <span style={{
 fontSize: 12.2,
 color: T.ink3,
 marginLeft: 2,
 }}>
 {reactionTotal > 0 ? `${reactionTotal} reactions` : ''}
 </span>
 </button>
 </div>
 </article>
 )
}

function ReactionCount({ Icon, value, active, tone = T.accent, fillOpacity = 1 }: any) {
 return (
 <span style={{
 minWidth: 40,
 height: 40,
 borderRadius: 999,
 border: 'none',
 background: 'transparent',
 color: active ? tone : T.ink,
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 5,
 padding: '0 7px',
 fontSize: 13,
 fontWeight: 560,
 }}>
 <Icon
 size={19}
 strokeWidth={active ? 2.25 : 2}
 fill={active ? tone : 'none'}
 fillOpacity={active ? fillOpacity : 1}
 />
 {Number(value) > 0 && (
 <span>{value}</span>
 )}
 </span>
 )
}



function EditMomentSheet({ moment, loading, onClose, onSave }: any) {
 const [note, setNote] = useState(moment?.note || '')

 return (
 <SCBottomSheet open={true} onClose={onClose} maxWidth={520}>
 <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
 <div>
 <p style={{ fontSize: 15, fontWeight: 620, color: 'var(--sc-ink)', margin: 0 }}>
 Edit Moment
 </p>
 <p style={{ fontSize: 12.5, color: 'var(--sc-ink-3)', lineHeight: 1.45, margin: '3px 0 0' }}>
 Update the caption parents see.
 </p>
 </div>

 <button
 type="button"
 onClick={onClose}
 aria-label="Close"
 className="sc-icon-button"
 style={{
 width: 34,
 height: 34,
 borderRadius: 999,
 border: 'none',
 background: 'var(--sc-soft)',
 color: 'var(--sc-ink-3)',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 padding: 0,
 flexShrink: 0,
 }}
 >
 <X size={16} strokeWidth={2} />
 </button>
 </div>

 <SCTextArea
 value={note}
 onChange={setNote}
 placeholder="Write a short caption..."
 rows={4}
 />

 <SCButton
 fullWidth
 disabled={loading}
 onClick={() => onSave(note)}
 style={{ marginTop: 12 }}
 >
 {loading ? 'Saving...' : 'Save changes'}
 </SCButton>
 </SCBottomSheet>
 )
}

function DeleteMomentSheet({ loading, onClose, onDelete }: any) {
 return (
 <SCBottomSheet open={true} onClose={onClose} maxWidth={520}>
 <p style={{ fontSize: 15, fontWeight: 620, color: 'var(--sc-ink)', margin: '0 0 5px' }}>
 Delete Moment?
 </p>

 <p style={{ fontSize: 13, color: 'var(--sc-ink-3)', lineHeight: 1.45, margin: 0 }}>
 This will remove this update from parents’ Moments view.
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 16 }}>
 <SCButton tone="secondary" disabled={loading} onClick={onClose} fullWidth>
 Cancel
 </SCButton>

 <SCButton disabled={loading} onClick={onDelete} fullWidth>
 {loading ? 'Deleting...' : 'Delete'}
 </SCButton>
 </div>
 </SCBottomSheet>
 )
}



function ReactionSheet({ moment, onClose }: any) {
 const reactions = moment.reactions || []

 return (
 <SCBottomSheet open={true} onClose={onClose} maxWidth={520}>
 <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
 <div>
 <h2 style={{ fontSize: 16, fontWeight: 620, color: 'var(--sc-ink)', margin: 0 }}>
 Reactions
 </h2>
 <p style={{ fontSize: 12.5, color: 'var(--sc-ink-3)', margin: '3px 0 0' }}>
 Parents who reacted to this Moment.
 </p>
 </div>

 <button type="button" onClick={onClose} aria-label="Close" className="sc-icon-button" style={{
 width: 34,
 height: 34,
 borderRadius: 999,
 border: 'none',
 background: 'var(--sc-soft)',
 color: 'var(--sc-ink-3)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 padding: 0,
 flexShrink: 0,
 }}>
 <X size={16} />
 </button>
 </div>

 {reactions.length === 0 ? (
 <SCEmptyState
 title="No reactions yet"
 text="Parent reactions will appear here."
 />
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column' }}>
 {reactions.map((item: any, index: number) => (
 <div key={`${item.child_id}-${item.reaction}-${index}`} style={{
 padding: '12px 0',
 borderBottom: index === reactions.length - 1 ? 'none' : '1px solid var(--sc-border)',
 display: 'flex',
 alignItems: 'center',
 gap: 10,
 }}>
 <div style={{
 width: 36,
 height: 36,
 borderRadius: 14,
 background: 'var(--sc-soft-2)',
 color: 'var(--sc-ink-2)',
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
 color: 'var(--sc-ink)',
 margin: 0,
 whiteSpace: 'nowrap',
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 }}>
 {item.child?.name || 'Parent'}
 </p>

 <p style={{
 fontSize: 12.2,
 color: 'var(--sc-ink-3)',
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
 background: 'var(--sc-soft)',
 color: 'var(--sc-ink-2)',
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
 </SCBottomSheet>
 )
}
