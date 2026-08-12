// @ts-nocheck
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Camera, ChevronDown, Copy, GraduationCap, LogOut, Plus, Settings, Eye, MoreHorizontal, Users, X, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { TeacherMomentComposer } from '@/components/teacher/TeacherMomentComposer'
import { TeacherMomentsPage } from '@/components/teacher/TeacherMomentsPage'
import SCActionRow from '@/components/ui/SCActionRow'
import SCReportRow from '@/components/ui/SCReportRow'
import SCScoreRow from '@/components/ui/SCScoreRow'
import SCButton from '@/components/ui/SCButton'
import SCTopBar from '@/components/ui/SCTopBar'
import SCIconButton from '@/components/ui/SCIconButton'
import { TeacherStartupLoader, readTeacherStartupCache, writeTeacherStartupCache } from '@/components/teacher/TeacherStartupLoader'
import { SchoolConnectLoader, SchoolConnectPageLoader } from '@/components/ui/SchoolConnectLoader'
import { PageGhostLoader } from '@/components/ui/PageGhostLoader'
import { ReportCard } from '@/components/reports/ReportCard'
import { generateComment } from '@/lib/reports'

const T = {
 ink: '#252525',
 ink2: '#5F6268',
 ink3: '#9A9CA3',
 border: 'rgba(0,0,0,0.045)',
 bg: '#FFFFFF',
 soft: '#F7F7F8',
 soft2: '#F4F5F5',
 accent: '#717171',
 accentSoft: '#F5F5F5',
 white: '#FFFFFF',
 red: '#B42318',
 green: '#5B8F7F',
}

const DEFAULT_REPORT_SUBJECTS = ['Mathematics', 'English', 'Life Skills', 'Behaviour']

const REPORT_SUBJECT_PRESETS = {
 ECD: ['Emotional development', 'Social skills', 'Communication', 'Fine motor skills', 'Participation'],
 Primary: ['Mathematics', 'English', 'Life Skills', 'Reading', 'Behaviour'],
}

function normalizeReportSubjects(value: any) {
 const raw = Array.isArray(value) ? value : DEFAULT_REPORT_SUBJECTS
 const seen = new Set<string>()

 const subjects = raw
 .map((item: any) => String(item || '').trim())
 .filter(Boolean)
 .map((item: string) => item.slice(0, 40))
 .filter((item: string) => {
 const key = item.toLowerCase()
 if (seen.has(key)) return false
 seen.add(key)
 return true
 })
 .slice(0, 12)

 return subjects.length ? subjects : DEFAULT_REPORT_SUBJECTS
}

function scoresForSubjects(subjects: string[], existing: Record<string, number> = {}) {
 return subjects.reduce((acc: Record<string, number>, subject: string) => {
 const current = Number(existing[subject])
 acc[subject] = Number.isFinite(current) && current >= 1 && current <= 5 ? current : 3
 return acc
 }, {})
}

function SchoolConnectBackButton({ onClick, label = 'Back' }: any) {
 return (
 <button
 type="button"
 onClick={onClick}
 aria-label={label}
 style={{
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
 }}
 >
 <span style={{
 width: 13,
 height: 13,
 borderLeft: '2.6px solid currentColor',
 borderBottom: '2.6px solid currentColor',
 borderRadius: 1.5,
 transform: 'rotate(45deg) translate(1px, -1px)',
 display: 'block',
 }} />
 </button>
 )
}

