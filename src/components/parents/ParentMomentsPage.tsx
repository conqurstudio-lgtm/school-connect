// @ts-nocheck
'use client'

import { useEffect, useState, useRef} from 'react'
import { AdaptiveGlassProvider, useAdaptiveGlass } from '@/components/ui/AdaptiveGlass'
import { createPortal } from 'react-dom'
import { ArrowLeft, FileText, Heart, Smile, ThumbsUp, X, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { SCEmptyState, SCTopBar } from '@/components/ui'

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
 right: `${14 + (index % 3) * 8}px`,
 bottom: `${14 + (index % 2) * 5}px`,
 fontSize: 30,
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

function AdaptiveMomentNavContent({
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

export function ParentMomentsPage(props: {
  token: string
  embedded?: boolean
  onClose?: () => void
  insideReportShell?: boolean
}) {
  return (
    <AdaptiveGlassProvider>
      <ParentMomentsPageInner {...props} />
    </AdaptiveGlassProvider>
  )
}


function ParentMomentsPageInner({ token, embedded = false, onClose, insideReportShell = false }: { token: string, embedded?: boolean, onClose?: () => void, insideReportShell?: boolean }) {

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

 if (insideReportShell) {
 html.style.overflow = 'auto'
 html.style.overscrollBehavior = 'auto'
 html.style.background = '#FFFFFF'

 body.style.overflow = 'auto'
 body.style.overscrollBehavior = 'auto'
 body.style.background = '#FFFFFF'
 body.style.touchAction = 'pan-y'
 } else {
 html.style.overflow = 'hidden'
 html.style.overscrollBehavior = 'none'
 html.style.background = '#FFFFFF'

 body.style.overflow = 'hidden'
 body.style.overscrollBehavior = 'none'
 body.style.background = '#FFFFFF'
 body.style.touchAction = 'pan-y'
 }

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
 const [momentViewer, setMomentViewer] = useState<any>(null)
 const [reacting, setReacting] = useState('')
 const [reactionBursts, setReactionBursts] = useState<any[]>([])
 const [nextCursor, setNextCursor] = useState<string | null>(null)
 const [hasMoreMoments, setHasMoreMoments] = useState(false)
 const [loadingMore, setLoadingMore] = useState(false)
 const momentsScrollRef = useRef<HTMLElement | null>(null)
 const loadMoreRef = useRef<HTMLDivElement | null>(null)
 const directFeedOpenedRef = useRef(false)
 const [initialFeedBoot, setInitialFeedBoot] =
   useState(insideReportShell)
 const gridReturnMomentIdRef = useRef<string | null>(null)
 const returningFromGridRef = useRef(false)
 const gridRevealRef = useRef<HTMLDivElement | null>(null)
 const [momentsMenuOpen, setMomentsMenuOpen] = useState(false)

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
 setNextCursor(json.next_cursor || null)
 setHasMoreMoments(Boolean(json.has_more))

 try {
 window.localStorage.setItem(parentMomentsCacheKey(token), JSON.stringify({
 child: nextChild,
 moments: nextMoments,
 next_cursor: json.next_cursor || null,
 has_more: Boolean(json.has_more),
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
      const savedAt = new Date(cached?.saved_at || 0).getTime()
      const age = Date.now() - savedAt

      // Normal standalone Moments may keep using its existing cache.
      // Inside the report shell, only trust very fresh prefetched data.
      const cacheIsFreshEnough =
        !insideReportShell ||
        (
          Number.isFinite(savedAt) &&
          age >= 0 &&
          age < 60 * 1000
        )

      if (cached?.moments && cacheIsFreshEnough) {
        setChild(cached.child || null)
        setMoments(cached.moments || [])
        setNextCursor(cached.next_cursor || null)
        setHasMoreMoments(Boolean(cached.has_more))
        setLoading(false)
        usedCache = true
      }
    }
  } catch {}

  if (insideReportShell && !usedCache) {
    setLoading(true)
    setMoments([])
    load(false)
    return
  }

  // Cached Moments appear immediately while fresh data replaces them quietly.
  load(usedCache)
  }, [token, insideReportShell])


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

 const renderedMoments = visibleMoments

 const galleryImageMoments = insideReportShell
   ? renderedMoments.filter((moment: any) => moment.file_type === 'image' && moment.file_url)
   : []

 const galleryOtherMoments = insideReportShell
   ? renderedMoments.filter((moment: any) => moment.file_type !== 'image')
   : []

 const viewerMoment = insideReportShell && momentViewer?.momentId
   ? visibleMoments.find(
       (moment: any) => moment.id === momentViewer.momentId
     ) || null
   : null

 const openMomentViewer = (
   momentId: string,
   rect: DOMRect | {
     top: number
     left: number
     width: number
     height: number
   }
 ) => {
   const moment = visibleMoments.find(
     (item: any) => item.id === momentId
   )

   if (!moment) return

   setMomentViewer({
     momentId,
     source: 'grid',
     origin: {
       top: rect.top,
       left: rect.left,
       width: rect.width,
       height: rect.height,
     },
   })
 }

 useEffect(() => {
   if (
     !insideReportShell ||
     loading ||
     directFeedOpenedRef.current ||
     momentViewer
   ) {
     return
   }

   const firstMoment = galleryImageMoments[0]

   if (!firstMoment || typeof window === 'undefined') {
     if (!firstMoment) {
       setInitialFeedBoot(false)
     }

     return
   }

   directFeedOpenedRef.current = true
   setInitialFeedBoot(false)

   const viewportWidth = Math.max(
     320,
     window.innerWidth || 390
   )

   const viewportHeight = Math.max(
     568,
     window.innerHeight || 844
   )

   const edge = 4

   const width = Math.min(
     520,
     viewportWidth - edge * 2
   )

   const left = Math.max(
     edge,
     (viewportWidth - width) / 2
   )

   const height = Math.max(
     300,
     Math.min(viewportHeight * 0.58, 520)
   )

   setMomentViewer({
     momentId: firstMoment.id,
     source: 'feed',
     origin: {
       top: 8,
       left,
       width,
       height,
     },
   })
 }, [
   insideReportShell,
   loading,
   galleryImageMoments,
   momentViewer,
 ])

 useEffect(() => {
   if (returningFromGridRef.current) {
     returningFromGridRef.current = false
     return
   }

   setMomentViewer(null)
 }, [momentScope])

 const loadOlderMoments = async () => {
   if (
     loadingMore ||
     !hasMoreMoments ||
     !nextCursor
   ) return

   setLoadingMore(true)

   try {
     const res = await fetch(
       `/api/parent/moments?token=${encodeURIComponent(token)}&cursor=${encodeURIComponent(nextCursor)}`,
       { cache: 'no-store' }
     )

     const json = await res.json().catch(() => ({}))

     if (!res.ok) {
       throw new Error(json.error || 'Could not load older Moments')
     }

     const incoming = Array.isArray(json.moments)
       ? json.moments
       : []

     setMoments(current => {
       const seen = new Set(
         current.map((moment: any) => moment.id)
       )

       const merged = [
         ...current,
         ...incoming.filter(
           (moment: any) => !seen.has(moment.id)
         ),
       ]

       try {
         window.localStorage.setItem(
           parentMomentsCacheKey(token),
           JSON.stringify({
             child,
             moments: merged,
             next_cursor: json.next_cursor || null,
             has_more: Boolean(json.has_more),
             saved_at: new Date().toISOString(),
           })
         )
       } catch {}

       return merged
     })

     setNextCursor(json.next_cursor || null)
     setHasMoreMoments(Boolean(json.has_more))
   } catch (error: any) {
     console.error(
       error?.message || 'Could not load older Moments'
     )
   } finally {
     setLoadingMore(false)
   }
 }

 useEffect(() => {
   const root = momentsScrollRef.current
   const target = loadMoreRef.current

   if (
     !root ||
     !target ||
     !hasMoreMoments ||
     !nextCursor
   ) return

   const observer = new IntersectionObserver(
     entries => {
       if (entries[0]?.isIntersecting) {
         loadOlderMoments()
       }
     },
     {
       root,
       rootMargin: '500px 0px',
       threshold: 0.01,
     }
   )

   observer.observe(target)

   return () => observer.disconnect()
 }, [
   hasMoreMoments,
   nextCursor,
   loadingMore,
   token,
   child,
 ])

 const returnGridToFeed = () => {
   if (
     !insideReportShell ||
     typeof window === 'undefined'
   ) {
     return
   }

   const imageMoments = moments.filter(
     (item: any) =>
       item.file_type === 'image' &&
       item.file_url
   )

   const rememberedId =
     gridReturnMomentIdRef.current

   const rememberedMoment =
     rememberedId
       ? imageMoments.find(
           (item: any) =>
             item.id === rememberedId
         )
       : null

   const targetMoment =
     rememberedMoment ||
     imageMoments[0]

   if (!targetMoment) return

   const viewportWidth = Math.max(
     320,
     window.innerWidth || 390
   )

   const viewportHeight = Math.max(
     568,
     window.innerHeight || 844
   )

   const edge = 4

   const width = Math.min(
     520,
     viewportWidth - edge * 2
   )

   const left = Math.max(
     edge,
     (viewportWidth - width) / 2
   )

   const height = Math.max(
     300,
     Math.min(
       viewportHeight * 0.58,
       520
     )
   )

   if (momentScope !== 'recent') {
     returningFromGridRef.current = true
     setMomentScope('recent')
   }

   setMomentViewer({
     momentId: targetMoment.id,
     source: 'feed',
     origin: {
       top: 8,
       left,
       width,
       height,
     },
   })
 }

 return (
 <main className="sc-screen-enter" style={{
 minHeight: '100dvh',
 height: insideReportShell ? 'auto' : '100dvh',
 overflow: insideReportShell ? 'visible' : 'hidden',
 background: T.bg,
 fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
 color: T.ink,
 overscrollBehavior: insideReportShell ? 'auto' : 'none',
 touchAction: 'pan-y',
 }}>
 <SafeStyle />

{insideReportShell && typeof document !== 'undefined' ? createPortal(
  <div
    style={{
      position: 'fixed',
      top: 'calc(14px + env(safe-area-inset-top, 0px))',
      left: 'max(16px, calc((100vw - 520px) / 2 + 16px))',
      right: 'max(16px, calc((100vw - 520px) / 2 + 16px))',
      zIndex: 2147482500,
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      pointerEvents: 'none',
    }}
  >
    <div
      role="tablist"
      aria-label="Moment collection"
      style={{
        height: 44,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'auto',
      }}
    >
      {[
        ['class', 'Class'],
        ['child', 'Child'],
      ].map(([key, label]: any) => {
        const active =
          momentScope === key

        return (
          <button
            key={key}
            type="button"
            role="tab"
            data-sc-adaptive-glass
            aria-selected={active}
            onClick={() =>
              setMomentScope(key)
            }
            style={{
              position: 'relative',
              height: 44,
              padding: '0 14px',
              borderRadius: 15,
              border: 'none',
              background: 'rgba(24,26,30,0.065)',
              color: '#FFFFFF',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: active ? 650 : 600,
              opacity: 1,
              letterSpacing: '-0.01em',
              cursor: 'pointer',
              boxShadow: '0 6px 22px rgba(15,23,42,0.085)',
              backdropFilter: 'blur(16px) saturate(1.16)',
              WebkitBackdropFilter: 'blur(16px) saturate(1.16)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <AdaptiveMomentNavContent
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {label}
            </AdaptiveMomentNavContent>
          </button>
        )
      })}
    </div>

    <button
      type="button"
      onClick={returnGridToFeed}
      aria-label="Close grid and return to Moments"
      data-sc-adaptive-glass
      style={{
        width: 44,
        height: 44,
        borderRadius: 15,
        border: 'none',
        background: 'rgba(24,26,30,0.065)',
        color: 'rgba(255,255,255,0.96)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        boxShadow: '0 6px 22px rgba(15,23,42,0.085)',
        backdropFilter: 'blur(16px) saturate(1.16)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.16)',
        WebkitTapHighlightColor:
          'transparent',
      }}
    >
      <AdaptiveMomentNavContent
        style={{
          position: 'relative',
          width: 17,
          height: 17,
          display: 'block',
        }}
      >
        <span style={{
          position: 'absolute',
          left: 8,
          top: 1,
          width: 1.5,
          height: 15,
          borderRadius: 999,
          background: 'currentColor',
          transform: 'rotate(45deg)',
        }} />

        <span style={{
          position: 'absolute',
          left: 8,
          top: 1,
          width: 1.5,
          height: 15,
          borderRadius: 999,
          background: 'currentColor',
          transform: 'rotate(-45deg)',
        }} />
      </AdaptiveMomentNavContent>
    </button>
  </div>,
  document.body
) : null}

 <div style={{
 maxWidth: 520,
 height: insideReportShell ? 'auto' : '100dvh',
 minHeight: insideReportShell ? '100dvh' : 0,
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

 <section
 ref={momentsScrollRef}
 style={{
 flex: insideReportShell ? 'none' : 1,
 minHeight: 0,
 overflowY: insideReportShell ? 'visible' : 'auto',
 overflowX: 'hidden',
 WebkitOverflowScrolling: insideReportShell ? 'auto' : 'touch',
 overscrollBehaviorY: insideReportShell ? 'auto' : 'contain',
 touchAction: 'pan-y',
 padding: insideReportShell ? '6px 0 calc(26px + env(safe-area-inset-bottom, 0px))' : '16px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
 background: T.bg,
 }}>
 

  <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  width: '100%',
  padding: '0 2px',
  margin: insideReportShell ? '0 0 6px' : '0 0 14px',
  position: 'relative',
  }}>
  <div style={{ minWidth: 0, display: insideReportShell ? 'none' : 'block' }}>
  <p style={{
  margin: 0,
  color: T.ink,
  fontSize: 13.8,
  fontWeight: 560,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  }}>
  {momentScope === 'recent' ? 'Recent moments' : momentScope === 'child' ? 'Child moments' : 'Class moments'}
  </p>
  <p style={{
  margin: '4px 0 0',
  color: T.ink3,
  fontSize: 11.6,
  fontWeight: 500,
  lineHeight: 1.2,
  }}>
  {visibleMoments.length} {visibleMoments.length === 1 ? 'update' : 'updates'}
  </p>
  </div>

  <button
  type="button"
  aria-label="Filter moments"
  onClick={(event) => {
  event.stopPropagation()
  setMomentsMenuOpen(open => !open)
  }}
  style={{
  width: 38,
  height: 38,
  borderRadius: 999,
  border: 'none',
  background: 'transparent',
  color: T.ink,
  display: insideReportShell ? 'none' : 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'inherit',
  fontSize: 0,
  lineHeight: 1,
  position: insideReportShell ? 'fixed' : 'relative',
  top: insideReportShell ? 'calc(8px + env(safe-area-inset-top, 0px))' : 'auto',
  right: insideReportShell ? 'max(16px, calc((100vw - 520px) / 2 + 16px))' : 'auto',
  zIndex: insideReportShell ? 40 : 'auto',
  WebkitTapHighlightColor: 'transparent',
  }}
  >
  <span style={{
  width: 18,
  height: 13,
  display: 'inline-flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  }}>
  <span style={{ height: 2, borderRadius: 999, background: 'currentColor', display: 'block' }} />
  <span style={{ height: 2, borderRadius: 999, background: 'currentColor', display: 'block', width: 13, marginLeft: 'auto' }} />
  <span style={{ height: 2, borderRadius: 999, background: 'currentColor', display: 'block' }} />
  </span>
  </button>

  {!insideReportShell && momentsMenuOpen && (
  <>
  <div
  onClick={() => setMomentsMenuOpen(false)}
  style={{
  position: 'fixed',
  inset: 0,
  zIndex: 8998,
  background: 'transparent',
  }}
  />

  <div
  onClick={event => event.stopPropagation()}
  style={{
  position: insideReportShell ? 'fixed' : 'absolute',
  top: insideReportShell ? 'calc(52px + env(safe-area-inset-top, 0px))' : 42,
  right: insideReportShell ? 'max(16px, calc((100vw - 520px) / 2 + 16px))' : 0,
  zIndex: 8999,
  minWidth: 178,
  borderRadius: 20,
  background: T.white,
  border: `1px solid ${T.border}`,
  boxShadow: '0 18px 46px rgba(15,23,42,0.12)',
  padding: 7,
  }}
  >
  <div style={{
  padding: '7px 10px 8px',
  borderBottom: `1px solid ${T.border}`,
  marginBottom: 5,
  }}>
  <p style={{
  margin: 0,
  fontSize: 10.5,
  fontWeight: 680,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: T.ink3,
  lineHeight: 1.1,
  }}>
  Showing
  </p>
  <p style={{
  margin: '3px 0 0',
  fontSize: 13,
  fontWeight: 640,
  letterSpacing: '-0.02em',
  color: T.ink,
  lineHeight: 1.15,
  }}>
  {momentScope === 'recent' ? 'Recent moments' : momentScope === 'child' ? 'Child moments' : 'Class moments'}
  </p>
  </div>

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
  onClick={() => {
  setMomentScope(key)
  setMomentsMenuOpen(false)
  }}
  style={{
  width: '100%',
  minHeight: 40,
  borderRadius: 14,
  border: 'none',
  background: active ? T.soft : 'transparent',
  color: active ? T.ink : T.ink2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  fontFamily: 'inherit',
  fontSize: 12.8,
  fontWeight: active ? 620 : 520,
  cursor: 'pointer',
  padding: '0 10px',
  textAlign: 'left',
  }}
  >
  <span>{label}</span>
  {active ? <span style={{ fontSize: 12, color: T.ink3 }}>✓</span> : null}
  </button>
  )
  })}
  </div>
  </>
  )}
  </div>

 {visibleMoments.length === 0 ? (
   loading ? (
     insideReportShell ? <MomentGalleryShell /> : null
   ) : (
     <SCEmptyState
       title="No Moments yet"
       text="Moments shared by the teacher will appear here."
     />
   )
 ) : insideReportShell ? (
   <div
     ref={gridRevealRef}
     style={{
       width: '100%',
       boxSizing: 'border-box',
       visibility: initialFeedBoot
         ? 'hidden'
         : 'visible',
     }}
   >
     {galleryImageMoments.length > 0 ? (
       <MomentGalleryGrid
         moments={galleryImageMoments}
         allMoments={renderedMoments}
         onOpen={openMomentViewer}
       />
     ) : null}

     {galleryOtherMoments.length > 0 ? (
       <div style={{
         display: 'flex',
         flexDirection: 'column',
         gap: 22,
         marginTop:
           galleryImageMoments.length > 0
             ? 22
             : 0,
       }}>
         {galleryOtherMoments.map((moment: any, index: number) => (
           <MomentPost
             key={moment.id}
             moment={moment}
             isLast={index === galleryOtherMoments.length - 1}
             onImage={setOpenImage}
             onReact={react}
             reacting={reacting === moment.id}
             imageIndex={index}
             bursts={reactionBursts.filter(
               item => item.momentId === moment.id
             )}
             insideReportShell={true}
           />
         ))}
       </div>
     ) : null}
   </div>
 ) : (
   <div style={{
     display: 'flex',
     flexDirection: 'column',
     gap: 28,
   }}>
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
         insideReportShell={false}
       />
     ))}
   </div>
 )}
 {hasMoreMoments ? (
   <div
     ref={loadMoreRef}
     aria-hidden="true"
     style={{
       width: '100%',
       height: 1,
       pointerEvents: 'none',
     }}
   />
 ) : null}

 </section>
 </div>

 {insideReportShell &&
 viewerMoment &&
 momentViewer?.origin &&
 typeof document !== 'undefined'
   ? createPortal(
       <MomentWhiteViewer
         moment={viewerMoment}
         moments={visibleMoments.filter(
           (item: any) =>
             item.file_type === 'image' &&
             item.file_url
         )}
         origin={momentViewer.origin}
         closeImmediately={momentViewer?.source === 'feed'}
         onShowGrid={() => {
           gridReturnMomentIdRef.current =
             momentViewer?.momentId || null

           if (momentScope === 'recent') {
             setMomentScope('class')
           }

           setMomentViewer(null)

           if (
             typeof window !== 'undefined' &&
             !window.matchMedia?.(
               '(prefers-reduced-motion: reduce)'
             ).matches
           ) {
             window.requestAnimationFrame(() => {
               window.requestAnimationFrame(() => {
                 gridRevealRef.current?.animate(
                   [
                     {
                       opacity: 1,
                       transform:
                         'scale(1.018) translateY(4px)',
                       filter: 'blur(1.5px)',
                     },
                     {
                       opacity: 1,
                       transform:
                         'scale(1) translateY(0)',
                       filter: 'blur(0px)',
                     },
                   ],
                   {
                     duration: 280,
                     easing:
                       'cubic-bezier(0.16, 1, 0.3, 1)',
                   }
                 )
               })
             })
           }
         }}
         onClosed={() => {
           if (
             momentViewer?.source === 'feed' &&
             typeof onClose === 'function'
           ) {
             onClose()
             return
           }

           setMomentViewer(null)
         }}
         onReact={react}
         reactingId={reacting}
         bursts={reactionBursts}
       />,
       document.body
     )
   : null}

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
  minWidth: 40,
 borderRadius: 999,
 border: 'none',
 background: 'transparent',
 color: active ? color : T.ink,
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 4,
 padding: '0 5px',
 cursor: reacting === moment?.id ? 'default' : 'pointer',
 opacity: reacting === moment?.id ? 0.66 : 1,
 fontFamily: 'inherit',
 fontSize: 12,
 fontWeight: 500,
 lineHeight: 1,
 boxShadow: 'none',
 WebkitTapHighlightColor: 'transparent',
 touchAction: 'manipulation',
 transition: 'transform 160ms ease, background 160ms ease, border-color 160ms ease',
 transform: 'none',
 }}
 >
 <Icon
 size={17}
 strokeWidth={active ? 1.85 : 1.55}
 fill={active && reactionKey !== 'like' ? color : 'none'}
 fillOpacity={active && reactionKey === 'smile' ? 0.18 : 1}
 />

 {count > 0 ? (
 <span style={{
 color: active ? color : T.ink,
 fontSize: 11.7,
 fontWeight: 600,
 lineHeight: 1,
 }}>
 {count}
 </span>
 ) : null}
 </button>
 )
}


