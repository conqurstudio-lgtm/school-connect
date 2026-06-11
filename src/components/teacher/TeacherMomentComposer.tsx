// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, FileText, Send, ShieldAlert, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { SCBottomSheet, SCButton, SCIconButton, SCTextArea } from '@/components/ui'

const T = {
  ink: 'var(--sc-ink)',
  ink2: 'var(--sc-ink-2)',
  ink3: 'var(--sc-ink-3)',
  border: 'var(--sc-border)',
  soft: 'var(--sc-soft)',
  soft2: 'var(--sc-soft-2)',
  white: 'var(--sc-white)',
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
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function SelectMark({ active, children }: any) {
  return (
    <span
      style={{
        width: 29,
        height: 29,
        borderRadius: 999,
        background: active ? T.ink : T.soft,
        color: active ? T.white : T.ink3,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 620,
        flexShrink: 0,
      }}
    >
      {active ? <Check size={14} strokeWidth={2.2} /> : children}
    </span>
  )
}

export function TeacherMomentComposer({ draft, learners = [], onClose, onCreated }: any) {
  const file = draft?.file
  const [note, setNote] = useState('')
  const [shareMode, setShareMode] = useState<'child' | 'all'>('child')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  const isImage = String(file?.type || '').startsWith('image/')
  const selectedCount = shareMode === 'all' ? learners.length : selectedIds.length

  const selectedLabel = useMemo(() => {
    if (shareMode === 'all') return learners.length ? `${learners.length} parents` : 'All parents'
    if (!selectedIds.length) return 'Choose parents'
    return `${selectedIds.length} selected`
  }, [learners.length, selectedIds.length, shareMode])

  const toggleChild = (id: string) => {
    setShareMode('child')
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
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
    <SCBottomSheet open={Boolean(draft)} onClose={onClose} maxWidth={520}>
      <div style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 620, color: T.ink, margin: 0, letterSpacing: '-.02em' }}>
            New Moment
          </h2>
          <SCIconButton label="Close" onClick={onClose} tone="quiet" size={34}>
            <X size={17} strokeWidth={1.9} />
          </SCIconButton>
        </div>

        <div style={{ borderRadius: 22, background: T.soft, overflow: 'hidden', marginBottom: 14 }}>
          {isImage && previewUrl ? (
            <img src={previewUrl} alt="" style={{ width: '100%', maxHeight: 330, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 16, background: T.soft2, color: T.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={20} strokeWidth={1.8} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 580, color: T.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file?.name || 'Document'}
                </p>
                <p style={{ fontSize: 12.3, color: T.ink3, margin: '2px 0 0' }}>Ready to share</p>
              </div>
            </div>
          )}
        </div>

        <SCTextArea
          label="Short note optional"
          value={note}
          onChange={setNote}
          rows={4}
          placeholder="Add a short update for the parent..."
          style={{ marginBottom: 14 }}
        />

        <section style={{ borderRadius: 22, background: T.white, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '13px 14px', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 580, color: T.ink, margin: 0 }}>Share to</p>
            <p style={{ fontSize: 12.4, color: T.ink3, margin: '2px 0 0' }}>{selectedLabel}</p>
          </div>

          <button
            type="button"
            onClick={() => { setShareMode('all'); setSelectedIds([]) }}
            className="sc-action-row"
            style={{
              width: '100%',
              minHeight: 50,
              border: 'none',
              borderBottom: `1px solid ${T.border}`,
              background: shareMode === 'all' ? T.soft : T.white,
              color: T.ink,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <SelectMark active={shareMode === 'all'}>
              <ShieldAlert size={14} strokeWidth={1.9} />
            </SelectMark>
            <span style={{ fontSize: 13.5, fontWeight: 560 }}>All parents</span>
          </button>

          <div style={{ maxHeight: 230, overflowY: 'auto' }}>
            {!learners.length && (
              <div style={{ padding: '16px 14px', fontSize: 13, color: T.ink3, lineHeight: 1.45 }}>
                No learners found yet. Add learners before sharing a Moment.
              </div>
            )}

            {learners.map((child: any, index: number) => {
              const selected = shareMode === 'child' && selectedIds.includes(child.id)
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => toggleChild(child.id)}
                  className="sc-action-row"
                  style={{
                    width: '100%',
                    minHeight: 50,
                    border: 'none',
                    borderBottom: index === learners.length - 1 ? 'none' : `1px solid ${T.border}`,
                    background: selected ? T.soft : T.white,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0 14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <SelectMark active={selected}>{initials(child.name)}</SelectMark>
                  <span style={{ fontSize: 13.5, fontWeight: 560, color: T.ink, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {child.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <SCButton
          fullWidth
          onClick={sendMoment}
          disabled={sending || !file || !selectedCount}
          leading={<Send size={15} strokeWidth={1.9} />}
        >
          {sending ? 'Sharing...' : 'Send Moment'}
        </SCButton>
      </div>
    </SCBottomSheet>
  )
}