function TeacherPhotoAdjustModal({ draft, onCancel, onApply, uploading }: any) {
 const [zoom, setZoom] = useState(1.18)
 const [offset, setOffset] = useState({ x: 0, y: 0 })
 const dragRef = useRef<any>(null)

 const cropSize = 230
 const outputSize = 512

 useEffect(() => {
 return () => {
 dragRef.current = null
 }
 }, [])

 const startDrag = (event: any) => {
 event.currentTarget.setPointerCapture?.(event.pointerId)
 dragRef.current = {
 startX: event.clientX,
 startY: event.clientY,
 initialX: offset.x,
 initialY: offset.y,
 }
 }

 const moveDrag = (event: any) => {
 if (!dragRef.current) return

 const nextX = dragRef.current.initialX + (event.clientX - dragRef.current.startX)
 const nextY = dragRef.current.initialY + (event.clientY - dragRef.current.startY)
 const max = 64

 setOffset({
 x: Math.max(-max, Math.min(max, nextX)),
 y: Math.max(-max, Math.min(max, nextY)),
 })
 }

 const stopDrag = () => {
 dragRef.current = null
 }

 const createCroppedBlob = async () => {
 const image = await new Promise<HTMLImageElement>((resolve, reject) => {
 const img = new Image()
 img.crossOrigin = 'anonymous'
 img.onload = () => resolve(img)
 img.onerror = reject
 img.src = draft.previewUrl
 })

 const canvas = document.createElement('canvas')
 canvas.width = outputSize
 canvas.height = outputSize

 const ctx = canvas.getContext('2d')
 if (!ctx) throw new Error('Could not prepare logo image')

 ctx.fillStyle = '#ffffff'
 ctx.fillRect(0, 0, outputSize, outputSize)

 const baseScale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight)
 const scale = baseScale * zoom
 const drawWidth = image.naturalWidth * scale
 const drawHeight = image.naturalHeight * scale
 const outputOffsetX = offset.x * (outputSize / cropSize)
 const outputOffsetY = offset.y * (outputSize / cropSize)

 const dx = (outputSize - drawWidth) / 2 + outputOffsetX
 const dy = (outputSize - drawHeight) / 2 + outputOffsetY

 ctx.drawImage(image, dx, dy, drawWidth, drawHeight)

 return await new Promise<Blob>((resolve, reject) => {
 canvas.toBlob((blob) => {
 if (!blob) reject(new Error('Could not crop photo'))
 else resolve(blob)
 }, 'image/jpeg', 0.92)
 })
 }

 const apply = async () => {
 const blob = await createCroppedBlob()
 await onApply(blob)
 }

 return (
 <div style={{
 position: 'fixed',
 inset: 0,
 zIndex: 10000,
 background: 'rgba(0,0,0,0.28)',
 display: 'flex',
 alignItems: 'flex-end',
 justifyContent: 'center',
 padding: '18px 12px calc(18px + env(safe-area-inset-bottom, 0px))',
 fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
 }}>
 <div style={{
 width: '100%',
 maxWidth: 420,
 background: T.white,
 borderRadius: 24,
 border: 'none',
 padding: 16,
 }}>
 <div style={{ textAlign: 'center', marginBottom: 14 }}>
 <p style={{ fontSize: 16, fontWeight: 600, color: T.ink, margin: 0 }}>
 Adjust profile photo
 </p>
 <p style={{ fontSize: 12.8, color: T.ink3, lineHeight: 1.45, margin: '4px 0 0' }}>
 Zoom and drag until it fits the square.
 </p>
 </div>

 <div
 style={{
 width: cropSize,
 height: cropSize,
 borderRadius: 32,
 overflow: 'hidden',
 margin: '0 auto',
 background: T.soft,
 border: `1px dashed ${T.border}`,
 position: 'relative',
 touchAction: 'none',
 cursor: 'grab',
 }}
 onPointerDown={startDrag}
 onPointerMove={moveDrag}
 onPointerUp={stopDrag}
 onPointerCancel={stopDrag}
 >
 <img
 src={draft.previewUrl}
 alt=""
 draggable={false}
 style={{
 position: 'absolute',
 left: '50%',
 top: '50%',
 width: '100%',
 height: '100%',
 objectFit: 'cover',
 transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
 transformOrigin: 'center',
 userSelect: 'none',
 pointerEvents: 'none',
 }}
 />
 </div>

 <div style={{ marginTop: 16 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
 <span style={{ fontSize: 12.4, color: T.ink3, fontWeight: 600 }}>Zoom</span>
 <button type="button" onClick={() => {
 setZoom(1.18)
 setOffset({ x: 0, y: 0 })
 }} style={{
 minHeight: 44,
 border: 'none',
 background: T.soft,
 color: T.ink2,
 borderRadius: 999,
 padding: '6px 10px',
 fontSize: 12,
 fontWeight: 540,
 fontFamily: 'inherit',
 cursor: 'pointer',
 }}>
 Reset
 </button>
 </div>

 <input
 type="range"
 min="1"
 max="2.8"
 step="0.01"
 value={zoom}
 onChange={(event) => setZoom(Number(event.target.value))}
 style={{ width: '100%' }}
 />
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
 <button type="button" onClick={onCancel} disabled={false} style={{
 ...softButton,
 minHeight: 44,
 opacity: uploading ? 0.65 : 1,
 }}>
 Cancel
 </button>

 <button type="button" onClick={apply} disabled={false} style={{
 minHeight: 44,
 ...primaryButton,
 minHeight: 44,
 opacity: uploading ? 0.65 : 1,
 }}>
 {uploading ? 'Saving...' : 'Apply photo'}
 </button>
 </div>
 </div>
 </div>
 )
}

function TeacherSafeAreaStyle() {
 return null
}

const inputStyle: any = {
 width: '100%',
 boxSizing: 'border-box',
 padding: '12px 13px',
 borderRadius: 14,
 border: `1px solid ${T.border}`,
 background: T.white,
 color: T.ink,
 fontSize: 16,
 outline: 'none',
 fontFamily: 'inherit',
}

const labelStyle: any = {
 display: 'block',
 fontSize: 11,
 fontWeight: 600,
 color: T.ink3,
 textTransform: 'uppercase',
 letterSpacing: '0.06em',
 margin: '0 0 6px',
}

const primaryButton: any = {
 minHeight: 42,
 borderRadius: 999,
 border: 'none',
 background: T.ink,
 color: T.white,
 fontSize: 13,
 fontWeight: 560,
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 7,
 padding: '0 15px',
 cursor: 'pointer',
 fontFamily: 'inherit',
}

const darkButton: any = {
 ...primaryButton,
 background: T.ink,
}

const softButton: any = {
 minHeight: 38,
 borderRadius: 999,
 border: 'none',
 background: T.white,
 color: T.ink2,
 fontSize: 13,
 fontWeight: 540,
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 7,
 padding: '0 13px',
 cursor: 'pointer',
 fontFamily: 'inherit',
}

function initials(name?: string) {
 return String(name || '?')
 .split(' ')
 .map(part => part[0])
 .join('')
 .slice(0, 2)
 .toUpperCase()
}

function weekStartToday() {
 const d = new Date()
 const day = d.getDay()
 const diff = day === 0 ? -6 : 1 - day
 d.setDate(d.getDate() + diff)
 d.setHours(0, 0, 0, 0)
 return d.toISOString().slice(0, 10)
}

function formatShortDate(value?: string | null) {
 if (!value) return 'No report yet'
 try {
 return new Date(value).toLocaleDateString('en-ZA', {
 month: 'short',
 day: 'numeric',
 })
 } catch {
 return 'No report yet'
 }
}

function formatWeek(value?: string | null) {
 if (!value) return 'No week'
 try {
 return new Date(value).toLocaleDateString('en-ZA', {
 weekday: 'short',
 day: 'numeric',
 month: 'short',
 })
 } catch {
 return String(value)
 }
}

function blobToDataUrl(blob: Blob) {
 return new Promise<string>((resolve, reject) => {
 const reader = new FileReader()
 reader.onload = () => resolve(String(reader.result || ''))
 reader.onerror = reject
 reader.readAsDataURL(blob)
 })
}

function readFileAsDataUrl(file: File) {
 return new Promise<string>((resolve, reject) => {
 const reader = new FileReader()
 reader.onload = () => resolve(String(reader.result || ''))
 reader.onerror = reject
 reader.readAsDataURL(file)
 })
}

function isMarkedThisWeek(child: any, weekStart: string) {
 return child.latest_week_starting === weekStart
}

function averageScore(scores: any) {
 const values = Object.values(scores || {}).map(Number).filter(n => Number.isFinite(n))
 if (!values.length) return null
 return values.reduce((sum, n) => sum + n, 0) / values.length
}

export function TeacherReportDashboard({ initialSession = null, initialToken = '' }: any) {
 // teacher-photo-startup-v342
 const cachedDashboard = readTeacherStartupCache(initialToken)
 const [session, setSession] = useState(initialSession || cachedDashboard?.session || null)
 const [loading, setLoading] = useState(!initialSession && !cachedDashboard?.session)
 const [bootLoading, setBootLoading] = useState(true)
 const [showTeacherStartup, setShowTeacherStartup] = useState(true)
 const [teacherStartupLeaving, setTeacherStartupLeaving] = useState(false)
 const startupStartedRef = useRef(Date.now())
 const [showAdd, setShowAdd] = useState(false)
 const [showSettings, setShowSettings] = useState(false)
 const [photoDraft, setPhotoDraft] = useState<any>(null)
 const [uploadingPhoto, setUploadingPhoto] = useState(false)
 const [showTeacherMoments, setShowTeacherMoments] = useState(false)
 const [showLearnersPage, setShowLearnersPage] = useState(true)
 const [momentSummary, setMomentSummary] = useState(cachedDashboard?.momentSummary || { moments: 0, reactions: 0, recipients: 0, viewed: 0, reacted_moments: 0 })
 const [momentDraft, setMomentDraft] = useState<any>(null)
 const momentFileRef = useRef<HTMLInputElement>(null)
 const [activeChild, setActiveChild] = useState<any>(null)
 const [previewChild, setPreviewChild] = useState<any>(null)
 const [rosterOpen, setRosterOpen] = useState(false)
 const [weekStart, setWeekStart] = useState(weekStartToday())

 const cancelTeacherPhotoAdjust = () => {
 if (photoDraft?.previewUrl) URL.revokeObjectURL(photoDraft.previewUrl)
 setPhotoDraft(null)
 }

 const handleTeacherPhotoSelected = async (file: File) => {
 if (!file) return

 setShowSettings(false)

 if (photoDraft?.previewUrl) URL.revokeObjectURL(photoDraft.previewUrl)

 const previewUrl = URL.createObjectURL(file)
 setPhotoDraft({ file, previewUrl })
 }

 const uploadAdjustedTeacherPhoto = async (blob: Blob) => {
 setUploadingPhoto(true)

 try {
 // The teacher profile-photo API expects a valid image data URL.
 // Send the adjusted canvas blob directly as a JPEG data URL.
 const jpegBlob = blob.type === 'image/jpeg'
 ? blob
 : new Blob([blob], { type: 'image/jpeg' })

 const dataUrl = await blobToDataUrl(jpegBlob)

 if (!dataUrl.startsWith('data:image/')) {
 throw new Error('Invalid photo file')
 }

 const res = await fetch('/api/teacher/profile-photo', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ data_url: dataUrl, content_type: 'image/jpeg' }),
 })

 const json = await res.json().catch(() => ({}))

 if (!res.ok) throw new Error(json.error || 'Could not update photo')

 setSession((current: any) => {
 if (!current) return current

 const nextSession = {
 ...current,
 teacher: {
 ...current.teacher,
 photo_url: json.photo_url,
 },
 }

 writeTeacherStartupCache(initialToken, nextSession, momentSummary)
 return nextSession
 })

 if (photoDraft?.previewUrl) URL.revokeObjectURL(photoDraft.previewUrl)
 setPhotoDraft(null)
 toast.success('Profile photo updated')
 } catch (error: any) {
 toast.error(error.message || 'Could not update photo')
 } finally {
 setUploadingPhoto(false)
 }
 }

 const loadStatuses = async (children: any[]) => {
 try {
 const res = await fetch('/api/teacher/report-status', { cache: 'no-store' })
 const json = await res.json().catch(() => ({}))
 const latest = json.latestByChild || {}

 return children.map((child: any) => ({
 ...child,
 ...(latest[child.id] || {}),
 }))
 } catch {
 return children
 }
 }

 const load = async () => {
 try {
 const url = initialToken
 ? `/api/teacher-session?token=${encodeURIComponent(initialToken)}`
 : '/api/teacher-session'

 const res = await fetch(url, { cache: 'no-store' })
 const json = await res.json().catch(() => ({}))

 if (!res.ok || !json.teacher?.id) {
 setSession(null)
 return
 }

 const mergedChildren = await loadStatuses(json.children || [])

 const nextSession = {
 ...json,
 children: mergedChildren,
 }

 setSession(nextSession)
 writeTeacherStartupCache(initialToken, nextSession, momentSummary)
 loadMomentSummary(nextSession)
 } finally {
 setLoading(false)
 setBootLoading(false)
 }
 }

 useEffect(() => {
 load()
 }, [])

 

 useEffect(() => {
 if (!showTeacherStartup) return
 if (loading || bootLoading) return

 const elapsed = Date.now() - startupStartedRef.current
 const wait = Math.max(0, 420 - elapsed)

 const startLeaving = window.setTimeout(() => setTeacherStartupLeaving(true), wait)
 const finish = window.setTimeout(() => setShowTeacherStartup(false), wait + 220)

 return () => {
 window.clearTimeout(startLeaving)
 window.clearTimeout(finish)
 }
 }, [loading, bootLoading, showTeacherStartup])

 const signOut = async () => {
 await fetch('/api/teacher-session', { method: 'POST' })
 window.location.href = '/teacher'
 }

 const loadMomentSummary = async (sessionForCache: any = session) => {
 try {
 const res = await fetch('/api/teacher/moments/list?summary=1', { cache: 'no-store' })
 const json = await res.json().catch(() => ({}))
 if (res.ok && json.summary) {
 const nextSummary = {
 moments: Number(json.summary.moments || 0),
 reactions: Number(json.summary.reactions || 0),
 recipients: Number(json.summary.recipients || 0),
 viewed: Number(json.summary.viewed || 0),
 reacted_moments: Number(json.summary.reacted_moments || 0),
 }

 setMomentSummary(nextSummary)
 writeTeacherStartupCache(initialToken, sessionForCache, nextSummary)
 }
 } catch {
 // Keep dashboard clean if summary is unavailable.
 }
 }

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

 if (loading && !cachedDashboard?.session?.teacher?.id) {
 return <TeacherStartupLoader teacher={cachedDashboard?.session?.teacher} />
 }

 if (!session?.teacher?.id) {
 return (
 <main style={centerPage}>
 <section style={emptyCard}>
 <GraduationCap size={28} color={T.ink3} />
 <h1 style={emptyTitle}>Teacher link needed</h1>
 <p style={emptyText}>Open the private teacher link shared by the school admin.</p>
 </section>
 </main>
 )
 }

 const { teacher, school } = session
 const children = Array.isArray(session?.children) ? session.children : []
 const classLabel = [teacher.grade, teacher.class_name].filter(Boolean).join(' · ') || 'Your class'
 const hasLearners = children.length > 0
 const completedCount = children.filter((child: any) => isMarkedThisWeek(child, weekStart)).length
 const pendingCount = Math.max(0, children.length - completedCount)
 const pendingChildren = children.filter((child: any) => !isMarkedThisWeek(child, weekStart))
 const sentChildren = children.filter((child: any) => isMarkedThisWeek(child, weekStart))

 const openChild = (child: any, mode: 'write' | 'view' = 'write') => {
 if (mode === 'view') {
 setPreviewChild(child)
 setActiveChild(null)
 return
 }

 setActiveChild(child)
 setPreviewChild(null)
 }

 const nextPendingAfter = (child: any) => {
 const currentIndex = children.findIndex((c: any) => c.id === child.id)
 const after = children.slice(currentIndex + 1).find((c: any) => !isMarkedThisWeek(c, weekStart))
 const before = children.slice(0, currentIndex).find((c: any) => !isMarkedThisWeek(c, weekStart))
 return after || before || null
 }

 if (showTeacherMoments) {
 return (
 <TeacherMomentsPage
 teacher={teacher}
 learners={children}
 onBack={() => setShowTeacherMoments(false)}
 onChanged={(summary: any) => {
 if (summary) {
 setMomentSummary({
 moments: Number(summary.moments || 0),
 reactions: Number(summary.reactions || 0),
 recipients: Number(summary.recipients || 0),
 viewed: Number(summary.viewed || 0),
 reacted_moments: Number(summary.reacted_moments || 0),
 })
 }
 }}
 />
 )
 }

 if (previewChild) {
 return (
 <TeacherReportPreview
 teacher={teacher}
 child={previewChild}
 onBack={() => setPreviewChild(null)}
 />
 )
 }

 if (activeChild) {
 return (
 <TeacherReportWorkspace
 teacher={teacher}
 child={activeChild}
 children={children}
 weekStart={weekStart}
 onBack={() => setActiveChild(null)}
 onSaved={async (updatedChild: any) => {
 await load()
 setActiveChild((current: any) => current?.id === updatedChild.id ? { ...current, ...updatedChild } : current)
 }}
 onNext={(currentChild: any) => {
 const next = nextPendingAfter(currentChild)
 if (next) setActiveChild(next)
 else setActiveChild(null)
 }}
 />
 )
 }

 if (showLearnersPage) {
 return (
 <>
 <TeacherLearnersPage
 teacher={teacher}
 school={school}
 classLabel={classLabel}
 children={children}
 completedCount={completedCount}
 pendingCount={pendingCount}
 pendingChildren={pendingChildren}
 sentChildren={sentChildren}
 weekStart={weekStart}
 onBack={() => setShowLearnersPage(false)}
 onAdd={() => setShowAdd(true)}
 onOpen={openChild}
 onDeleted={load}
 isMainHome
 onMoments={() => setShowTeacherMoments(true)}
 />

 {showAdd && (
 <AddLearnerSheet
 onClose={() => setShowAdd(false)}
 onCreated={() => {
 setShowAdd(false)
 setShowLearnersPage(true)
 load()
 }}
 />
 )}
 </>
 )
 }

 return (
 <div className="teacher-safe-screen sc-screen-enter" style={{
 minHeight: '100dvh',
 height: '100dvh',
 overflow: 'hidden',
 background: T.white,
 fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
 color: T.ink,
 }}>
 <TeacherSafeAreaStyle />

 {showTeacherStartup && (
 <TeacherStartupLoader teacher={teacher} overlay leaving={teacherStartupLeaving} />
 )}

 {photoDraft && (
 <TeacherPhotoAdjustModal
 draft={photoDraft}
 uploading={uploadingPhoto}
 onCancel={cancelTeacherPhotoAdjust}
 onApply={uploadAdjustedTeacherPhoto}
 />
 )}

 <div className={`teacher-page-shell ${showTeacherStartup ? '' : 'is-ready'}`} style={{
 maxWidth: 520,
 height: '100dvh',
 margin: '0 auto',
 display: 'flex',
 flexDirection: 'column',
 background: T.white,
 }}>
 <div
 className="sc-main-action-bar"
 style={{
 minHeight: 56,
 flexShrink: 0,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'flex-end',
 padding: 'calc(6px + env(safe-area-inset-top, 0px)) 16px 4px',
 background: T.white,
 }}
 >
 <SCIconButton
 label="Settings"
 onClick={() => setShowSettings(true)}
 size={36}
 tone="quiet"
 style={{ color: T.ink2 }}
 >
 <Settings size={17} strokeWidth={2.05} />
 </SCIconButton>
 </div>

 <main style={{
 flex: 1,
 minHeight: 0,
 overflowY: 'auto',
 WebkitOverflowScrolling: 'touch',
 padding: '2px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
 background: T.white,
 }}>
 <section style={{
 textAlign: 'center',
 minHeight: 238,
 padding: '18px 18px 22px',
 borderRadius: 28,
 background: T.white,
 border: 'none',
 marginBottom: 14,
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 justifyContent: 'center',
 }}>
 <div style={{
 width: 88,
 height: 88,
 borderRadius: 30,
 background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : T.accentSoft,
 border: 'none',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 margin: '0 auto 16px',
 color: T.accent,
 fontSize: 25,
 fontWeight: 560,
 overflow: 'hidden',
 }}>
 {!teacher.photo_url && initials(teacher.name)}
 </div>

 {teacher.name && String(teacher.name).trim().toLowerCase() !== 'teacher' ? (
 <h1 style={{
 fontSize: 22,
 lineHeight: 1.08,
 fontWeight: 560,
 letterSpacing: '-0.045em',
 color: T.ink,
 margin: '0 0 7px',
 }}>
 {teacher.name}
 </h1>
 ) : null}

 <p style={{
 fontSize: 12.8,
 color: T.ink3,
 lineHeight: 1.35,
 margin: 0,
 }}>
 {[school?.name && String(school.name).trim().toLowerCase() !== 'school' ? school.name : '', classLabel].filter(Boolean).join(' · ')}
 </p>

 <div style={{
 display: 'grid',
 gridTemplateColumns: '1fr 1fr 1fr',
 gap: 8,
 width: '100%',
 maxWidth: 320,
 marginTop: 18,
 }}>
 <MiniStat label="Learners" value={children.length} />
 <MiniStat label="Moments" value={momentSummary.moments || 0} />
 <MiniStat label="Reactions" value={momentSummary.reactions || 0} />
 </div>
 </section>

 {!hasLearners ? (
 <section style={{
 padding: '30px 16px',
 textAlign: 'center',
 border: `1px dashed ${T.border}`,
 borderRadius: 20,
 background: 'transparent',
 marginBottom: 14,
 }}>
 <p style={{ fontSize: 14.5, fontWeight: 540, color: T.ink, margin: '0 0 4px' }}>
 No learners yet
 </p>

 <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: '0 0 15px' }}>
 Add learners to start weekly reports.
 </p>

 <button type="button" onClick={() => setShowAdd(true)} style={{
 ...primaryButton,
 minHeight: 40,
 padding: '0 16px',
 }}>
 Add
 </button>
 </section>
 ) : (
 <>
 <section
 style={{
 border: 'none',
 margin: '4px 0 14px',
 padding: '0 14px',
 borderRadius: 24,
 overflow: 'hidden',
 background: T.white,
 }}
 >
 <SCActionRow
 icon={<Users size={18} strokeWidth={1.7} />}
 title="Weekly reports"
 subtitle={children.length > 0 && pendingCount === 0 ? 'All reports sent.' : 'Write learner updates.'}
 onClick={() => setShowLearnersPage(true)}
 />

 <div className="sc-thin-divider" />

 <SCActionRow
 icon={<Camera size={17} strokeWidth={1.8} />}
 title="Moments"
 subtitle="Share class moments."
 onClick={() => setShowTeacherMoments(true)}
 />
 </section>

 
 </>
 )}

 </main>
 </div>

 <input
 ref={momentFileRef}
 type="file"
 accept="image/*,application/pdf,.pdf,.doc,.docx"
 style={{ display: 'none' }}
 onChange={handleMomentFileChange}
 />

 {momentDraft && (
 <TeacherMomentComposer
 draft={momentDraft}
 learners={children}
 onClose={() => setMomentDraft(null)}
 onCreated={() => {
 setMomentDraft(null)
 loadMomentSummary()
 }}
 />
 )}

 {showAdd && (
 <AddLearnerSheet
 onClose={() => setShowAdd(false)}
 onCreated={() => {
 setShowAdd(false)
 setShowLearnersPage(true)
 load()
 }}
 />
 )}

 {showSettings && (
 <SettingsSheet
 teacher={teacher}
 school={school}
 classLabel={classLabel}
 onClose={() => setShowSettings(false)}
 onUpdated={(updatedTeacher: any) => {
 setSession((current: any) => ({
 ...current,
 teacher: {
 ...current.teacher,
 ...updatedTeacher,
 report_subjects: updatedTeacher?.report_subjects || current?.teacher?.report_subjects,
 },
 }))
 }}
 onSignOut={signOut}
 onPhotoSelected={handleTeacherPhotoSelected}
 />
 )}
 </div>
 )
}