function MomentGalleryShell() {
 const left = [
   { ratio: '4 / 5', caption: '72%' },
   { ratio: '4 / 6', caption: '84%' },
   { ratio: '4 / 4.6', caption: '66%' },
 ]

 const right = [
   { ratio: '4 / 5.4', caption: '78%' },
   { ratio: '4 / 5', caption: '88%' },
   { ratio: '4 / 6.1', caption: '70%' },
 ]

 const renderColumn = (items: any[]) => (
   <div style={{
     display: 'flex',
     flexDirection: 'column',
     gap: 'clamp(4px, calc(4px + (100vw - 390px) * 0.05), 7px)',
     minWidth: 0,
   }}>
     {items.map((item: any, index: number) => (
       <div
         key={index}
         aria-hidden="true"
         style={{
           width: '100%',
           minWidth: 0,
         }}
       >
         <div style={{
           width: '100%',
           aspectRatio: item.ratio,
           borderRadius: 18,
           background: '#F5F4F1',
         }} />


       </div>
     ))}
   </div>
 )

 return (
   <div
     aria-hidden="true"
     style={{
       display: 'grid',
       gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
       gap: 'clamp(4px, calc(4px + (100vw - 390px) * 0.05), 7px)',
       alignItems: 'start',
       width: '100%',
     }}
   >
     {renderColumn(left)}
     {renderColumn(right)}
   </div>
 )
}


