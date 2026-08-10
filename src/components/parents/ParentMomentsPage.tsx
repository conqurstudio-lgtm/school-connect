// @ts-nocheck
'use client'

import { useEffect, useState, useRef} from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, FileText, Heart, Smile, ThumbsUp, X, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { SCEmptyState, SCTopBar } from '@/components/ui'
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
      }

      @keyframes parentMomentDotBounce {
        0%, 80%, 100% { transform: scale(0.72); opacity: 0.45; }
        40% { transform: scale(1); opacity: 1; }
      }

      @keyframes parentMomentReactionFly {
        0% { transform: translate(-50%, 0) scale(0.65); opacity: 0; }
        18% { opacity: 1; }
        100% { transform: translate(-50%, -72px) scale(1.25); opacity: 0; }
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
 <div className="sc-parent-moments-page-v3" style={{
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

function ReactionBurstLayer({ bursts = [], insideReportShell = false }: any) {
 if (!bursts.length) return null

 return (
 <div style={{
 position: 'absolute',
 inset: 0,
 pointerEvents: 'none',
 zIndex: 6,
 overflow: insideReportShell ? 'visible' : 'hidden',
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

function ParentMomentsBackButton({ onClick, href, label = 'Back' }: any) {
 const content = (
 <span style={{
 width: 13,
 height: 13,
 borderLeft: '2.6px solid currentColor',
 borderBottom: '2.6px solid currentColor',
 borderRadius: 1.5,
 transform: 'rotate(45deg) translate(1px, -1px)',
 display: 'block',
 }} />
 )

 const sharedStyle = {
 width: 38,
 height: 38,
 borderRadius: 999,
 border: 'none',
 background: 'transparent',
 color: '#252525',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 flexShrink: 0,
 padding: 0,
 textDecoration: 'none',
 } as any

 if (href) {
 return (
 <a
 href={href}
 aria-label={label}
 className="sc-parent-moments-teacher-back-v4"
 style={sharedStyle}
 >
 {content}
 </a>
 )
 }

 return (
 <button
 type="button"
 onClick={onClick}
 aria-label={label}
 className="sc-parent-moments-teacher-back-v4"
 style={sharedStyle}
 >
 {content}
 </button>
 )
}

export function ParentMomentsPage({ token, embedded = false, onClose, insideReportShell = false }: { token: string, embedded?: boolean, onClose?: () => void, insideReportShell?: boolean }) {
 useEffect(() => {
 if (insideReportShell) return
 const html = document.documentElement
 const body = document.body

 const previous = {
 htmlOverflow: html.style.overflow,
 htmlOverscroll: html.style.overscrollBehavior,
 htmlBackground: html.style.background,
 bodyOverflow: body.style.overflow,
 bodyOverscroll: body.style.overscrollBehavior,
 bodyBackground: body.style.background,
 bodyTouchAction: body.style.touchAction,
 }

 html.style.overflow = 'hidden'
 html.style.overscrollBehavior = 'none'
 html.style.background = '#FFFFFF'

 body.style.overflow = 'hidden'
 body.style.overscrollBehavior = 'none'
 body.style.background = '#FFFFFF'
 body.style.touchAction = 'pan-y'

 return () => {
 html.style.overflow = previous.htmlOverflow
 html.style.overscrollBehavior = previous.htmlOverscroll
 html.style.background = previous.htmlBackground

 body.style.overflow = previous.bodyOverflow
 body.style.overscrollBehavior = previous.bodyOverscroll
 body.style.background = previous.bodyBackground
 body.style.touchAction = previous.bodyTouchAction
 }
 }, [insideReportShell])

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
 if (!moment?.id || reacting === moment.id) return

 const previousMomentsSnapshot = moments

 addReactionBurst(moment.id, reaction)

 const optimisticApply = (current: any[]) => current.map(item => {
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
 })

 setMoments(optimisticApply)
 setReacting(moment.id)

 try {
 const res = await fetch('/api/parent/moments/react', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 token,
 child_id: child?.id || moment?.child_id || moment?.recipient?.child_id || '',
 moment_id: moment.id,
 reaction,
 }),
 })

 const json = await res.json().catch(() => ({}))

 if (!res.ok || json?.error) {
 throw new Error(json?.error || 'Could not react')
 }

 const serverCounts = json?.reaction_counts || null

 if (serverCounts) {
 setMoments(current => current.map(item => {
 if (item.id !== moment.id) return item

 const nextCounts = {
 heart: Number(serverCounts.heart || 0),
 like: Number(serverCounts.like || 0),
 smile: Number(serverCounts.smile || 0),
 }

 return {
 ...item,
 reaction,
 reaction_counts: nextCounts,
 reaction_count: Number(json.reaction_count ?? (nextCounts.heart + nextCounts.like + nextCounts.smile)),
 }
 }))
 }
 } catch (error: any) {
 setMoments(previousMomentsSnapshot)
 toast.error(error?.message || 'Could not react')
 } finally {
 setReacting('')
 }
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
 minHeight: insideReportShell ? 'auto' : '100dvh',
 height: insideReportShell ? 'auto' : '100dvh',
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
 height: insideReportShell ? 'auto' : '100dvh',
 margin: '0 auto',
 display: 'flex',
 flexDirection: 'column',
 background: T.bg,
 }}>
 {!insideReportShell ? (
 <SCTopBar
 title="Moments"
 align="left"
 compact
 left={
 embedded ? (
 <ParentMomentsBackButton onClick={onClose} label="Back" />
 ) : (
 <ParentMomentsBackButton onClick={() => { window.location.href = `/report/${token}` }} label="Back to report" />
 )
 }
 />
 ) : null}

 <section style={{
 flex: insideReportShell ? 'initial' : 1,
 minHeight: insideReportShell ? 'auto' : 0,
 overflowY: insideReportShell ? 'visible' : 'auto',
 overflowX: 'hidden',
 WebkitOverflowScrolling: insideReportShell ? undefined : 'touch',
 padding: insideReportShell ? '0 0 18px' : '16px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
 background: T.bg,
 }}>
 

 {true && (
 <div style={{
 display: 'flex',
 alignItems: 'center',
 gap: 22,
 width: '100%',
 padding: '0 2px',
 margin: '0 0 18px',
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
 text={loading ? 'Getting the latest updates.' : 'Moments shared by the teacher will appear here.'}
 />
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: insideReportShell ? 22 : 28 }}>
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
 insideReportShell={insideReportShell}
 />
 ))}
 </div>
 )}
 </section>
 </div>

 {openImage && createPortal(
 <div
 onClick={() => setOpenImage('')}
 role="dialog"
 aria-modal="true"
  style={{
  position: 'fixed',
  inset: 0,
  zIndex: 2147483000,
  background: '#101114',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  boxSizing: 'border-box',
  cursor: 'zoom-out',
  overflow: 'hidden',
  }}
 >
 <button  type="button"
 aria-label="Close image preview"
 onClick={event => {
 event.stopPropagation()
 setOpenImage('')
 }}
 style={{
 position: 'fixed',
 top: 'calc(14px + env(safe-area-inset-top, 0px))',
 right: 14,
 width: 40,
 height: 40,
 borderRadius: 999,
 border: '1px solid rgba(255,255,255,0.16)',
 background: 'rgba(255,255,255,0.10)',
 color: '#FFFFFF',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 padding: 0,
 cursor: 'pointer',
 zIndex: 2147483001,
 backdropFilter: 'blur(12px)',
 WebkitBackdropFilter: 'blur(12px)',
 }}
 >
 <X size={20} strokeWidth={2.2} />
 </button>

 <img
 src={openImage}
 alt=""
 decoding="async"
 loading="eager"
 fetchPriority="high" 
 onClick={event => event.stopPropagation()}
  style={{
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
  borderRadius: 0,
  background: '#101114',
  boxShadow: 'none',
  }}
 />
 </div>,
 document.body
 )}
 </main>
 )
}