function TeacherLearnersPage({
 teacher,
 school,
 classLabel,
 children,
 completedCount,
 pendingCount,
 pendingChildren,
 sentChildren,
 weekStart,
 onBack,
 onAdd,
 onOpen,
 onDeleted,
 isMainHome = false,
 onMoments,
}: any) {
 const [teacherLearnerSearch, setTeacherLearnerSearch] = useState('')
 const [teacherReportFilter, setTeacherReportFilter] = useState('all')
 const hasLearners = children?.length > 0
 const safeTeacherAvatarUrl =
 teacher?.photo_url ||
 teacher?.avatar_url ||
 teacher?.image_url ||
 teacher?.teacher_photo_url ||
 teacher?.profile_photo_url ||
 ''
 const pendingTotal = pendingChildren?.length || 0
 const sentTotal = sentChildren?.length || 0
 const reportsSummary = hasLearners
 ? `${pendingTotal} pending · ${sentTotal} sent this week`
 : 'Weekly learner reports'

 const teacherSearchTerm = teacherLearnerSearch.trim().toLowerCase()
 const learnerMatchesTeacherSearch = (child: any) => {
 if (!teacherSearchTerm) return true
 return String(child?.name || '').toLowerCase().includes(teacherSearchTerm)
 }
 const visiblePendingChildren = teacherReportFilter === 'sent'
 ? []
 : (pendingChildren || []).filter(learnerMatchesTeacherSearch)
 const visibleSentChildren = teacherReportFilter === 'pending'
 ? []
 : (sentChildren || []).filter(learnerMatchesTeacherSearch)

 return (
 <div className="teacher-safe-screen sc-screen-enter" style={{
 minHeight: '100dvh',
 height: '100dvh',
 overflow: 'hidden',
 background: T.white,
 fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
 color: '#252525',
 }}>
 <TeacherSafeAreaStyle />

 <div className="teacher-page-shell is-ready" style={{
 maxWidth: 520,
 height: '100dvh',
 margin: '0 auto',
 display: 'flex',
 flexDirection: 'column',
 background: T.white,
 }}>
 {isMainHome ? (
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
 onClick={onAdd}
 aria-label="Add learner"
 style={{
 width: 48,
 height: 48,
 borderRadius: '50%',
 border: '0 solid transparent',
 outline: 'none',
 backgroundColor: '#ff6c33',
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
 ) : (
 <SCTopBar
 title="Reports"
 subtitle=""
 align="left"
 compact
 left={<SchoolConnectBackButton onClick={onBack} />}
 right={
 <button
 type="button"
 onClick={onAdd}
 aria-label="Add learner"
 style={{
 width: 38,
 height: 38,
 borderRadius: 999,
 border: 'none',
 background: 'transparent',
 color: 'var(--sc-ink)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 flexShrink: 0,
 padding: 0,
 }}
 >
 <Plus size={20} strokeWidth={2.05} />
 </button>
 }
 />
 )}

 <main style={{
 flex: 1,
 minHeight: 0,
 overflowY: 'auto',
 WebkitOverflowScrolling: 'touch',
 padding: '10px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
 background: T.white,
 }}>

 {isMainHome ? (
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
 cursor: 'default',
 position: 'relative',
 }}
 >
 Reports
 <span style={{
 position: 'absolute',
 left: 1,
 right: 1,
 bottom: -7,
 height: 1.4,
 borderRadius: 999,
 background: T.ink,
 }} />
 </button>

 <button
 type="button"
 onClick={() => onMoments?.()}
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
 cursor: 'pointer',
 }}
 >
 Moments
 </button>
 </section>
 ) : null}

 <style>{`
 .teacher-home-search-input-v1,
 .teacher-home-search-input-v1:hover,
 .teacher-home-search-input-v1:focus,
 .teacher-home-search-input-v1:focus-visible {
 background: #f5f5f4 !important;
 background-color: #f5f5f4 !important;
 box-shadow: none !important;
 -webkit-box-shadow: 0 0 0 1000px #f5f5f4 inset !important;
 border: none !important;
 outline: none !important;
 border-radius: 0 !important;
 }
 .teacher-home-search-input-v1::placeholder {
 color: #6a6c6c !important;
 opacity: 1 !important;
 font-weight: 500 !important;
 letter-spacing: -0.02em !important;
 }
 .teacher-home-search-shell-v1:focus-within {
 height: 46px !important;
 }
`}</style>

 {isMainHome ? (
 <section
 className="teacher-home-search-shell-v1"
 style={{
 height: 40,
 borderRadius: 999,
 background: '#f5f5f4',
 overflow: 'hidden',
 display: 'grid',
 gridTemplateColumns: '34px 1fr',
 alignItems: 'center',
 padding: '0 15px',
 margin: '0 0 20px',
 transition: 'height 180ms ease, box-shadow 180ms ease',
 }}>
 <svg
 width="19"
 height="19"
 viewBox="0 0 24 24"
 fill="none"
 aria-hidden="true"
 style={{ display: 'block' }}
 >
 <circle cx="11" cy="11" r="7" stroke="#6a6c6c" strokeWidth="2.2" />
 <path d="M16.2 16.2L21 21" stroke="#6a6c6c" strokeWidth="2.2" strokeLinecap="round" />
 </svg>

 <input
 className="teacher-home-search-input-v1"
 value={teacherLearnerSearch}
 onChange={event => setTeacherLearnerSearch(event.target.value)}
 placeholder="Search learner"
 style={{
 width: '100%',
 height: '100%',
 border: 'none',
 outline: 'none',
 backgroundColor: '#f5f5f4',
 boxShadow: 'none',
 WebkitBoxShadow: '0 0 0 1000px #f5f5f4 inset',
 color: T.ink,
 fontSize: 16,
 fontWeight: 520,
 letterSpacing: '-0.02em',
 fontFamily: 'inherit',
 padding: 0,
 margin: 0,
 appearance: 'none',
 WebkitAppearance: 'none',
 borderRadius: 0,
 backgroundClip: 'padding-box',
 }}
 />
 </section>
 ) : null}

 <style>{`
 .teacher-report-filter-chip-v1[data-active="true"],
 .teacher-report-filter-chip-v1[data-active="true"]:hover,
 .teacher-report-filter-chip-v1[data-active="true"]:focus,
 .teacher-report-filter-chip-v1[data-active="true"]:focus-visible,
 .teacher-report-filter-chip-v1[data-active="true"]:active {
 border: 0.8px solid #aecaa8 !important;
 outline: none !important;
 background: #d8fcd3 !important;
 color: #175f3e !important;
 box-shadow: none !important;
 font-weight: 500 !important;
 }
 .teacher-report-filter-chip-v1[data-active="false"],
 .teacher-report-filter-chip-v1[data-active="false"]:hover,
 .teacher-report-filter-chip-v1[data-active="false"]:focus,
 .teacher-report-filter-chip-v1[data-active="false"]:focus-visible,
 .teacher-report-filter-chip-v1[data-active="false"]:active {
 border: 0.8px solid #cccccc !important;
 outline: none !important;
 background: transparent !important;
 color: #6a6c6c !important;
 box-shadow: none !important;
 font-weight: 500 !important;
 }
`}</style>