function MomentGalleryGrid({
 moments = [],
 allMoments = [],
 onOpen,
}: any) {
 const left = moments.filter((_: any, index: number) => index % 2 === 0)
 const right = moments.filter((_: any, index: number) => index % 2 === 1)

 const renderColumn = (items: any[]) => (
   <div style={{
     display: 'flex',
     flexDirection: 'column',
     gap: 'clamp(4px, calc(4px + (100vw - 390px) * 0.05), 7px)',
     minWidth: 0,
   }}>
     {items.map((moment: any) => {
       const imageIndex = allMoments.findIndex(
         (item: any) => item.id === moment.id
       )

       return (
         <MomentGalleryTile
           key={moment.id}
           moment={moment}
           imageIndex={imageIndex}
           onOpen={(rect: any) => onOpen(moment.id, rect)}
         />
       )
     })}
   </div>
 )

 return (
   <div style={{
     display: 'grid',
     gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
     gap: 'clamp(4px, calc(4px + (100vw - 390px) * 0.05), 7px)',
     alignItems: 'start',
     width: '100%',
   }}>
     {renderColumn(left)}
     {renderColumn(right)}
   </div>
 )
}


function MomentSpotlightCard({
 moment,
 onClose,
 onReact,
 reacting,
 bursts = [],
}: any) {
 const teacherName = moment.teacher?.name || 'Teacher'

 const teacherPhoto =
   moment.teacher?.photo_url ||
   moment.teacher?.avatar_url ||
   moment.teacher?.image_url ||
   ''

 const isPrivate =
   moment.share_mode === 'child' ||
   moment.moment_scope === 'child'

 const shareLabel = isPrivate
   ? 'Shared with parent'
   : 'Shared with class'

 return (
   <article style={{
     width: '100%',
     boxSizing: 'border-box',
     background: '#FFFFFF',
     borderRadius: 24,
     border: '1px solid rgba(17,17,17,0.055)',
     boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
     overflow: 'hidden',
   }}>
     <div style={{
       display: 'flex',
       alignItems: 'center',
       gap: 10,
       padding: '12px 12px 10px',
     }}>
       <div style={{
         width: 36,
         height: 36,
         borderRadius: '50%',
         flexShrink: 0,
         background: teacherPhoto
           ? `url(${teacherPhoto}) center/cover`
           : T.soft,
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         color: T.ink2,
         fontSize: 11,
         fontWeight: 650,
         overflow: 'hidden',
       }}>
         {!teacherPhoto ? initials(teacherName) : null}
       </div>

       <div style={{
         minWidth: 0,
         flex: 1,
       }}>
         <div style={{
           display: 'flex',
           alignItems: 'baseline',
           gap: 5,
           minWidth: 0,
         }}>
           <span style={{
             color: T.ink,
             fontSize: 13.8,
             fontWeight: 650,
             overflow: 'hidden',
             textOverflow: 'ellipsis',
             whiteSpace: 'nowrap',
           }}>
             {teacherName}
           </span>

           <span style={{
             color: T.ink3,
             fontSize: 11.5,
             whiteSpace: 'nowrap',
           }}>
             · {shareLabel}
           </span>
         </div>

         <span style={{
           display: 'block',
           color: T.ink3,
           fontSize: 10.8,
           marginTop: 2,
         }}>
           {formatTimeAgo(moment.created_at)}
         </span>
       </div>

       <button
         type="button"
         onClick={onClose}
         aria-label="Close Moment"
         style={{
           width: 32,
           height: 32,
           borderRadius: 999,
           border: 'none',
           background: T.soft,
           color: T.ink2,
           display: 'inline-flex',
           alignItems: 'center',
           justifyContent: 'center',
           padding: 0,
           cursor: 'pointer',
           fontFamily: 'inherit',
           fontSize: 18,
           flexShrink: 0,
         }}
       >
         ×
       </button>
     </div>

     {moment.note ? (
       <p style={{
         margin: '1px 14px 12px',
         color: T.ink,
         fontSize: 13.8,
         lineHeight: 1.5,
         whiteSpace: 'pre-wrap',
       }}>
         {moment.note}
       </p>
     ) : null}

     <div style={{
       width: '100%',
       position: 'relative',
       padding: '0 10px',
       boxSizing: 'border-box',
     }}>
       <img
         src={moment.file_url}
         alt=""
         loading="eager"
         decoding="async"
         fetchPriority="high"
         style={{
           width: '100%',
           height: 'auto',
           display: 'block',
           objectFit: 'contain',
           borderRadius: 22,
           background: '#F7F6F3',
         }}
       />

       <ReactionBurstLayer
         bursts={bursts}
         insideReportShell={true}
       />
     </div>

     <div style={{
       display: 'flex',
       alignItems: 'center',
       gap: 8,
       padding: '11px 13px 14px',
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
   </article>
 )
}


function MomentWhiteViewer({
 moment,
 moments = [],
 origin,
 closeImmediately = false,
 onClosed,
 onShowGrid,
 onReact,
 reactingId,
 bursts = [],
}: any) {
 const [phase, setPhase] =
   useState<'opening' | 'open' | 'closing'>('opening')

 const [heroDone, setHeroDone] = useState(false)
 const [targetRect, setTargetRect] = useState(origin)
 const viewerStartScrollY = useRef(
   typeof window !== 'undefined' ? window.scrollY : 0
 )

 const teacherName = moment.teacher?.name || 'Teacher'

 const teacherPhoto =
   moment.teacher?.photo_url ||
   moment.teacher?.avatar_url ||
   moment.teacher?.image_url ||
   ''

 const isPrivate =
   moment.share_mode === 'child' ||
   moment.moment_scope === 'child'

 const shareLabel = isPrivate
   ? 'Shared with parent'
   : 'Shared with class'

 const note = String(moment.note || '').trim()

 const sourceMoments = Array.isArray(moments)
   ? moments
   : []

 const selectedIndex = sourceMoments.findIndex(
   (item: any) => item.id === moment.id
 )

 const newerMoments =
   selectedIndex > 0
     ? sourceMoments.slice(0, selectedIndex)
     : []

 const olderMoments =
   selectedIndex >= 0
     ? sourceMoments.slice(selectedIndex + 1)
     : sourceMoments.filter(
         (item: any) => item.id !== moment.id
       )

 useEffect(() => {
   let heroTimer = 0
   let frame1 = 0
   let frame2 = 0

   frame1 = window.requestAnimationFrame(() => {
     const target = document.getElementById(
       'sc-moment-viewer-image-target-v2'
     )

     if (!target) {
       setPhase('open')
       setHeroDone(true)
       return
     }

     if (selectedIndex > 0) {
       target.style.scrollMarginTop =
         'calc(66px + env(safe-area-inset-top, 0px))'

       target.scrollIntoView({
         block: 'start',
         behavior: 'auto',
       })
     }

     frame2 = window.requestAnimationFrame(() => {
       const rect = target.getBoundingClientRect()

       setTargetRect({
         top: rect.top,
         left: rect.left,
         width: rect.width,
         height: rect.height,
       })

       setPhase('open')

       heroTimer = window.setTimeout(() => {
         setHeroDone(true)
       }, 250)
     })
   })

   return () => {
     window.cancelAnimationFrame(frame1)
     window.cancelAnimationFrame(frame2)
     window.clearTimeout(heroTimer)
   }
 }, [])

 const closeViewer = () => {
   if (closeImmediately) {
     onClosed()
     return
   }

   const target = document.getElementById(
     'sc-moment-viewer-image-target-v2'
   )

   if (target) {
     const rect = target.getBoundingClientRect()

     setTargetRect({
       top: rect.top,
       left: rect.left,
       width: rect.width,
       height: rect.height,
     })
   }

   setHeroDone(false)

   window.scrollTo({
     top: viewerStartScrollY.current,
     behavior: 'auto',
   })

   window.requestAnimationFrame(() => {
     window.requestAnimationFrame(() => {
       setPhase('closing')

       window.setTimeout(() => {
         onClosed()
       }, 250)
     })
   })
 }

 const heroRect =
   phase === 'closing'
     ? origin
     : targetRect

 return (
   <div
     role="dialog"
     aria-modal="true"
     aria-label="Moment viewer"
     style={{
       position: 'absolute',
       top: 0,
       left: 0,
       right: 0,
       width: '100%',
       minHeight: '100dvh',
       zIndex: 2147483000,
       background: '#FFFFFF',
       overflow: 'visible',
       overscrollBehavior: 'auto',
       opacity: phase === 'closing' ? 0 : 1,
       transition: 'opacity 220ms ease',
       isolation: 'isolate',
     }}
   >
     <div style={{
       width: '100%',
       maxWidth: 520,
       minHeight: '100dvh',
       margin: '0 auto',
       padding:
         'calc(66px + env(safe-area-inset-top, 0px)) clamp(4px, calc(4px + (100vw - 390px) * 0.12), 12px) calc(28px + env(safe-area-inset-bottom, 0px))',
       boxSizing: 'border-box',
       background: '#FFFFFF',
     }}>

       <div style={{
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
       }}>
         <button
           type="button"
           onClick={closeViewer}
           aria-label="Back to Moments"
           data-sc-adaptive-glass
           style={{
             width: 44,
             height: 44,
             borderRadius: 15,
             border: 'none',
             background: 'rgba(24,26,30,0.065)',
             color: 'rgba(255,255,255,0.96)',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             padding: 0,
             cursor: 'pointer',
             boxShadow: '0 6px 22px rgba(15,23,42,0.085)',
             backdropFilter: 'blur(16px) saturate(1.16)',
             WebkitBackdropFilter: 'blur(16px) saturate(1.16)',
             pointerEvents: 'auto',
           }}
         >
           <AdaptiveMomentNavContent
             style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
             }}
           >
             <ChevronLeft size={24} strokeWidth={2.15} />
           </AdaptiveMomentNavContent>
         </button>

         <button
           type="button"
           onClick={onShowGrid}
           aria-label="View Moments grid"
           data-sc-adaptive-glass
           style={{
             width: 44,
             height: 44,
             borderRadius: 15,
             border: 'none',
             background: 'rgba(24,26,30,0.065)',
             color: 'rgba(255,255,255,0.96)',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             padding: 0,
             cursor: 'pointer',
             boxShadow: '0 6px 22px rgba(15,23,42,0.085)',
             backdropFilter: 'blur(16px) saturate(1.16)',
             WebkitBackdropFilter: 'blur(16px) saturate(1.16)',
             pointerEvents: 'auto',
             WebkitTapHighlightColor: 'transparent',
           }}
         >
           <AdaptiveMomentNavContent
             style={{
               width: 18,
               height: 18,
               position: 'relative',
               display: 'block',
             }}
           >
             <span style={{
               position: 'absolute',
               left: 0,
               top: 0,
               width: 7.5,
               height: 10.5,
               border: '1.6px solid currentColor',
               borderRadius: 3.2,
               boxSizing: 'border-box',
             }} />

             <span style={{
               position: 'absolute',
               right: 0,
               top: 0,
               width: 8,
               height: 5.5,
               border: '1.6px solid currentColor',
               borderRadius: 3.2,
               boxSizing: 'border-box',
             }} />

             <span style={{
               position: 'absolute',
               left: 0,
               bottom: 0,
               width: 7.5,
               height: 5.5,
               border: '1.6px solid currentColor',
               borderRadius: 3.2,
               boxSizing: 'border-box',
             }} />

             <span style={{
               position: 'absolute',
               right: 0,
               bottom: 0,
               width: 8,
               height: 10.5,
               border: '1.6px solid currentColor',
               borderRadius: 3.2,
               boxSizing: 'border-box',
             }} />
           </AdaptiveMomentNavContent>
         </button>
       </div>

       <div style={{ height: 8 }} />

       {newerMoments.map((item: any, index: number) => (
         <MomentViewerScrollItem
           key={item.id}
           moment={item}
           onReact={onReact}
           reacting={reactingId === item.id}
           bursts={bursts.filter(
             (burst: any) => burst.momentId === item.id
           )}
           hideTopDivider={index === 0}
         />
       ))}

       {newerMoments.length > 0 ? (
         <div style={{
           height: 32,
         }} />
       ) : null}

       {/* selected Moment stays in its true timeline position */}
       <div
         id="sc-moment-viewer-image-target-v2"
         style={{
           width: '100%',
           height: 'min(58dvh, 520px)',
           minHeight: 300,
           borderRadius: 26,
           overflow: 'hidden',
           background: '#F7F6F3',
           visibility: heroDone ? 'visible' : 'hidden',
           position: 'relative',
         }}
       >
         <img
           src={moment.file_url}
           alt=""
           loading="eager"
           decoding="async"
           fetchPriority="high"
           style={{
             width: '100%',
             height: '100%',
             objectFit: 'cover',
             objectPosition: 'center',
             display: 'block',
           }}
         />

         <ReactionBurstLayer
           bursts={bursts}
           insideReportShell={true}
         />
       </div>

       <div
         style={{
           opacity:
             heroDone && phase === 'open'
               ? 1
               : 0,
           transition: 'opacity 150ms ease',
         }}
       >
         {/* compact identity + reactions below image */}
         <div style={{
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'space-between',
           gap: 10,
           padding: '12px 4px 0',
         }}>
           <div style={{
             display: 'flex',
             alignItems: 'center',
             gap: 9,
             flex: 1,
             minWidth: 0,
           }}>
             <div style={{
               width: 34,
               height: 34,
               borderRadius: '50%',
               flexShrink: 0,
               background: teacherPhoto
                 ? `url(${teacherPhoto}) center/cover`
                 : T.soft,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               color: T.ink2,
               fontSize: 11,
               fontWeight: 650,
               overflow: 'hidden',
             }}>
               {!teacherPhoto
                 ? initials(teacherName)
                 : null}
             </div>

             <div style={{
               flex: 1,
               minWidth: 0,
             }}>
               <div style={{
                 display: 'flex',
                 alignItems: 'baseline',
                 gap: 5,
                 minWidth: 0,
               }}>
                 <span style={{
                   color: T.ink,
                   fontSize: 13.4,
                   fontWeight: 600,
                   overflow: 'hidden',
                   textOverflow: 'ellipsis',
                   whiteSpace: 'nowrap',
                 }}>
                   {teacherName}
                 </span>

                 <span style={{
                   color: '#74777D',
                   fontSize: 11.1,
                   fontWeight: 400,
                   whiteSpace: 'nowrap',
                 }}>
                   · {formatTimeAgo(moment.created_at)}
                 </span>
               </div>

               <span style={{
                 color: '#74777D',
                 fontSize: 10.7,
                 fontWeight: 400,
                 display: 'block',
                 marginTop: 2,
                 lineHeight: 1.25,
               }}>
                 {shareLabel}
               </span>
             </div>
           </div>

           <div style={{
             position: 'relative',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'flex-end',
             gap: 6,
             flexShrink: 0,
             padding: 0,
           }}>
             {[
               ['heart', Heart],
               ['like', ThumbsUp],
               ['smile', Smile],
             ].map(([key, Icon]: any) => {
               const active =
                 moment.reaction === key

               const count = Number(
                 moment.reaction_counts?.[key] || 0
               )

               return (
                 <ParentReactionFXButton
                   key={key}
                   moment={moment}
                   reactionKey={key}
                   Icon={Icon}
                   active={active}
                   count={count}
                   reacting={reactingId === moment.id}
                   onReact={onReact}
                 />
               )
             })}
           </div>
         </div>

         {/* caption below identity */}
         {note ? (
           <div style={{
             margin: '10px 4px 0',
           }}>
             <p style={{
               margin: 0,
               color: '#303236',
               fontSize: 12.9,
               fontWeight: 400,
               lineHeight: 1.46,
               whiteSpace: 'pre-wrap',
             }}>
               {note}
             </p>
           </div>
         ) : null}


       </div>

       {olderMoments.map((item: any) => (
         <MomentViewerScrollItem
           key={item.id}
           moment={item}
           onReact={onReact}
           reacting={reactingId === item.id}
           bursts={bursts.filter(
             (burst: any) => burst.momentId === item.id
           )}
         />
       ))}
     </div>

     {!heroDone ? (
       <img
         src={moment.file_url}
         alt=""
         decoding="async"
         fetchPriority="high"
         style={{
           position: 'fixed',
           zIndex: 2,
           top: heroRect.top,
           left: heroRect.left,
           width: heroRect.width,
           height: heroRect.height,
           objectFit: 'cover',
           borderRadius:
             phase === 'opening' ||
             phase === 'closing'
               ? 18
               : 26,
           display: 'block',
           background: '#F7F6F3',
           boxShadow:
             phase === 'open'
               ? '0 18px 48px rgba(15,23,42,0.08)'
               : '0 4px 14px rgba(15,23,42,0.025)',
           transition:
             'top 240ms cubic-bezier(0.16,1,0.3,1), left 240ms cubic-bezier(0.16,1,0.3,1), width 240ms cubic-bezier(0.16,1,0.3,1), height 240ms cubic-bezier(0.16,1,0.3,1), border-radius 240ms ease, box-shadow 240ms ease',
           pointerEvents: 'none',
         }}
       />
     ) : null}
   </div>
 )
}