function ParentReactionFXButton({
 moment,
 reactionKey,
 Icon,
 active,
 count,
 reacting,
 onReact,
}: any) {
 const color = reactionTone(reactionKey)

 const handleClick = (event: any) => {
 event.preventDefault()
 event.stopPropagation()
 onReact(moment, reactionKey)
 }

 return (
 <button
 type="button"
 onClick={handleClick}
 aria-label={reactionKey}
 disabled={reacting === moment?.id}
 style={{
 minHeight: 40,
 minWidth: 48,
 borderRadius: 999,
 border: 'none',
 background: 'transparent',
 color: active ? color : T.ink2,
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 6,
 padding: count > 0 ? '0 12px' : '0 11px',
 cursor: reacting === moment?.id ? 'default' : 'pointer',
 opacity: reacting === moment?.id ? 0.66 : 1,
 fontFamily: 'inherit',
 fontSize: 13,
 fontWeight: 650,
 lineHeight: 1,
 boxShadow: 'none',
 WebkitTapHighlightColor: 'transparent',
 touchAction: 'manipulation',
 transition: 'transform 160ms ease, background 160ms ease, border-color 160ms ease',
 transform: 'none',
 }}
 >
 <Icon
 size={19}
 strokeWidth={active ? 2.35 : 2}
 fill={active && reactionKey !== 'like' ? color : 'none'}
 fillOpacity={active && reactionKey === 'smile' ? 0.18 : 1}
 />

 {count > 0 ? (
 <span style={{
 color: active ? color : T.ink3,
 fontSize: 12.8,
 fontWeight: 650,
 lineHeight: 1,
 }}>
 {count}
 </span>
 ) : null}
 </button>
 )
}