{isMainHome ? (
 <section style={{
 display: 'flex',
 alignItems: 'center',
 gap: 8,
 padding: '0 2px',
 margin: '0 0 18px',
 }}>
 {[
 { key: 'all', label: 'All', count: null },
 { key: 'sent', label: 'Sent', count: sentTotal },
 { key: 'pending', label: 'Pending', count: pendingTotal },
 ].map(item => {
 const active = teacherReportFilter === item.key
 return (
 <button
 key={item.key}
 type="button"
 className="teacher-report-filter-chip-v1"
 data-active={active ? 'true' : 'false'}
 onClick={() => setTeacherReportFilter(item.key)}
 style={{
 height: 32,
 borderRadius: 999,
 border: active ? '0.8px solid #aecaa8' : '0.8px solid #cccccc',
 outline: 'none',
 background: active ? '#d8fcd3' : 'transparent',
 backgroundClip: 'padding-box',
 color: active ? '#175f3e' : '#6a6c6c',
 boxShadow: 'none',
 padding: '0 12px',
 fontSize: 13,
 fontWeight: 500,
 letterSpacing: '-0.015em',
 fontFamily: 'inherit',
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 transition: 'background 160ms ease, color 160ms ease, border-color 160ms ease',
 }}
 >
 <span>
 {item.label}{item.count ? ` ${item.count}` : ''}
 </span>
 </button>
 )
 })}
 </section>
 ) : null}



 {!hasLearners ? (
 <section style={{
 padding: '30px 16px',
 textAlign: 'center',
 border: `1px dashed ${T.border}`,
 borderRadius: 20,
 background: 'transparent',
 marginTop: 0,
 }}>
 <p style={{ fontSize: 14.5, fontWeight: 540, color: T.ink, margin: '0 0 4px' }}>
 No learners yet
 </p>

 <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: '0 0 15px' }}>
 Add learners to start weekly reports.
 </p>

 <button type="button" onClick={onAdd} style={{
 ...primaryButton,
 minHeight: 42,
 padding: '0 18px',
 }}>
 Add
 </button>
 </section>
 ) : (
 <section style={{
 borderRadius: 24,
 background: T.white,
 border: 'none',
 overflow: 'visible',
 }}>
 <div style={{ padding: '0 10px 12px' }}>
 <ChecklistGroup
 title="Pending reports"
 items={visiblePendingChildren}
 weekStart={weekStart}
 onOpen={onOpen}
 onDeleted={onDeleted}
 hideHeader={isMainHome}
 />

 <ChecklistGroup
 title="Sent reports"
 items={visibleSentChildren}
 weekStart={weekStart}
 onOpen={onOpen}
 onDeleted={onDeleted}
 hideHeader={isMainHome}
 />
 </div>
 </section>
 )}
 </main>
 </div>
 </div>
 )
}



function MiniStat({ label, value }: any) {
 return (
 <div style={{
 padding: '9px 6px 10px',
 borderRadius: 17,
 background: T.soft,
 textAlign: 'center',
 }}>
 <p style={{ fontSize: 17, fontWeight: 560, color: T.ink, margin: 0, lineHeight: 1.1 }}>
 {value}
 </p>
 <p style={{ fontSize: 10.8, color: T.ink3, margin: '4px 0 0', whiteSpace: 'nowrap' }}>
 {label}
 </p>
 </div>
 )
}

function LoadingScreen() {
 return <PageGhostLoader />
}

function EmptyRoster({ onAdd }: any) {
 return (
 <div style={{
 padding: '30px 16px',
 textAlign: 'center',
 border: `1px dashed ${T.border}`,
 borderRadius: 16,
 background: 'transparent',
 marginTop: 10,
 }}>
 <p style={{ fontSize: 14.5, fontWeight: 540, color: T.ink, margin: '0 0 4px' }}>
 No learners yet
 </p>
 <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: 0 }}>
 Tap Add to create your roster.
 </p>
 </div>
 )
}

function ChecklistGroup({ title, items, weekStart, onOpen, onDeleted, hideHeader = false }: any) {
 if (!items?.length) return null

 const isSentGroup = String(title || '').toLowerCase().includes('sent')

 return (
 <div style={{ marginTop: hideHeader ? (isSentGroup ? 10 : 0) : (isSentGroup ? 24 : 2) }}>
 {!hideHeader ? (
 <div style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: 10,
 padding: '3px 0 10px',
 }}>
 <p style={{
 fontSize: 12.4,
 fontWeight: 560,
 color: 'var(--sc-ink)',
 margin: 0,
 }}>
 {title}
 </p>

 <span style={{
 fontSize: 11.4,
 fontWeight: 520,
 color: 'var(--sc-ink-3)',
 lineHeight: 1,
 }}>
 {items.length}
 </span>
 </div>
 ) : null}

 {items.map((child: any, index: number) => (
 <LearnerRow
 key={child.id}
 child={child}
 weekStart={weekStart}
 isLast={index === items.length - 1}
 onOpen={() => onOpen(child, isSentGroup ? 'view' : 'write')}
 onDeleted={onDeleted}
 />
 ))}
 </div>
 )
}

