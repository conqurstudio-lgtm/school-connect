// @ts-nocheck
'use client'

import { useMemo, useState } from 'react'
import { Check, FileText, Send, ShieldAlert, X } from 'lucide-react'
import toast from 'react-hot-toast'

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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function initials(name?: string) {
  return String(name || '?').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

export function TeacherMomentComposer({ draft, learners = [], onClose, onCreated }: any) {
  const file = draft?.file
  const [note, setNote] = useState('')
  const [shareMode, setShareMode] = useState<'child' | 'all'>('child')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file])
  const isImage = String(file?.type || '').startsWith('image/')
  const selectedCount = shareMode === 'all' ? learners.length : selectedIds.length

  const toggleChild = (id: string) => {
    setShareMode('child')
    setSelectedIds((current) => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }

  const sendMoment = async () => {
    if (!file) return toast.error('Choose a file first')

    const childIds = shareMode === 'all' ? learners.map((child: any) => child.id) : selectedIds
    if (!childIds.length) return toast.error('Choose who should receive this Moment')

    let confirmAll = false
    if (shareMode === 'all') {
      const ok = confirm('Share to all parents?\n\nThis Moment will be visible to every parent in this class. Please confirm that the content is safe to share with everyone.')
      if (!ok) return
      confirmAll = true
    }

    setSending(true)
    const tid = toast.loading('Sharing Moment...')

    try {
      const dataUrl = await readFileAsDataUrl(file)
      const res = await fetch('/api/teacher/moments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_url: dataUrl,
          file_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          note: note.trim(),
          share_mode: shareMode,
          child_ids: childIds,
          confirm_all: confirmAll,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not share Moment')

      toast.success('Moment shared', { id: tid })
      onCreated?.()
      onClose?.()
    } catch (error: any) {
      toast.error(error.message || 'Could not share Moment', { id: tid })
    }

    setSending(false)
  }

  return (
    <div className="sc-bottom-sheet-backdrop" onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 3500,
      background: 'rgba(0,0,0,0.30)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
    }}>
      <div className="sc-bottom-sheet" onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        maxHeight: '92dvh',
        overflowY: 'auto',
        background: T.white,
        borderRadius: '28px 28px 0 0',
        padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: T.ink, margin: 0 }}>New Moment</h2>
            <p style={{ fontSize: 13, color: T.ink3, margin: '3px 0 0' }}>Share a private update with parents.</p>
          </div>
          <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: 999, border: 'none', background: T.soft, color: T.ink3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ borderRadius: 22, background: T.soft, overflow: 'hidden', marginBottom: 14 }}>
          {isImage ? (
            <img src={previewUrl} alt="" style={{ width: '100%', maxHeight: 330, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 16, background: T.accentSoft, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={20} strokeWidth={1.8} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 560, color: T.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name || 'Document'}</p>
                <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0' }}>Document update</p>
              </div>
            </div>
          )}
        </div>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={labelStyle}>Short note optional</span>
          <textarea value={note} onChange={event => setNote(event.target.value)} rows={4} placeholder="Add a short update for the parent..." style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
        </label>

        <div style={{ borderRadius: 22, background: T.white, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '13px 14px', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 560, color: T.ink, margin: 0 }}>Share to</p>
            <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0' }}>{selectedCount ? `${selectedCount} selected` : 'Choose who should see this Moment'}</p>
          </div>

          <button type="button" onClick={() => { setShareMode('all'); setSelectedIds([]) }} style={{ width: '100%', minHeight: 48, border: 'none', borderBottom: `1px solid ${T.border}`, background: shareMode === 'all' ? T.accentSoft : T.white, color: T.ink, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            <span style={{ width: 28, height: 28, borderRadius: 999, background: shareMode === 'all' ? T.accent : T.soft, color: shareMode === 'all' ? T.white : T.ink3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {shareMode === 'all' ? <Check size={14} /> : <ShieldAlert size={14} />}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 540 }}>All parents</span>
          </button>

          <div style={{ maxHeight: 230, overflowY: 'auto' }}>
            {!learners.length && (
              <div style={{
                padding: '16px 14px',
                fontSize: 13,
                color: T.ink3,
                lineHeight: 1.45,
              }}>
                No learners found yet. Add learners before sharing a Moment.
              </div>
            )}

            {learners.map((child: any, index: number) => {
              const selected = shareMode === 'child' && selectedIds.includes(child.id)
              return (
                <button key={child.id} type="button" onClick={() => toggleChild(child.id)} style={{ width: '100%', minHeight: 48, border: 'none', borderBottom: index === learners.length - 1 ? 'none' : `1px solid ${T.border}`, background: selected ? T.accentSoft : T.white, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 999, background: selected ? T.accent : T.soft, color: selected ? T.white : T.ink3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 560, flexShrink: 0 }}>{selected ? <Check size={14} /> : initials(child.name)}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 540, color: T.ink, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{child.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <button type="button" onClick={sendMoment} disabled={sending} style={{ width: '100%', minHeight: 44, borderRadius: 999, border: 'none', background: T.ink, color: T.white, fontSize: 13, fontWeight: 560, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.65 : 1, fontFamily: 'inherit' }}>
          <Send size={15} strokeWidth={1.9} />
          {sending ? 'Sharing...' : 'Send Moment'}
        </button>
      </div>
    </div>
  )
}
