// @ts-nocheck
'use client'
// school-connect-v1-moments-no-blink-v1
// school-connect-v1-moments-instant-v2

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AdaptiveGlassProvider, useAdaptiveGlass } from '@/components/ui/AdaptiveGlass'
import { FileText, Heart, Smile, ThumbsUp, X, Plus, Pencil, Trash2, MoreHorizontal, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { TeacherMomentComposer } from '@/components/teacher/TeacherMomentComposer'
import { SCBottomSheet, SCButton, SCTextArea, SCEmptyState, SCTopBar, SCIconButton } from '@/components/ui'

const T = {
 ink: '#222222',
 ink2: '#737273',
 ink3: '#737273',
 border: 'rgba(0,0,0,0.045)',
 bg: '#FFFFFF',
 soft: '#f2f2f2',
 accent: '#737273',
 accentSoft: '#f2f2f2',
 white: '#FFFFFF',
 red: '#E25563',
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
 gap: 24,
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

function AdaptiveTeacherMomentNavContent({
 children,
 style = {},
}: any) {
 const { ref, sense } = useAdaptiveGlass()

 return (
   <span
     ref={ref as any}
     style={{
       color: sense.onLight
         ? '#202124'
         : '#FFFFFF',
       transition: 'color 180ms ease',
       ...style,
     }}
   >
     {children}
   </span>
 )
}

export function TeacherMomentsPage(props: any) {
 return (
   <AdaptiveGlassProvider>
     <TeacherMomentsPageInner {...props} />
   </AdaptiveGlassProvider>
 )
}

function TeacherMomentsPageInner({ teacher, learners = [], onBack, onChanged }: any) {
 const [momentsReady, setMomentsReady] = useState(false)
 const [moments, setMoments] = useState<any[]>([])
 const [openImage, setOpenImage] = useState('')
 const [reactionMoment, setReactionMoment] = useState<any>(null)
 const [editingMoment, setEditingMoment] = useState<any>(null)
 const [deletingMoment, setDeletingMoment] = useState<any>(null)
 const [momentActionLoading, setMomentActionLoading] = useState(false)
 const [momentDraft, setMomentDraft] = useState<any>(null)
 const momentFileRef = useRef<HTMLInputElement | null>(null)
 const momentsScrollRef = useRef<HTMLDivElement | null>(null)
 const [teacherNavAtTop, setTeacherNavAtTop] = useState(true)
 const [teacherNavVisible, setTeacherNavVisible] = useState(true)

 const safeTeacherAvatarUrl =
 teacher?.photo_url ||
 teacher?.avatar_url ||
 teacher?.image_url ||
 teacher?.teacher_photo_url ||
 teacher?.profile_photo_url ||
 ''

 useEffect(() => {
   const root = momentsScrollRef.current
   if (!root) return

   let ticking = false
   let hideTimer = 0

   const updateTeacherNavigation = () => {
     if (ticking) return

     ticking = true

     window.requestAnimationFrame(() => {
       const atTop = root.scrollTop <= 24

       setTeacherNavAtTop(atTop)
       setTeacherNavVisible(true)

       window.clearTimeout(hideTimer)

       if (!atTop) {
         hideTimer = window.setTimeout(() => {
           setTeacherNavVisible(false)
         }, 1200)
       }

       ticking = false
     })
   }

   updateTeacherNavigation()

   root.addEventListener(
     'scroll',
     updateTeacherNavigation,
     { passive: true }
   )

   return () => {
     window.clearTimeout(hideTimer)

     root.removeEventListener(
       'scroll',
       updateTeacherNavigation
     )
   }
 }, [])

 const classLabel = [teacher?.grade, teacher?.class_name].filter(Boolean).join(' · ') || 'Your class'
 const learnerCount = Array.isArray(learners) ? learners.length : 0
 const load = async (quiet = true) => {
  try {
    const res = await fetch('/api/teacher/moments/list', { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))

    if (!res.ok) throw new Error(json.error || 'Could not load Moments')

    const nextMoments = json.moments || []

    setMoments(current => {
      const byId = new Map((current || []).map((item: any) => [item.id, item]))

      const merged = (nextMoments || []).map((serverItem: any) => {
        const local = byId.get(serverItem.id)

        if (!local) return serverItem

        // While the server image is still warming up, keep the already-visible
        // local preview instead of flashing the card away and back.
        if (local.__syncing) {
          return {
            ...serverItem,
            file_url: local.file_url || serverItem.file_url,
            __syncing: true,
          }
        }

        return {
          ...local,
          ...serverItem,
        }
      })

      // Keep any optimistic Moment that Supabase has not returned yet.
      const serverIds = new Set((nextMoments || []).map((item: any) => item.id))
      const pending = (current || []).filter(
        (item: any) => item.__pending && !serverIds.has(item.id)
      )

      return [...pending, ...merged]
    })
    setMomentsReady(true)
    onChanged?.(json.summary)

    try {
      window.localStorage.setItem(teacherMomentsCacheKey(teacher), JSON.stringify({
        moments: nextMoments,
        summary: json.summary || null,
        saved_at: new Date().toISOString(),
      }))
    } catch {}
  } catch (error: any) {
    setMomentsReady(true)
    if (!quiet) toast.error(error.message || 'Could not load Moments')
  }
 }

 useEffect(() => {
  try {
    const raw = window.localStorage.getItem(teacherMomentsCacheKey(teacher))

    if (raw) {
      const cached = JSON.parse(raw)

      if (cached?.moments) {
        setMoments(cached.moments || [])
        if (cached.summary) onChanged?.(cached.summary)
        setMomentsReady(true)
      }
    }
  } catch {}

  void load(true)
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

  const editingId = editingMoment.id
  const previousMoment = editingMoment
  const nextNote = String(note || '').trim() || null

  setMoments(items => items.map(item => (
    item.id === editingId ? { ...item, note: nextNote } : item
  )))
  setEditingMoment(null)
  setMomentActionLoading(true)

  try {
    const res = await fetch('/api/teacher/moments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moment_id: editingId,
        note,
      }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Could not update Moment')

    toast.success('Moment updated')
  } catch (error: any) {
    setMoments(items => items.map(item => (
      item.id === editingId ? previousMoment : item
    )))
    toast.error(error.message || 'Could not update Moment')
  }

  setMomentActionLoading(false)
 }

 const deleteTeacherMoment = async () => {
  if (!deletingMoment?.id) return

  const removing = deletingMoment
  const removingId = deletingMoment.id

  setMoments(items => items.filter(item => item.id !== removingId))
  setDeletingMoment(null)
  setMomentActionLoading(true)

  try {
    const res = await fetch('/api/teacher/moments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moment_id: removingId,
      }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Could not delete Moment')

    toast.success('Moment deleted')
  } catch (error: any) {
    setMoments(items => [removing, ...items])
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

 <div
 style={{
 maxWidth: 520,
 height: '100dvh',
 margin: '0 auto',
 display: 'flex',
 flexDirection: 'column',
 background: T.bg,
 overflow: 'hidden',
 minHeight: 0,
 WebkitOverflowScrolling: 'touch',
 }}
 >
 {typeof document !== 'undefined'
 ? createPortal(
   <div
     style={{
       position: 'fixed',
       top: 'calc(14px + env(safe-area-inset-top, 0px))',
       left: 'max(16px, calc((100vw - 520px) / 2 + 16px))',
       right: 'max(16px, calc((100vw - 520px) / 2 + 16px))',
       zIndex: 100,
       height: 44,
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'space-between',
       gap: 12,
       pointerEvents: 'none',
       opacity:
         teacherNavAtTop || teacherNavVisible
           ? 1
           : 0,
       transform:
         teacherNavAtTop || teacherNavVisible
           ? 'translateY(0)'
           : 'translateY(-2px)',
       transition:
         'opacity 180ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
       willChange: 'opacity, transform',
     }}
   >
     <button
       type="button"
       onClick={onBack}
       aria-label="Back to reports"
       data-sc-adaptive-glass
       style={{
         width: 44,
         height: 44,
         borderRadius: 15,
         border: 'none',
         background: teacherNavAtTop
           ? 'transparent'
           : 'rgba(24,26,30,0.065)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         padding: 0,
         cursor: 'pointer',
         boxShadow: teacherNavAtTop
           ? 'none'
           : '0 6px 22px rgba(15,23,42,0.085)',
         backdropFilter: teacherNavAtTop
           ? 'none'
           : 'blur(16px) saturate(1.16)',
         WebkitBackdropFilter: teacherNavAtTop
           ? 'none'
           : 'blur(16px) saturate(1.16)',
         pointerEvents:
           teacherNavAtTop || teacherNavVisible
             ? 'auto'
             : 'none',
       }}
     >
       <AdaptiveTeacherMomentNavContent
         style={{
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
         }}
       >
         <ChevronLeft size={24} strokeWidth={1.85} />
       </AdaptiveTeacherMomentNavContent>
     </button>

     <button
       type="button"
       onClick={() => momentFileRef.current?.click()}
       aria-label="Add Moment"
       data-sc-adaptive-glass
       style={{
         width: 44,
         height: 44,
         borderRadius: 15,
         border: 'none',
         background: teacherNavAtTop
           ? 'transparent'
           : 'rgba(24,26,30,0.065)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         padding: 0,
         cursor: 'pointer',
         boxShadow: teacherNavAtTop
           ? 'none'
           : '0 6px 22px rgba(15,23,42,0.085)',
         backdropFilter: teacherNavAtTop
           ? 'none'
           : 'blur(16px) saturate(1.16)',
         WebkitBackdropFilter: teacherNavAtTop
           ? 'none'
           : 'blur(16px) saturate(1.16)',
         pointerEvents:
           teacherNavAtTop || teacherNavVisible
             ? 'auto'
             : 'none',
       }}
     >
       <AdaptiveTeacherMomentNavContent
         style={{
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
         }}
       >
         <Plus size={23} strokeWidth={1.85} />
       </AdaptiveTeacherMomentNavContent>
     </button>
   </div>,
   document.body
 )
 : null}

<section
 ref={momentsScrollRef}
 style={{
 flex: 1,
 minHeight: 0,
 overflowY: 'auto',
 overflowX: 'hidden',
 WebkitOverflowScrolling: 'touch',
 overscrollBehaviorY: 'contain',
 touchAction: 'pan-y',
 padding: '6px 6px calc(20px + env(safe-area-inset-bottom, 0px))',
 background: T.bg,
 }}
>
 <div
   aria-hidden="true"
   style={{
     height: 'calc(58px + env(safe-area-inset-top, 0px))',
     flexShrink: 0,
   }}
 />
 <div style={{ animation: 'teacherTabContentIn 150ms ease-out both' }}>
 {!momentsReady ? null : moments.length === 0 ? (
 <SCEmptyState
 title="No Moments shared yet"
 text="Create a Moment from the plus button when there is something worth sharing."
 />
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
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
 onCreated={(payload: any) => {
 setMomentDraft(null)

 if (payload?.phase === 'optimistic' && payload?.moment) {
  setMoments(items => [payload.moment, ...items])
  setMomentsReady(true)
  return
 }

 if (payload?.phase === 'confirmed' && payload?.moment) {
  const serverMoment = payload.moment
  const serverUrl = String(serverMoment?.file_url || '')

  setMoments(items => items.map(item => (
   item.id === payload.temp_id
    ? {
       ...serverMoment,
       file_url: item.file_url || serverUrl,
       __pending: false,
       __syncing: Boolean(serverUrl && item.file_url && item.file_url !== serverUrl),
      }
    : item
  )))

  // Keep the local preview visible until the permanent Supabase image is ready.
  if (serverUrl && typeof window !== 'undefined') {
   const image = new Image()

   image.onload = () => {
    setMoments(items => items.map(item => (
     item.id === serverMoment.id
      ? { ...item, file_url: serverUrl, __syncing: false }
      : item
    )))
   }

   image.onerror = () => {
    setMoments(items => items.map(item => (
     item.id === serverMoment.id
      ? { ...item, __syncing: false }
      : item
    )))
   }

   image.src = serverUrl
  } else {
   setMoments(items => items.map(item => (
    item.id === serverMoment.id
     ? { ...item, __syncing: false }
     : item
   )))
  }

  return
 }

 if (payload?.phase === 'failed') {
  setMoments(items => items.filter(item => item.id !== payload.temp_id))
 }
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
 const [menuAnchor, setMenuAnchor] = useState({
   top: 0,
   right: 12,
 })
 const isSyncingMoment = Boolean(moment?.__pending || moment?.__syncing)

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
   <article
     style={{
       position: 'relative',
       padding: 0,
       marginBottom: isLast ? 0 : 34,
       background: 'transparent',
     }}
   >
     <style>{`
       @keyframes scMomentSyncBar {
         from { transform: translateX(0); opacity: 0.45; }
         to { transform: translateX(160%); opacity: 0.9; }
       }
     `}</style>

     {isSyncingMoment ? (
       <div
         aria-hidden="true"
         style={{
           position: 'absolute',
           top: -2,
           left: 4,
           right: 4,
           height: 3,
           borderRadius: 999,
           overflow: 'hidden',
           pointerEvents: 'none',
           zIndex: 2,
           opacity: 0.8,
         }}
       >
         <div
           style={{
             width: '38%',
             height: '100%',
             borderRadius: 999,
             background: '#D7D7D7',
             animation:
               'scMomentSyncBar 900ms ease-in-out infinite alternate',
           }}
         />
       </div>
     ) : null}

     {isImage ? (
       <div
         style={{
           display: 'block',
           width: '100%',
         }}
       >
         <img
           src={moment.file_url}
           alt=""
           style={{
             width: '100%',
             maxWidth: '100%',
             height: 'auto',
             maxHeight: 520,
             objectFit: 'cover',
             display: 'block',
             borderRadius: 24,
             background: '#F7F7F7',
           }}
         />
       </div>
     ) : (
       <a
         href={moment.file_url}
         target="_blank"
         rel="noreferrer"
         style={{
           width: '100%',
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
         <div
           style={{
             width: 38,
             height: 38,
             borderRadius: 16,
             background: T.accentSoft,
             color: T.accent,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             flexShrink: 0,
           }}
         >
           <FileText size={18} strokeWidth={1.8} />
         </div>

         <div style={{ minWidth: 0 }}>
           <p
             style={{
               fontSize: 13.5,
               fontWeight: 560,
               color: T.ink,
               margin: 0,
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               whiteSpace: 'nowrap',
             }}
           >
             {moment.file_name || 'Document'}
           </p>

           <p
             style={{
               fontSize: 12.5,
               color: T.ink3,
               margin: '2px 0 0',
             }}
           >
             Open document
           </p>
         </div>
       </a>
     )}

     <div
       style={{
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'space-between',
         gap: 10,
         padding: '12px 8px 0',
       }}
     >
       <div
         style={{
           display: 'flex',
           alignItems: 'center',
           gap: 9,
           flex: 1,
           minWidth: 0,
         }}
       >
         <div
           style={{
             width: 34,
             height: 34,
             borderRadius: '50%',
             background: teacher?.photo_url
               ? `url(${teacher.photo_url}) center/cover`
               : T.accentSoft,
             color: T.accent,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             fontSize: 11.5,
             fontWeight: 560,
             overflow: 'hidden',
             flexShrink: 0,
           }}
         >
           {!teacher?.photo_url && initials(teacherName)}
         </div>

         <div style={{ minWidth: 0 }}>
           <div
             style={{
               display: 'flex',
               alignItems: 'baseline',
               gap: 7,
               minWidth: 0,
             }}
           >
             <span
               style={{
                 color: T.ink,
                 fontSize: 13.4,
                 fontWeight: 600,
                 overflow: 'hidden',
                 textOverflow: 'ellipsis',
                 whiteSpace: 'nowrap',
               }}
             >
               {teacherName}
             </span>

             <span
               style={{
                 color: '#74777D',
                 fontSize: 11.1,
                 fontWeight: 400,
                 whiteSpace: 'nowrap',
               }}
             >
               · {formatTimeAgo(moment.created_at)}
             </span>
           </div>

           <span
             style={{
               color: '#74777D',
               fontSize: 10.7,
               fontWeight: 400,
               display: 'block',
               marginTop: 3,
               lineHeight: 1.25,
             }}
           >
             {shareLabel}
           </span>
         </div>
       </div>

       <div
         style={{
           position: 'relative',
           flexShrink: 0,
         }}
       >
         <button
           type="button"
           aria-label="Moment options"
           onClick={(event) => {
             event.stopPropagation()

             const rect =
               event.currentTarget.getBoundingClientRect()

             setMenuAnchor({
               top: Math.min(
                 window.innerHeight - 112,
                 rect.bottom + 6
               ),
               right: Math.max(
                 12,
                 window.innerWidth - rect.right
               ),
             })

             setMenuOpen(open => !open)
           }}
           style={{
             width: 32,
             height: 32,
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
           <MoreHorizontal size={18} strokeWidth={1.85} />
         </button>

         {menuOpen && typeof document !== 'undefined'
           ? createPortal(
           <>
             <div
               onClick={() => setMenuOpen(false)}
               style={{
                 position: 'fixed',
                 inset: 0,
                 zIndex: 2147483199,
                 background: 'transparent',
               }}
             />

             <div
               onClick={event => event.stopPropagation()}
               style={{
                 position: 'fixed',
                 top: menuAnchor.top,
                 right: menuAnchor.right,
                 zIndex: 2147483200,
                 minWidth: 164,
                 borderRadius: 16,
                 background: T.white,
                 boxShadow:
                   '0 12px 30px rgba(15,23,42,0.06)',
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

               <div
                 style={{
                   height: 1,
                   background: 'var(--sc-border-soft)',
                   margin: '5px 6px',
                 }}
               />

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
           </>,
           document.body
         )
         : null}
       </div>
     </div>

     {moment.note ? (
       <div style={{ margin: '12px 8px 0' }}>
         <p
           style={{
             margin: 0,
             color: '#3D4045',
             fontSize: 12.6,
             fontWeight: 400,
             lineHeight: 1.52,
             whiteSpace: 'pre-wrap',
           }}
         >
           {moment.note}
         </p>
       </div>
     ) : null}

     <button
       type="button"
       onClick={onReactions}
       style={{
         display: 'inline-flex',
         alignItems: 'center',
         gap: 8,
         margin: '12px 8px 0',
         border: 'none',
         background: 'transparent',
         padding: 0,
         cursor: 'pointer',
         fontFamily: 'inherit',
         color: T.ink3,
       }}
     >
       <ReactionCount
         Icon={Heart}
         value={moment.reaction_counts?.heart || 0}
         active={moment.reaction_counts?.heart > 0}
         tone="#E25563"
       />

       <ReactionCount
         Icon={ThumbsUp}
         value={moment.reaction_counts?.like || 0}
         active={moment.reaction_counts?.like > 0}
         tone="#3B82F6"
       />

       <ReactionCount
         Icon={Smile}
         value={moment.reaction_counts?.smile || 0}
         active={moment.reaction_counts?.smile > 0}
         tone="#F59E0B"
         fillOpacity={0.18}
       />

       {reactionTotal > 0 ? (
         <span
           style={{
             fontSize: 12.2,
             color: T.ink3,
             marginLeft: 2,
           }}
         >
           {reactionTotal} reactions
         </span>
       ) : null}
     </button>
   </article>
 )
}

function ReactionCount({ Icon, value, active, tone = T.accent, fillOpacity = 1 }: any) {
 return (
 <span style={{
 minWidth: 34,
 height: 34,
 borderRadius: 999,
 border: 'none',
 background: 'transparent',
 color: active ? tone : T.ink3,
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 5,
 padding: '0 5px',
 fontSize: 13,
 fontWeight: 560,
 }}>
 <Icon
 size={18}
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
 <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--sc-ink)', margin: 0 }}>
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
 <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--sc-ink)', margin: '0 0 5px' }}>
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
 <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--sc-ink)', margin: 0 }}>
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