function LearnerRow({ child, weekStart, isLast, onOpen, onDeleted }: any) {
 const done = isMarkedThisWeek(child, weekStart)

 const remove = async () => {
 if (!confirm(`Remove ${child.name} from your roster?`)) return

 const tid = toast.loading('Removing learner...')

 try {
 const res = await fetch(`/api/teacher?id=${encodeURIComponent(child.id)}`, { method: 'DELETE' })
 const json = await res.json().catch(() => ({}))

 if (!res.ok) throw new Error(json.error || 'Could not remove learner')

 toast.success('Learner removed', { id: tid })
 onDeleted()
 } catch (e: any) {
 toast.error(e.message || 'Could not remove learner', { id: tid })
 }
 }

 return (
 <SCReportRow
 initials={initials(child.name)}
 title={child.name}
 subtitle={done ? 'Sent this week' : 'Pending this week'}
 actionLabel={done ? 'View' : 'Write'}
 isLast={isLast}
 onOpen={onOpen}
 onAction={onOpen}
 onRemove={remove}
 removeLabel="Remove learner"
 />
 )
}

function ReportLinkedSafeAreaStyle() {
 return (
 <style>{`
 html,
 body {
 background: #FFFFFF !important;
 }

 .report-linked-screen {
 background: #FFFFFF;
 }

 .report-linked-screen::before,
 .report-linked-screen::after {
 content: "";
 position: fixed;
 left: 0;
 right: 0;
 background: #FFFFFF;
 pointer-events: none;
 z-index: 0;
 }

 .report-linked-screen::before {
 top: 0;
 height: env(safe-area-inset-top, 0px);
 }

 .report-linked-screen::after {
 bottom: 0;
 height: env(safe-area-inset-bottom, 0px);
 }
 `}</style>
 )
}


function TeacherReportTopBar({ title, subtitle, onBack }: any) {
 return (
 <SCTopBar
 title={title}
 subtitle={subtitle}
 align="left"
 compact
 left={<SchoolConnectBackButton onClick={onBack} />}
 />
 )
}

function TeacherReportScreenFrame({ title, subtitle, onBack, children, footer, linkedSafeArea = false }: any) {
 return (
 <div className="teacher-safe-screen sc-screen-enter" style={{
 minHeight: '100dvh',
 height: '100dvh',
 overflow: 'hidden',
 background: T.white,
 fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
 color: T.ink,
 }}>
 {linkedSafeArea ? <ReportLinkedSafeAreaStyle /> : null}

 <div style={{
 maxWidth: 520,
 height: '100dvh',
 margin: '0 auto',
 display: 'flex',
 flexDirection: 'column',
 background: T.white,
 }}>
 <TeacherReportTopBar title={title} subtitle={subtitle} onBack={onBack} />

 <main style={{
 flex: 1,
 minHeight: 0,
 overflowY: 'auto',
 WebkitOverflowScrolling: 'touch',
 padding: '8px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
 background: T.white,
 }}>
 {children}
 </main>

 {footer ? (
 <footer style={{
 flexShrink: 0,
 padding: '10px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
 background: T.white,
 borderTop: '1px solid var(--sc-border-soft)',
 }}>
 {footer}
 </footer>
 ) : null}
 </div>
 </div>
 )
}

function ReportSectionTitle({ title, subtitle, right }: any) {
 return (
 <div style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: 12,
 padding: '0 0 10px',
 }}>
 <div style={{ minWidth: 0 }}>
 <p style={{
 fontSize: 13.8,
 fontWeight: 580,
 color: T.ink,
 margin: 0,
 letterSpacing: '-0.01em',
 }}>
 {title}
 </p>
 {subtitle ? (
 <p style={{
 fontSize: 12.3,
 color: T.ink3,
 lineHeight: 1.36,
 margin: '3px 0 0',
 }}>
 {subtitle}
 </p>
 ) : null}
 </div>

 {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
 </div>
 )
}

function ReportAveragePill({ value }: any) {
 return (
 <div style={{
 minWidth: 56,
 height: 36,
 borderRadius: 999,
 background: '#F7F7F7',
 color: 'var(--sc-ink)',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: 13,
 fontWeight: 620,
 letterSpacing: '-0.01em',
 }}>
 {value}
 </div>
 )
}

function ReportQuietState({ title, text }: any) {
 return (
 <section style={{
 padding: '30px 16px',
 textAlign: 'center',
 border: '1px dashed var(--sc-border-soft)',
 borderRadius: 22,
 background: 'transparent',
 }}>
 <p style={{ fontSize: 14.5, fontWeight: 560, color: T.ink, margin: '0 0 5px' }}>
 {title}
 </p>
 {text ? (
 <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.45, margin: 0 }}>
 {text}
 </p>
 ) : null}
 </section>
 )
}

function ReadOnlyScoreList({ scores }: any) {
 const scoreEntries = Object.entries(scores || {})

 if (!scoreEntries.length) {
 return (
 <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.45, margin: 0 }}>
 No subject scores were added to this report.
 </p>
 )
 }

 return (
 <div style={{ display: 'flex', flexDirection: 'column' }}>
 {scoreEntries.map(([subject, value], index) => {
 const score = Number(value)
 const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(5, score)) : 0

 return (
 <div
 key={subject}
 style={{
 display: 'grid',
 gridTemplateColumns: '1fr auto',
 alignItems: 'center',
 gap: 12,
 padding: '12px 0',
 borderBottom: index === scoreEntries.length - 1 ? 'none' : '1px solid var(--sc-border-soft)',
 }}
 >
 <p style={{
 fontSize: 13.5,
 fontWeight: 540,
 color: T.ink,
 margin: 0,
 overflow: 'hidden',
 whiteSpace: 'nowrap',
 textOverflow: 'ellipsis',
 }}>
 {subject}
 </p>

 <div style={{
 minWidth: 42,
 height: 29,
 borderRadius: 999,
 background: '#F7F7F7',
 color: 'var(--sc-ink-2)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: 12.4,
 fontWeight: 580,
 }}>
 {safeScore}/5
 </div>
 </div>
 )
 })}
 </div>
 )
}


function TeacherParentReportCardPreview({ report, child, teacher }: any) {
 const safeReport = {
 ...(report || {}),
 id: report?.id || 'draft-parent-preview',
 child_name: child?.name || report?.child_name || 'Learner',
 teacher_name: teacher?.name || report?.teacher_name || 'Teacher',
 teacher_photo_url: teacher?.photo_url || teacher?.avatar_url || teacher?.image_url || report?.teacher_photo_url || null,
 school_name: report?.school_name || teacher?.school_name || teacher?.school?.name || teacher?.school || null,
 week_starting: report?.week_starting,
 scores: report?.scores || {},
 previous_scores: report?.previous_scores || null,
 comment: report?.comment || null,
 display_position: 'latest',
 }

 return (
 <div style={{
 margin: '0 auto',
 padding: '0 0 20px',
 maxWidth: 430,
 }}>
 <ReportCard report={safeReport} childName={safeReport.child_name} />
 </div>
 )
}

function TeacherReportPreview({ teacher, child, onBack }: any) {
 const [loading, setLoading] = useState(true)
 const [report, setReport] = useState<any>(null)
 const [magicLink, setMagicLink] = useState('')
 const [error, setError] = useState('')

 useEffect(() => {
 let alive = true

 async function loadPreview() {
 setLoading(true)
 setError('')

 try {
 const res = await fetch(`/api/teacher/report-history?child_id=${encodeURIComponent(child.id)}`, { cache: 'no-store' })
 const json = await res.json().catch(() => ({}))

 if (!res.ok) throw new Error(json.error || 'Could not load report')

 if (!alive) return

 const reports = Array.isArray(json.reports) ? json.reports : []
 const latest = reports[0] || null

 setReport(latest)
 setMagicLink(String(json.magic_link || ''))
 } catch (e: any) {
 if (!alive) return
 setError(e?.message || 'Could not load report')
 } finally {
 if (alive) setLoading(false)
 }
 }

 if (child?.id) loadPreview()

 return () => {
 alive = false
 }
 }, [child?.id])

 const avg = averageScore(report?.scores)
 const avgLabel = avg == null ? '—' : avg.toFixed(1)
 const scoreCount = Object.keys(report?.scores || {}).length

 const copyParentLink = async () => {
 if (!magicLink) {
 toast.error('Parent link is not available yet')
 return
 }

 await navigator.clipboard.writeText(magicLink)
 toast.success('Parent link copied')
 }

 const openParentView = () => {
 if (!magicLink) {
 toast.error('Parent link is not available yet')
 return
 }

 window.open(magicLink, '_blank', 'noopener,noreferrer')
 }

 const footer = report ? (
 <div style={{
 display: 'grid',
 gridTemplateColumns: magicLink ? '1fr 1fr' : '1fr',
 gap: 8,
 alignItems: 'center',
 }}>
 {magicLink ? (
 <SCButton tone="secondary" fullWidth onClick={openParentView} leading={<Eye size={15} strokeWidth={1.8} />}>
 Parent view
 </SCButton>
 ) : null}
 <SCButton tone="primary" fullWidth onClick={copyParentLink} leading={<Copy size={15} strokeWidth={1.8} />}>
 Copy link
 </SCButton>
 </div>
 ) : null

 return (
 <TeacherReportScreenFrame
 title="Report preview"
 subtitle={child?.name || 'Learner'}
 onBack={onBack}
 linkedSafeArea
 footer={footer}
 >
 {loading ? (
 <section style={{
 minHeight: 260,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 color: T.ink3,
 fontSize: 13,
 }}>
 Opening report...
 </section>
 ) : error ? (
 <ReportQuietState title="Report could not load" text={error} />
 ) : !report ? (
 <ReportQuietState title="No sent report yet" text="Once a report is sent, the preview will appear here." />
 ) : (
 <TeacherParentReportCardPreview report={report} child={child} teacher={teacher} />
 )}
 </TeacherReportScreenFrame>
 )
}