function MomentViewerScrollItem({
 moment,
 onReact,
 reacting,
 bursts = [],
 hideTopDivider = false,
}: any) {
 const teacherName =
   moment.teacher?.name || 'Teacher'

 const teacherPhoto =
   moment.teacher?.photo_url ||
   moment.teacher?.avatar_url ||
   moment.teacher?.image_url ||
   ''

 const isPrivate =
   moment.share_mode === 'child' ||
   moment.moment_scope === 'child'

 const shareLabel = isPrivate
   ? 'Shared with parent'
   : 'Shared with class'

 const note = String(moment.note || '').trim()

 return (
   <section style={{
     marginTop: hideTopDivider ? 0 : 26,
     paddingTop: 0,
     borderTop: 'none',
   }}>
     {/* next photo */}
     <div style={{
       width: '100%',
       height: 'min(58dvh, 520px)',
       minHeight: 300,
       borderRadius: 26,
       overflow: 'hidden',
       background: '#F7F6F3',
       position: 'relative',
     }}>
       <img
         src={moment.file_url}
         alt=""
         loading="lazy"
         decoding="async"
         style={{
           width: '100%',
           height: '100%',
           objectFit: 'cover',
           objectPosition: 'center',
           display: 'block',
         }}
       />

       <ReactionBurstLayer
         bursts={bursts}
         insideReportShell={true}
       />
     </div>

     {/* compact identity + reactions */}
     <div style={{
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'space-between',
       gap: 10,
       padding: '12px 4px 0',
     }}>
       <div style={{
         display: 'flex',
         alignItems: 'center',
         gap: 9,
         flex: 1,
         minWidth: 0,
       }}>
         <div style={{
           width: 34,
           height: 34,
           borderRadius: '50%',
           flexShrink: 0,
           background: teacherPhoto
             ? `url(${teacherPhoto}) center/cover`
             : T.soft,
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           color: T.ink2,
           fontSize: 11,
           fontWeight: 650,
           overflow: 'hidden',
         }}>
           {!teacherPhoto
             ? initials(teacherName)
             : null}
         </div>

         <div style={{
           flex: 1,
           minWidth: 0,
         }}>
           <div style={{
             display: 'flex',
             alignItems: 'baseline',
             gap: 5,
             minWidth: 0,
           }}>
             <span style={{
               color: T.ink,
               fontSize: 13.4,
               fontWeight: 600,
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               whiteSpace: 'nowrap',
             }}>
               {teacherName}
             </span>

             <span style={{
               color: '#74777D',
               fontSize: 11.1,
               fontWeight: 400,
               whiteSpace: 'nowrap',
             }}>
               · {formatTimeAgo(moment.created_at)}
             </span>
           </div>

           <span style={{
             color: '#74777D',
             fontSize: 10.7,
             fontWeight: 400,
             display: 'block',
             marginTop: 2,
             lineHeight: 1.25,
           }}>
             {shareLabel}
           </span>
         </div>
       </div>

       <div style={{
         position: 'relative',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'flex-end',
         gap: 6,
         flexShrink: 0,
         padding: 0,
       }}>
         {[
           ['heart', Heart],
           ['like', ThumbsUp],
           ['smile', Smile],
         ].map(([key, Icon]: any) => {
           const active =
             moment.reaction === key

           const count = Number(
             moment.reaction_counts?.[key] || 0
           )

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

     {/* caption */}
     {note ? (
       <div style={{
         margin: '10px 4px 0',
       }}>
         <p style={{
           margin: 0,
           color: '#303236',
           fontSize: 12.9,
           fontWeight: 400,
           lineHeight: 1.46,
           whiteSpace: 'pre-wrap',
         }}>
           {note}
         </p>
       </div>
     ) : null}


   </section>
 )
}


function MomentGalleryTile({
 moment,
 imageIndex = 0,
 selected = false,
 onOpen,
}: any) {
 const [imageReady, setImageReady] = useState(false)

 const imageWidth = Number(moment.image_width || 0)
 const imageHeight = Number(moment.image_height || 0)

 const hasDimensions =
   imageWidth > 0 &&
   imageHeight > 0

 const image = (
   <img
     src={moment.file_url}
     alt=""
     loading={imageIndex >= 0 && imageIndex < 2 ? 'eager' : 'lazy'}
     decoding="async"
     fetchPriority={imageIndex >= 0 && imageIndex < 2 ? 'high' : 'auto'}
     onLoad={() => setImageReady(true)}
     style={{
       width: '100%',
       height: hasDimensions ? '100%' : 'auto',
       display: 'block',
       objectFit: 'cover',
       borderRadius: 18,
       background: '#F5F4F1',
       opacity: imageReady ? 1 : 0,
       transition: 'opacity 180ms ease-out',
       ...(hasDimensions
         ? {
             position: 'absolute',
             inset: 0,
           }
         : {}),
     }}
   />
 )

 return (
   <button
     type="button"
     onClick={(event) => {
       const rect = event.currentTarget.getBoundingClientRect()
       onOpen(rect)
     }}
     aria-label="Open Moment"
     style={{
       width: '100%',
       display: 'block',
       padding: 0,
       margin: 0,
       border: 'none',
       borderRadius: 0,
       background: 'transparent',
       overflow: 'visible',
       cursor: 'pointer',
       fontFamily: 'inherit',
       textAlign: 'left',
       boxSizing: 'border-box',
       WebkitTapHighlightColor: 'transparent',
     }}
   >
     {hasDimensions ? (
       <div style={{
         position: 'relative',
         width: '100%',
         aspectRatio: `${imageWidth} / ${imageHeight}`,
         borderRadius: 18,
         overflow: 'hidden',
         background: '#F5F4F1',
       }}>
         {image}
       </div>
     ) : (
       image
     )}

   </button>
 )
}


function MomentPost({
 moment,
 isLast,
 onImage,
 onReact,
 reacting,
 bursts = [],
 imageIndex = 0,
 insideReportShell = false,
 disableImageOpen = false,
}: any) {
 const teacherName = moment.teacher?.name || 'Teacher'
 const isPrivate = moment.share_mode === 'child'
 const isImage = moment.file_type === 'image'
 const isPdf = String(moment.mime_type || '').toLowerCase().includes('pdf') || String(moment.file_name || '').toLowerCase().endsWith('.pdf')
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
 onClick={() => {
   if (!disableImageOpen) onImage(moment.file_url)
 }}
  style={{
  display: 'inline-flex',
  width: 'fit-content',
  maxWidth: '100%',
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: disableImageOpen ? 'default' : 'zoom-in',
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
 ) : isPdf ? (
 <a
 href={moment.file_url}
 target="_blank"
 rel="noreferrer"
 style={{
 width: '100%',
 maxWidth: '100%',
 borderRadius: 20,
 background: T.soft,
 display: 'block',
 color: T.ink,
 textDecoration: 'none',
 boxSizing: 'border-box',
 overflow: 'hidden',
 border: `1px solid ${T.border}`,
 }}
 >
 <div style={{
 width: '100%',
 height: insideReportShell ? 220 : 240,
 background: '#F3F1EC',
 position: 'relative',
 overflow: 'hidden',
 }}>
 <iframe
 src={`${moment.file_url}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
 title={moment.file_name || 'PDF preview'}
 style={{
 width: '108%',
 height: '108%',
 border: 'none',
 background: '#F3F1EC',
 pointerEvents: 'none',
 transform: 'scale(1.04)',
 transformOrigin: 'center top',
 marginLeft: '-4%',
 marginTop: '-2%',
 }}
 />
 <div style={{
 position: 'absolute',
 left: 12,
 top: 12,
 borderRadius: 999,
 background: 'rgba(255,255,255,0.92)',
 color: T.ink,
 border: '1px solid rgba(37,37,37,0.08)',
 padding: '7px 10px',
 display: 'inline-flex',
 alignItems: 'center',
 gap: 6,
 fontSize: 11.5,
 fontWeight: 680,
 boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
 }}>
 <FileText size={13} strokeWidth={2} />
 PDF
 </div>
 </div>

 <div style={{
 padding: 13,
 display: 'flex',
 alignItems: 'center',
 gap: 12,
 background: T.soft,
 }}>
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
 {moment.file_name || 'PDF document'}
 </p>
 <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0' }}>
 Tap to open PDF
 </p>
 </div>
 </div>
 </a>
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