function MomentPost({ moment, isLast, onImage, onReact, reacting, bursts = [], imageIndex = 0, insideReportShell = false }: any) {
 const teacherName = moment.teacher?.name || 'Teacher'
 const isPrivate = moment.share_mode === 'child'
 const isImage = moment.file_type === 'image'
 const shareLabel = isPrivate ? 'Shared with parent' : 'Shared with class'
 const [teacherInfoOpen, setTeacherInfoOpen] = useState(false)

 const teacherPhoto =
 moment.teacher?.photo_url ||
 moment.teacher?.avatar_url ||
 moment.teacher?.image_url ||
 ''

 const schoolName =
 moment.school?.name ||
 moment.school_name ||
 moment.teacher?.school_name ||
 moment.teacher?.school?.name ||
 ''

 const childName =
 moment.child?.name ||
 moment.child_name ||
 moment.learner_name ||
 'Your child'

 const childFirstName = String(childName || '').trim().split(/\s+/)[0] || 'Your child'
 const childTeacherLabel = childFirstName === 'Your child'
 ? 'Your child’s teacher'
 : `${childFirstName}${childFirstName.toLowerCase().endsWith('s') ? '’' : '’s'} teacher`
 const [imageReady, setImageReady] = useState(false)

 return (
 <article className="sc-parent-moment-post-v414" style={{
 width: '100%',
 boxSizing: 'border-box',
 display: 'grid',
 gridTemplateColumns: '38px 1fr',
 gap: 10,
 padding: insideReportShell ? '0 0 22px' : '0 0 24px',
 borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
 background: 'transparent',
 }}>
 <div style={{ position: 'relative', flexShrink: 0 }}>
 {/* parent-moment-teacher-avatar-popup-v433 */}
 <button
 type="button"
 onClick={() => setTeacherInfoOpen(true)}
 aria-label="View teacher information"
 style={{
 width: 38,
 height: 38,
 borderRadius: '50%',
 border: '1px solid rgba(37,37,37,0.10)',
 background: teacherPhoto ? `url(${teacherPhoto}) center/cover` : T.soft,
 color: T.ink2,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: 11,
 fontWeight: 620,
 letterSpacing: '-0.01em',
 overflow: 'hidden',
 cursor: 'pointer',
 fontFamily: 'inherit',
 boxShadow: '0 6px 16px rgba(0,0,0,0.045)',
 }}
 >
 {!teacherPhoto && initials(teacherName)}
 </button>

 {teacherInfoOpen && (
 <div style={{
 position: 'absolute',
 top: 46,
 left: 0,
 zIndex: 9005,
 width: 'min(292px, calc(100vw - 44px))',
 borderRadius: 22,
 border: '1px solid rgba(37,37,37,0.08)',
 background: '#FFFFFF',
 boxShadow: '0 18px 46px rgba(0,0,0,0.14)',
 padding: 14,
 }}>
 <div style={{
 display: 'flex',
 alignItems: 'flex-start',
 gap: 11,
 }}>
 <div style={{
 width: 42,
 height: 42,
 borderRadius: '50%',
 background: teacherPhoto ? `url(${teacherPhoto}) center/cover` : T.soft,
 color: T.ink2,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: 12,
 fontWeight: 640,
 flexShrink: 0,
 overflow: 'hidden',
 }}>
 {!teacherPhoto && initials(teacherName)}
 </div>

 <div style={{ minWidth: 0, flex: 1 }}>
 <p style={{
 fontSize: 14,
 fontWeight: 620,
 color: T.ink,
 letterSpacing: '-0.02em',
 margin: '1px 0 4px',
 }}>
 {teacherName}
 </p>

 <p style={{
 fontSize: 12.6,
 color: T.ink2,
 lineHeight: 1.35,
 margin: 0,
 }}>
 {childTeacherLabel}
 </p>

 {schoolName ? (
 <p style={{
 fontSize: 12.3,
 color: T.ink2,
 lineHeight: 1.35,
 margin: '9px 0 0',
 }}>
 {schoolName}
 </p>
 ) : null}
 </div>

 <button
 type="button"
 onClick={() => setTeacherInfoOpen(false)}
 aria-label="Close teacher information"
 style={{
 width: 26,
 height: 26,
 borderRadius: '50%',
 border: 'none',
 background: T.soft,
 color: T.ink2,
 cursor: 'pointer',
 fontFamily: 'inherit',
 fontSize: 16,
 lineHeight: 1,
 flexShrink: 0,
 }}
 >
 ×
 </button>
 </div>
 </div>
 )}
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
 maxWidth: '100%',
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
 <ReactionBurstLayer bursts={bursts} insideReportShell={insideReportShell} />
 </div>
 <div style={{
 display: 'flex',
 // parent-reactions-clean-v436
 marginLeft: 0,
 width: '100%',
 alignItems: 'center',
 gap: 7,
 marginTop: 12,
 position: 'relative',
 zIndex: 30,
 pointerEvents: 'auto',
 }}>
 {[
 ['heart', Heart],
 ['like', ThumbsUp],
 ['smile', Smile],
 ].map(([key, Icon]: any) => {
 const active = moment.reaction === key
 const count = Number(moment.reaction_counts?.[key] || 0)

 return (
 <ParentReactionFXButton
 key={key}
 moment={moment}
 reactionKey={key}
 Icon={Icon}
 active={active}
 count={count}
 reacting={reacting}
 onReact={onReact}
 />
 )
 })}

 </div>
 </div>
 </article>
 )
}