function cleanWhatsAppNumber(value: any) {
 const raw = String(value || '').trim()
 let digits = raw.replace(/\D/g, '')

 if (!digits) return ''

 if (digits.startsWith('0')) {
 digits = `27${digits.slice(1)}`
 }

 if (!digits.startsWith('27') && digits.length === 9) {
 digits = `27${digits}`
 }

 return digits
}

function buildParentReportMessage(child: any, reportLink: string) {
 const childName = child?.name || 'your child'

 return [
 `Good day,`,
 ``,
 `${childName}'s weekly school update is ready.`,
 ``,
 `Please view it here:`,
 reportLink,
 ``,
 `Thank you.`
 ].join('\n')
}

function buildWhatsAppUrl(parentNumber: any, message: string) {
 const digits = cleanWhatsAppNumber(parentNumber)

 if (!digits) return ''

 return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

function ManualWhatsAppFallbackModal({ child, reportLink, onClose, onDone }: any) {
 const message = buildParentReportMessage(child, reportLink)
 const whatsappUrl = buildWhatsAppUrl(child?.parent_whatsapp, message)

 const openWhatsApp = () => {
 if (!whatsappUrl) {
 toast.error('Parent WhatsApp number is missing or invalid')
 return
 }

 window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
 }

 return (
 <div style={{
 position: 'fixed',
 inset: 0,
 zIndex: 10000,
 background: 'rgba(0,0,0,0.18)',
 display: 'flex',
 alignItems: 'flex-end',
 justifyContent: 'center',
 padding: '16px 12px calc(16px + env(safe-area-inset-bottom, 0px))',
 fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
 }}>
 <div style={{
 width: '100%',
 maxWidth: 420,
 borderRadius: 26,
 background: '#FFFFFF',
 boxShadow: '0 18px 55px rgba(0,0,0,0.18)',
 border: '1px solid rgba(0,0,0,0.06)',
 padding: 16,
 color: '#252525',
 }}>
 <p style={{
 margin: '0 0 4px',
 fontSize: 16,
 fontWeight: 660,
 letterSpacing: '-0.025em',
 }}>
 Report saved
 </p>

 <p style={{
 margin: '0 0 16px',
 fontSize: 13,
 lineHeight: 1.45,
 color: '#6B6F76',
 }}>
 Automatic WhatsApp was not sent. Please open WhatsApp and send the parent link manually.
 </p>

 {!whatsappUrl ? (
 <p style={{
 margin: '0 0 12px',
 fontSize: 12,
 color: '#B42318',
 lineHeight: 1.35,
 }}>
 Parent WhatsApp number is missing or invalid.
 </p>
 ) : null}

 <div style={{
 display: 'grid',
 gridTemplateColumns: whatsappUrl ? '1fr 1fr' : '1fr',
 gap: 8,
 }}>
 {whatsappUrl ? (
 <button
 type="button"
 onClick={openWhatsApp}
 style={{
 minHeight: 44,
 borderRadius: 999,
 border: 'none',
 background: '#252525',
 color: '#FFFFFF',
 fontSize: 13.5,
 fontWeight: 650,
 cursor: 'pointer',
 fontFamily: 'inherit',
 }}
 >
 Open WhatsApp
 </button>
 ) : null}

 <button
 type="button"
 onClick={onDone}
 style={{
 minHeight: 44,
 borderRadius: 999,
 border: 'none',
 background: '#F5F5F5',
 color: '#252525',
 fontSize: 13.5,
 fontWeight: 650,
 cursor: 'pointer',
 fontFamily: 'inherit',
 }}
 >
 Done
 </button>
 </div>
 </div>
 </div>
 )
}

function TeacherReportWorkspace({ child, children, teacher, weekStart, onBack, onSaved, onNext }: any) {
 const subjects = normalizeReportSubjects(teacher?.report_subjects)
 const subjectsKey = subjects.join('|')
 const [week, setWeek] = useState(weekStart)
 const [scores, setScores] = useState<Record<string, number>>(() => scoresForSubjects(subjects))
 const [comment, setComment] = useState('')
 const [saving, setSaving] = useState(false)
 const [magicLink, setMagicLink] = useState('')
 const [history, setHistory] = useState<any[]>([])
 const [historyLoading, setHistoryLoading] = useState(true)
 const [previewing, setPreviewing] = useState(false)
 const [manualWhatsAppFallback, setManualWhatsAppFallback] = useState<any>(null)

 useEffect(() => {
 setWeek(weekStart)
 setScores(current => scoresForSubjects(subjects, current))
 setComment('')
 setMagicLink('')
 setPreviewing(false)
 setManualWhatsAppFallback(null)
 setHistoryLoading(true)

 fetch(`/api/teacher/report-history?child_id=${encodeURIComponent(child.id)}`, { cache: 'no-store' })
 .then(res => res.json())
 .then(json => {
 setHistory(json.reports || [])
 if (json.magic_link) setMagicLink(String(json.magic_link || ''))
 })
 .catch(() => setHistory([]))
 .finally(() => setHistoryLoading(false))
 }, [child.id, weekStart, subjectsKey])

 const draftAvg = averageScore(scores)
 const draftAvgLabel = draftAvg == null ? '—' : draftAvg.toFixed(1)
 const previousScoresForPreview = history.find((item: any) => item?.week_starting !== week)?.scores || null
 const draftReport = {
 id: 'draft-parent-preview',
 child_name: child?.name || 'Learner',
 teacher_name: teacher?.name || 'Teacher',
 teacher_photo_url: teacher?.photo_url || teacher?.avatar_url || teacher?.image_url || null,
 school_name: teacher?.school_name || teacher?.school?.name || teacher?.school || null,
 week_starting: week,
 scores,
 previous_scores: previousScoresForPreview,
 comment: comment.trim() || generateComment(scores, child?.name || 'Learner'),
 display_position: 'latest',
 }

 const submit = async () => {
 if (saving) return

 setSaving(true)
 const tid = toast.loading('Sending report...')

 try {
 const res = await fetch('/api/teacher/child-report', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 child_id: child.id,
 week_starting: week,
 scores,
 comment: comment.trim() || generateComment(scores, child?.name || 'Learner'),
 }),
 })

 const json = await res.json().catch(() => ({}))

 const fallbackLink = String(json.magic_link || magicLink || '')
 const hasSavedReport = Boolean(json.report?.id || fallbackLink)

 // Only treat it as a real error if the report/link was not created.
 // If the report was saved but WhatsApp was not sent, we use the manual fallback modal.
 if (!res.ok && !hasSavedReport) {
 throw new Error(json.error || 'Could not send report')
 }

 if (fallbackLink) setMagicLink(fallbackLink)

 const whatsappStatus = String(json.whatsapp_status || '').toLowerCase()
 const automaticWhatsAppSent = ['sent', 'delivered', 'read'].includes(whatsappStatus)
 const shouldShowManualFallback = Boolean(fallbackLink) && !automaticWhatsAppSent

 const updatedChild = {
 ...child,
 latest_week_starting: week,
 latest_report_at: new Date().toISOString(),
 }

 if (automaticWhatsAppSent) {
 toast.success('Report sent to parent', { id: tid })
 } else {
 toast.dismiss(tid)
 }

 await onSaved(updatedChild)

 setHistory((current) => [
 json.report,
 ...current.filter((item) => item.id !== json.report?.id),
 ].filter(Boolean))

 if (shouldShowManualFallback) {
 setManualWhatsAppFallback({
 child,
 reportLink: fallbackLink,
 status: whatsappStatus || 'pending',
 })
 return
 }

 onBack?.()
 } catch (e: any) {
 toast.error(e.message || 'Could not send report', { id: tid })
 } finally {
 setSaving(false)
 }
 }

  const copyLink = async () => {
 if (!magicLink) {
 toast.error('Save a report first')
 return
 }

 await navigator.clipboard.writeText(magicLink)
 toast.success('Parent link copied')
 }

 const writeFooter = (
 <SCButton
 tone="primary"
 fullWidth
 onClick={() => setPreviewing(true)}
 disabled={saving}
 style={{ minHeight: 44 }}
 >
 Done
 </SCButton>
 )

 const previewFooter = (
 <div style={{
 display: 'grid',
 gridTemplateColumns: '0.9fr 1.1fr',
 gap: 8,
 alignItems: 'center',
 }}>
 <SCButton
 tone="secondary"
 fullWidth
 onClick={() => setPreviewing(false)}
 disabled={saving}
 style={{ minHeight: 44 }}
 >
 Back to edit
 </SCButton>

 <SCButton
 tone="primary"
 fullWidth
 onClick={submit}
 disabled={saving}
 style={{ minHeight: 44 }}
 >
 {saving ? 'Sending...' : 'Send to parent'}
 </SCButton>
 </div>
 )

 if (previewing) {
 return (
 <TeacherReportScreenFrame
 title="Parent preview"
 subtitle={child?.name || 'Learner'}
 onBack={() => setPreviewing(false)}
 footer={previewFooter}
 >
 <TeacherParentReportCardPreview report={draftReport} child={child} teacher={teacher} />

 {manualWhatsAppFallback ? (
 <ManualWhatsAppFallbackModal
 child={child}
 reportLink={manualWhatsAppFallback.reportLink}
 onClose={() => setManualWhatsAppFallback(null)}
 onDone={() => {
 setManualWhatsAppFallback(null)
 onBack?.()
 }}
 />
 ) : null}
 </TeacherReportScreenFrame>
 )
 }

 return (
 <TeacherReportScreenFrame
 title={child.name}
 subtitle=""
 onBack={onBack}
 footer={writeFooter}
 >
 <section style={{
 padding: '4px 0 14px',
 marginBottom: 14,
 borderBottom: '1px solid var(--sc-border-soft)',
 }}>
 <ReportSectionTitle
 title="Report scores"
 subtitle="Tap a number for each area."
 right={<ReportAveragePill value={draftAvgLabel} />}
 />

 <label style={{
 display: 'grid',
 gridTemplateColumns: '1fr auto',
 alignItems: 'center',
 gap: 12,
 padding: '0 0 10px',
 borderBottom: '1px solid var(--sc-border-soft)',
 marginBottom: 2,
 }}>
 <span style={{
 fontSize: 13.1,
 fontWeight: 540,
 color: T.ink,
 lineHeight: 1.2,
 }}>
 Week
 </span>
 <input
 type="date"
 value={week}
 onChange={e => setWeek(e.target.value)}
 style={{
 ...inputStyle,
 minHeight: 34,
 height: 34,
 borderRadius: 999,
 padding: '0 10px',
 fontSize: 12.5,
 background: T.soft,
 border: 'none',
 color: T.ink2,
 textAlign: 'right',
 width: 142,
 }}
 />
 </label>

 <div style={{ display: 'flex', flexDirection: 'column' }}>
 {subjects.map((subject, index) => (
 <SCScoreRow
 key={subject}
 label={subject}
 value={scores[subject] || 3}
 isLast={index === subjects.length - 1}
 onChange={(score) => setScores(prev => ({ ...prev, [subject]: score }))}
 />
 ))}
 </div>
 </section>

 <section style={{
 padding: '0 0 16px',
 borderBottom: '1px solid var(--sc-border-soft)',
 marginBottom: 16,
 }}>
 <ReportSectionTitle
 title="Teacher note"
 subtitle="Keep it short and helpful for the parent."
 />
 <textarea
 className="sc-teacher-note-input-v387"
 value={comment}
 onChange={e => setComment(e.target.value)}
 rows={5}
 placeholder="Add a short note for the parent."
 style={{
 ...inputStyle,
 resize: 'none',
 lineHeight: 1.5,
 background: 'var(--sc-soft)',
 border: 'none',
 borderRadius: 20,
 padding: 14,
 }}
 />
 </section>

 <section style={{ padding: '0 0 6px' }}>
 <ReportSectionTitle
 title="Previous reports"
 subtitle="Sent reports for this learner."
 />

 {historyLoading ? (
 <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>Loading previous reports...</p>
 ) : history.length === 0 ? (
 <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>No previous reports yet.</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column' }}>
 {history.slice(0, 4).map((report: any, index: number) => (
 <HistoryCard
 key={report.id}
 report={report}
 child={child}
 magicLink={magicLink}
 isLast={index === Math.min(history.length, 4) - 1}
 />
 ))}
 </div>
 )}
 </section>

 {manualWhatsAppFallback ? (
 <ManualWhatsAppFallbackModal
 child={child}
 reportLink={manualWhatsAppFallback.reportLink}
 onClose={() => setManualWhatsAppFallback(null)}
 onDone={() => {
 setManualWhatsAppFallback(null)
 onBack?.()
 }}
 />
 ) : null}
 </TeacherReportScreenFrame>
 )
}

