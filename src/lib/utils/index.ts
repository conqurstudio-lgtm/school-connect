// @ts-nocheck
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Smart date formatting for feed — short form: 2h, 3d, 5 Jan
export function formatFeedDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const secs = Math.floor((now.getTime() - date.getTime()) / 1000)
  const mins = Math.floor(secs / 60)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs  / 24)

  if (secs < 60)   return 'now'
  if (mins < 60)   return `${mins}m`
  if (hrs  < 24)   return `${hrs}h`
  if (days < 7)    return `${days}d`
  if (days < 365)  return format(date, 'd MMM')
  return format(date, 'd MMM yyyy')
}

// Format event date nicely
export function formatEventDate(date?: string, time?: string): string {
  if (!date) return ''
  const d = new Date(date)
  const dateStr = format(d, 'EEEE, d MMMM yyyy')
  if (time) {
    const [h, m] = time.split(':')
    const t = new Date()
    t.setHours(parseInt(h), parseInt(m))
    return `${dateStr} at ${format(t, 'h:mm a')}`
  }
  return dateStr
}

// Format file size
export function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Generate school slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)
}

// Get initials from name
export function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Get document icon by mime type
export function getDocumentIcon(mimeType?: string): string {
  if (!mimeType) return '📄'
  if (mimeType.includes('pdf')) return '📑'
  if (mimeType.includes('word') || mimeType.includes('doc')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋'
  if (mimeType.includes('image')) return '🖼️'
  return '📄'
}

// Post type labels
export const POST_TYPE_LABELS: Record<string, string> = {
  update:   'Update',
  moment:   'Moment',
  event:    'Event',
  document: 'Document',
  pinned:   'Pinned',
}

// Reaction emoji map
export const REACTION_EMOJI: Record<string, string> = {
  like:      '👍',
  love:      '❤️',
  celebrate: '🎉',
}