function HistoryCard({ report, child, magicLink, isLast = false }: any) {
 const avg = averageScore(report.scores)

 const copyParentLink = async () => {
 if (!magicLink) {
 toast.error('Parent link is not available yet')
 return
 }

 await navigator.clipboard.writeText(magicLink)
 toast.success('Parent link copied')
 }

 const openWhatsApp = () => {
 if (!magicLink) {
 toast.error('Parent link is not available yet')
 return
 }

 const message = buildParentReportMessage(child, magicLink)
 const whatsappUrl = buildWhatsAppUrl(child?.parent_whatsapp, message)

 if (!whatsappUrl) {
 toast.error('Parent WhatsApp number is missing or invalid')
 return
 }

 window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
 }

 return (
 <div style={{
 padding: '13px 0',
 borderBottom: isLast ? 'none' : '1px solid var(--sc-border-soft)',
 }}>
 <div style={{
 display: 'flex',
 justifyContent: 'space-between',
 gap: 10,
 alignItems: 'center',
 }}>
 <div style={{ minWidth: 0 }}>
 <p style={{ fontSize: 13.2, fontWeight: 560, color: T.ink, margin: 0 }}>
 {formatWeek(report.week_starting)}
 </p>
 <p style={{
 fontSize: 12.2,
 color: T.ink3,
 margin: '3px 0 0',
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}>
 {report.comment || 'Weekly update sent.'}
 </p>
 </div>
 <ReportAveragePill value={avg == null ? '—' : avg.toFixed(1)} />
 </div>

 <div style={{
 display: 'grid',
 gridTemplateColumns: '1fr 1fr',
 gap: 8,
 marginTop: 10,
 }}>
 <button
 type="button"
 onClick={openWhatsApp}
 style={{
 minHeight: 38,
 borderRadius: 999,
 border: 'none',
 background: '#252525',
 color: '#FFFFFF',
 fontSize: 12.4,
 fontWeight: 620,
 cursor: 'pointer',
 fontFamily: 'inherit',
 }}
 >
 Open WhatsApp
 </button>

 <button
 type="button"
 onClick={copyParentLink}
 style={{
 minHeight: 38,
 borderRadius: 999,
 border: 'none',
 background: '#F5F5F5',
 color: '#252525',
 fontSize: 12.4,
 fontWeight: 620,
 cursor: 'pointer',
 fontFamily: 'inherit',
 }}
 >
 Copy link
 </button>
 </div>
 </div>
 )
}


function SettingsSheet({ teacher, school, classLabel, onClose, onUpdated, onSignOut, onPhotoSelected }: any) {
 const fileRef = useRef<HTMLInputElement>(null)
 const [uploading, setUploading] = useState(false)
 const [showReportSubjects, setShowReportSubjects] = useState(false)
 const [reportSubjects, setReportSubjects] = useState<string[]>(() => normalizeReportSubjects(teacher?.report_subjects))
 const [savingReportSubjects, setSavingReportSubjects] = useState(false)

 const updateReportSubject = (index: number, value: string) => {
 setReportSubjects(current => current.map((subject, subjectIndex) => subjectIndex === index ? value : subject))
 }

 const addReportSubject = () => {
 setReportSubjects(current => current.length >= 12 ? current : [...current, ''])
 }

 const removeReportSubject = (index: number) => {
 setReportSubjects(current => current.filter((_, subjectIndex) => subjectIndex !== index))
 }

 const resetReportSubjects = () => {
 setReportSubjects(DEFAULT_REPORT_SUBJECTS)
 }

 const applyReportSubjectPreset = (preset: 'ECD' | 'Primary') => {
 setReportSubjects(REPORT_SUBJECT_PRESETS[preset])
 }

 const isReportSubjectPresetActive = (preset: 'ECD' | 'Primary') => {
 const current = normalizeReportSubjects(reportSubjects).map(subject => subject.toLowerCase())
 const target = normalizeReportSubjects(REPORT_SUBJECT_PRESETS[preset]).map(subject => subject.toLowerCase())

 return current.length === target.length && current.every((subject, index) => subject === target[index])
 }

 const saveReportSubjects = async () => {
 if (savingReportSubjects) return

 const subjects = normalizeReportSubjects(reportSubjects)

 setSavingReportSubjects(true)
 const tid = toast.loading('Saving subjects...')

 try {
 const res = await fetch('/api/teacher/report-subjects', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ subjects }),
 })

 const json = await res.json().catch(() => ({}))
 if (!res.ok) throw new Error(json.error || 'Could not save subjects')

 setReportSubjects(json.report_subjects || subjects)
 onUpdated?.(json.teacher || { ...teacher, report_subjects: json.report_subjects || subjects })
 toast.success('Report subjects saved', { id: tid })
 } catch (e: any) {
 toast.error(e.message || 'Could not save subjects', { id: tid })
 }

 setSavingReportSubjects(false)
 }

 const handlePhoto = async (event: any) => {
 const file = event.target.files?.[0]

 if (!file) return

 event.target.value = ''
 onClose()
 onPhotoSelected?.(file)
 }

 if (showReportSubjects) {
 const ecdActive = isReportSubjectPresetActive('ECD')
 const primaryActive = isReportSubjectPresetActive('Primary')

 return (
 <BottomSheet onClose={() => setShowReportSubjects(false)}>
 <SheetHeader
 title="Report subjects"
 subtitle="Choose areas for weekly reports"
 onClose={() => setShowReportSubjects(false)}
 />

 <div style={{
 display: 'flex',
 flexDirection: 'column',
 gap: 18,
 padding: '2px 0 0',
 }}>
 <section style={{
 padding: '0 0 2px',
 }}>
 <p style={{
 fontSize: 12,
 fontWeight: 520,
 color: T.ink3,
 margin: '0 0 9px',
 }}>
 Presets
 </p>

 <div style={{
 display: 'grid',
 gridTemplateColumns: '1fr 1fr',
 gap: 8,
 }}>
 <button
 type="button"
 onClick={() => applyReportSubjectPreset('ECD')}
 style={{
 minHeight: 38,
 borderRadius: 999,
 border: ecdActive ? '1px solid #717171' : `1px solid ${T.border}`,
 background: ecdActive ? T.accentSoft : T.white,
 color: ecdActive ? T.accent : T.ink2,
 fontSize: 12.5,
 fontWeight: 520,
 fontFamily: 'inherit',
 cursor: 'pointer',
 }}
 >
 ECD
 </button>

 <button
 type="button"
 onClick={() => applyReportSubjectPreset('Primary')}
 style={{
 minHeight: 38,
 borderRadius: 999,
 border: primaryActive ? '1px solid #717171' : `1px solid ${T.border}`,
 background: primaryActive ? T.accentSoft : T.white,
 color: primaryActive ? T.accent : T.ink2,
 fontSize: 12.5,
 fontWeight: 520,
 fontFamily: 'inherit',
 cursor: 'pointer',
 }}
 >
 Primary
 </button>
 </div>
 </section>

 <section>
 <div style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: 10,
 marginBottom: 10,
 }}>
 <div>
 <p style={{
 fontSize: 13.5,
 fontWeight: 560,
 color: T.ink,
 margin: 0,
 }}>
 Subjects
 </p>

 <p style={{
 fontSize: 12.2,
 color: T.ink3,
 margin: '2px 0 0',
 lineHeight: 1.35,
 }}>
 These appear on each learner report.
 </p>
 </div>

 <button
 type="button"
 onClick={addReportSubject}
 aria-label="Add subject"
 style={{
 width: 34,
 height: 34,
 borderRadius: 999,
 border: `1px solid ${T.border}`,
 background: T.white,
 color: T.accent,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 flexShrink: 0,
 }}
 >
 <Plus size={16} strokeWidth={2.05} />
 </button>
 </div>

 <div style={{
 display: 'flex',
 flexDirection: 'column',
 gap: 9,
 }}>
 {reportSubjects.map((subject, index) => (
 <div key={index} style={{
 display: 'grid',
 gridTemplateColumns: reportSubjects.length > 1 ? '1fr 32px' : '1fr',
 gap: 7,
 alignItems: 'center',
 }}>
 <input
 value={subject}
 onChange={event => updateReportSubject(index, event.target.value)}
 placeholder="Subject or area"
 style={{
 ...inputStyle,
 minHeight: 42,
 fontSize: 15.5,
 background: T.white,
 border: `1px solid ${T.border}`,
 }}
 />

 {reportSubjects.length > 1 && (
 <button
 type="button"
 onClick={() => removeReportSubject(index)}
 aria-label="Remove subject"
 style={{
 width: 32,
 height: 32,
 borderRadius: 999,
 border: 'none',
 background: 'transparent',
 color: T.ink3,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 fontFamily: 'inherit',
 }}
 >
 <X size={14} strokeWidth={1.9} />
 </button>
 )}
 </div>
 ))}
 </div>
 </section>

 <button
 type="button"
 onClick={saveReportSubjects}
 disabled={savingReportSubjects}
 style={{
 ...darkButton,
 width: '100%',
 minHeight: 44,
 marginTop: 2,
 opacity: savingReportSubjects ? 0.65 : 1,
 cursor: savingReportSubjects ? 'wait' : 'pointer',
 }}
 >
 {savingReportSubjects ? 'Saving...' : 'Save subjects'}
 </button>
 </div>
 </BottomSheet>
 )
 }

 return (
 <BottomSheet onClose={onClose}>
 <SheetHeader title="Settings" subtitle="Profile and account" onClose={onClose} />

 <div style={{
 display: 'flex',
 alignItems: 'center',
 gap: 12,
 padding: 12,
 borderRadius: 20,
 background: T.soft,
 marginBottom: 12,
 }}>
 <div style={{
 width: 52,
 height: 52,
 borderRadius: 18,
 background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : T.accentSoft,
 color: T.accent,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: 16,
 fontWeight: 560,
 overflow: 'hidden',
 flexShrink: 0,
 }}>
 {!teacher.photo_url && initials(teacher.name)}
 </div>

 <div style={{ flex: 1, minWidth: 0 }}>
 <p style={{ fontSize: 14, fontWeight: 560, color: T.ink, margin: 0 }}>
 {teacher.name && String(teacher.name).trim().toLowerCase() !== 'teacher' ? teacher.name : 'Profile details'}
 </p>
 <p style={{
 fontSize: 12.5,
 color: T.ink3,
 margin: '2px 0 0',
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}>
 {[school?.name && String(school.name).trim().toLowerCase() !== 'school' ? school.name : '', classLabel].filter(Boolean).join(' · ')}
 </p>
 </div>
 </div>

 <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />

 <button
 type="button"
 disabled={false}
 onClick={() => fileRef.current?.click()}
 style={{
 ...softButton,
 width: '100%',
 justifyContent: 'flex-start',
 height: 44,
 border: 'none',
 background: T.white,
 opacity: uploading ? 0.65 : 1,
 }}
 >
 <Camera size={15} strokeWidth={1.8} />
 Change profile photo
 </button>

 <button
 type="button"
 onClick={() => setShowReportSubjects(true)}
 style={{
 ...softButton,
 width: '100%',
 justifyContent: 'space-between',
 height: 44,
 border: 'none',
 background: T.white,
 marginTop: 8,
 }}
 >
 <span>Report subjects</span>
 <span style={{
 fontSize: 12,
 color: T.accent,
 fontWeight: 520,
 }}>
 Edit
 </span>
 </button>

 <button
 type="button"
 onClick={onSignOut}
 style={{
 ...softButton,
 width: '100%',
 justifyContent: 'flex-start',
 height: 44,
 border: 'none',
 background: T.white,
 color: T.red,
 marginTop: 8,
 }}
 >
 <LogOut size={15} strokeWidth={1.8} />
 Sign out
 </button>
 </BottomSheet>
 )
}

function AddLearnerSheet({ onClose, onCreated }: any) {
 const [name, setName] = useState('')
 const [parentWhatsapp, setParentWhatsapp] = useState('')
 const [parentEmail, setParentEmail] = useState('')
 const [saving, setSaving] = useState(false)

 const submit = async () => {
 if (!name.trim()) return toast.error('Child name is required')
 if (!parentWhatsapp.trim()) return toast.error('Parent WhatsApp number is required')

 setSaving(true)
 const tid = toast.loading('Adding learner...')

 try {
 const res = await fetch('/api/teacher', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name: name.trim(),
 parent_whatsapp: parentWhatsapp.trim(),
 parent_email: parentEmail.trim() || null,
 }),
 })

 const json = await res.json().catch(() => ({}))
 if (!res.ok) throw new Error(json.error || 'Could not add learner')

 toast.success('Learner added', { id: tid })
 onCreated()
 } catch (e: any) {
 toast.error(e.message || 'Could not add learner', { id: tid })
 }

 setSaving(false)
 }

 return (
 <BottomSheet onClose={onClose}>
 <SheetHeader title="Add learner" subtitle="Only the details needed for parent updates." onClose={onClose} />

 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
 <label>
 <span style={labelStyle}>Child name</span>
 <input value={name} onChange={e => setName(e.target.value)} placeholder="Maya Dlamini" style={inputStyle} />
 </label>

 <label>
 <span style={labelStyle}>Parent WhatsApp number</span>
 <input value={parentWhatsapp} onChange={e => setParentWhatsapp(e.target.value)} placeholder="+27..." style={inputStyle} />
 </label>

 <label>
 <span style={labelStyle}>Parent email optional</span>
 <input value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="parent@email.com" type="email" style={inputStyle} />
 </label>

 <button type="button" onClick={submit} disabled={saving} style={{
 ...darkButton,
 width: '100%',
 marginTop: 4,
 opacity: saving ? 0.65 : 1,
 cursor: saving ? 'wait' : 'pointer',
 }}>
 {saving ? 'Saving...' : 'Save learner'}
 </button>
 </div>
 </BottomSheet>
 )
}

function BottomSheet({ children, onClose }: any) {
 const [mounted, setMounted] = useState(false)

 useEffect(() => {
 setMounted(true)
 }, [])

 useEffect(() => {
 if (!mounted) return

 const handleKeyDown = (event: KeyboardEvent) => {
 if (event.key === 'Escape') onClose?.()
 }

 window.addEventListener('keydown', handleKeyDown)
 return () => window.removeEventListener('keydown', handleKeyDown)
 }, [mounted, onClose])

 if (!mounted || typeof document === 'undefined') return null

 return createPortal(
 <div
 className="sc-school-sheet-backdrop"
 onClick={onClose}
 style={{
 position: 'fixed',
 inset: 0,
 zIndex: 10000,
 background: 'rgba(0,0,0,0.22)',
 display: 'flex',
 alignItems: 'flex-end',
 justifyContent: 'center',
 fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
 animation: 'scSheetBackdropIn 180ms cubic-bezier(.2,.8,.2,1) both',
 }}
 >
 <div
 className="sc-school-sheet-panel"
 onClick={e => e.stopPropagation()}
 style={{
 width: 'min(520px, 100%)',
 maxWidth: '100%',
 boxSizing: 'border-box',
 maxHeight: '90dvh',
 overflowY: 'auto',
 WebkitOverflowScrolling: 'touch',
 background: T.white,
 borderRadius: '28px 28px 0 0',
 padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
 boxShadow: '0 -10px 34px rgba(0,0,0,0.08)',
 borderTop: '1px solid rgba(0,0,0,0.04)',
 animation: 'scSheetPanelIn 240ms cubic-bezier(.2,.8,.2,1) both',
 }}
 >
 <div style={{
 width: 38,
 height: 4,
 borderRadius: 999,
 background: 'rgba(0,0,0,0.10)',
 margin: '0 auto 14px',
 }} />
 {children}
 </div>
 </div>,
 document.body
 )
}

function SheetHeader({ title, subtitle, onClose }: any) {
 return (
 <div style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: 12,
 marginBottom: 16,
 }}>
 <div style={{ minWidth: 0 }}>
 <h2 style={{ fontSize: 17, fontWeight: 580, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>
 {title}
 </h2>
 {subtitle && (
 <p style={{ fontSize: 12.5, color: T.ink3, margin: '3px 0 0', lineHeight: 1.35 }}>
 {subtitle}
 </p>
 )}
 </div>

 <button type="button" onClick={onClose} aria-label="Close" style={{
 width: 34,
 height: 34,
 borderRadius: 999,
 border: 'none',
 background: 'transparent',
 color: T.ink3,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 padding: 0,
 }}>
 <X size={17} strokeWidth={1.9} />
 </button>
 </div>
 )
}

const centerPage: any = {
 minHeight: '100dvh',
 background: T.white,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 padding: 24,
 fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
}

const emptyCard: any = {
 width: '100%',
 maxWidth: 360,
 textAlign: 'center',
 background: T.white,
 border: 'none',
 borderRadius: 24,
 padding: '34px 24px',
}

const emptyTitle: any = {
 fontSize: 20,
 fontWeight: 600,
 color: T.ink,
 margin: '14px 0 6px',
}

const emptyText: any = {
 fontSize: 14,
 color: T.ink3,
 lineHeight: 1.5,
 margin: 0,
}
