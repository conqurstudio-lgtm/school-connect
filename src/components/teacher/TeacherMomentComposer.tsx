// @ts-nocheck
'use client'
// school-connect-v1-moments-instant-v2

import { useEffect, useState } from 'react'
import { Check, FileText, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { SCBottomSheet, SCButton, SCTextArea } from '@/components/ui'

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

  const toggleChild = (id: string) => {
    setShareMode('child')
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const sendMoment = async () => {
    if (!file) return toast.error('Choose a file first')

    const childIds = shareMode === 'all'
      ? learners.map((child: any) => child.id)
      : selectedIds

    if (!childIds.length) {
      return toast.error('Choose who should receive this Moment')
    }

    let confirmAll = false

    if (shareMode === 'all') {
      const ok = confirm(
        'Share to all parents?\\n\\nThis Moment will be visible to every parent in this class. Please confirm that the content is safe to share with everyone.'
      )
      if (!ok) return
      confirmAll = true
    }

    if (sending) return
    setSending(true)

    let dataUrl = ''

    try {
      dataUrl = await readFileAsDataUrl(file)
    } catch {
      setSending(false)
      return toast.error('Could not prepare this Moment')
    }

    const tempId = `moment-pending-${Date.now()}`

    const optimisticMoment = {
      id: tempId,
      share_mode: shareMode,
      note: note.trim() || null,
      file_url: dataUrl,
      file_name: file.name,
      file_type: isImage ? 'image' : 'document',
      mime_type: file.type || 'application/octet-stream',
      created_at: new Date().toISOString(),
      recipient_count: childIds.length,
      recipients: [],
      reactions: [],
      reaction_count: 0,
      reaction_counts: { heart: 0, like: 0, smile: 0 },
      __pending: true,
    }

    onCreated?.({
      phase: 'optimistic',
      temp_id: tempId,
      moment: optimisticMoment,
    })
    onClose?.()

    try {
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

      onCreated?.({
        phase: 'confirmed',
        temp_id: tempId,
        moment: {
          ...json.moment,
          recipient_count: Number(json.recipients || childIds.length),
          recipients: [],
          reactions: [],
          reaction_count: 0,
          reaction_counts: { heart: 0, like: 0, smile: 0 },
        },
      })

      toast.success('Moment shared')
    } catch (error: any) {
      onCreated?.({
        phase: 'failed',
        temp_id: tempId,
      })
      toast.error(error.message || 'Could not share Moment')
    }

    setSending(false)
  }

  return (
    <SCBottomSheet open={Boolean(draft)} onClose={onClose} maxWidth={520}>
      <div
        className="sc-moment-composer-shell"
        style={{
          fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
        }}
      >
        <style>{`
          @keyframes scComposerMediaIn {
            from {
              opacity: 0;
              transform: scale(0.992);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes scComposerLearnersIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .sc-moment-composer-body {
            min-height: 0;
          }

          .sc-moment-composer-footer {
            background: #FFFFFF;
          }

          @media (max-height: 760px) {
            .sc-moment-composer-shell {
              max-height: calc(100dvh - 86px);
              display: flex;
              flex-direction: column;
              min-height: 0;
            }

            .sc-moment-composer-body {
              flex: 1;
              min-height: 0;
              overflow-y: auto;
              overflow-x: hidden;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior-y: contain;
              padding-right: 1px;
            }

            .sc-moment-composer-footer {
              flex-shrink: 0;
              padding-top: 12px;
              background: #FFFFFF;
            }
          }
        `}</style>

        <div className="sc-moment-composer-body">
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close composer"
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'transparent',
              color: T.ink2,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <X size={18} strokeWidth={1.85} />
          </button>
        </div>

        <div style={{ borderRadius: 22, background: T.soft, overflow: 'hidden', marginBottom: 14 }}>
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              style={{
                width: '100%',
                height: 220,
                objectFit: 'cover',
                display: 'block',
                animation: 'scComposerMediaIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            />
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
          label="Caption"
          value={note}
          onChange={setNote}
          rows={3}
          placeholder="Add a short update..."
          style={{ marginBottom: 14 }}
        />

        <section style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 9,
              padding: '0 2px',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 13.5,
                  fontWeight: 580,
                  color: T.ink,
                  margin: 0,
                }}
              >
                Share with
              </p>


            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setShareMode('all')}
              style={{
                minHeight: 44,
                borderRadius: 15,
                border: shareMode === 'all'
                  ? '1px solid #222222'
                  : `1px solid ${T.border}`,
                background: shareMode === 'all'
                  ? '#222222'
                  : T.soft,
                color: shareMode === 'all'
                  ? '#FFFFFF'
                  : T.ink,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '0 12px',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 580,
                cursor: 'pointer',
                transition:
                  'background 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease',
              }}
            >
              {shareMode === 'all' ? (
                <Check size={14} strokeWidth={2} />
              ) : null}
              All parents
            </button>

            <button
              type="button"
              onClick={() => setShareMode('child')}
              style={{
                minHeight: 44,
                borderRadius: 15,
                border: shareMode === 'child'
                  ? '1px solid #222222'
                  : `1px solid ${T.border}`,
                background: shareMode === 'child'
                  ? '#222222'
                  : T.soft,
                color: shareMode === 'child'
                  ? '#FFFFFF'
                  : T.ink,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '0 12px',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 580,
                cursor: 'pointer',
                transition:
                  'background 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease',
              }}
            >
              {shareMode === 'child' ? (
                <Check size={14} strokeWidth={2} />
              ) : null}
              Specific learners
            </button>
          </div>

          <div
            style={{
              height: 222,
              marginTop: 12,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: shareMode === 'child' ? 1 : 0,
                transform:
                  shareMode === 'child'
                    ? 'translateY(0)'
                    : 'translateY(4px)',
                pointerEvents:
                  shareMode === 'child'
                    ? 'auto'
                    : 'none',
                transition:
                  'opacity 180ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  animation:
                    shareMode === 'child'
                      ? 'scComposerLearnersIn 200ms cubic-bezier(0.16, 1, 0.3, 1) both'
                      : 'none',
                }}
              >
              <div
                style={{
                  maxHeight: 210,
                  overflowY: 'auto',
                  borderRadius: 18,
                  border: `1px solid ${T.border}`,
                  background: T.white,
                }}
              >
              {!learners.length ? (
                <div
                  style={{
                    padding: '16px 14px',
                    fontSize: 13,
                    color: T.ink3,
                    lineHeight: 1.45,
                  }}
                >
                  No learners found yet.
                </div>
              ) : null}

              {learners.map((child: any, index: number) => {
                const selected = selectedIds.includes(child.id)

                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => toggleChild(child.id)}
                    style={{
                      width: '100%',
                      minHeight: 50,
                      border: 'none',
                      borderBottom:
                        index === learners.length - 1
                          ? 'none'
                          : `1px solid ${T.border}`,
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
                    <SelectMark active={selected}>
                      {initials(child.name)}
                    </SelectMark>

                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 560,
                        color: T.ink,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {child.name}
                    </span>
                  </button>
                )
              })}
              </div>
              </div>
            </div>
          </div>
        </section>
        </div>

        <div className="sc-moment-composer-footer">
          <SCButton
            fullWidth
            onClick={sendMoment}
            disabled={sending || !file || !selectedCount}
            leading={<Send size={15} strokeWidth={1.9} />}
          >
            {sending ? 'Sharing...' : 'Share Moment'}
          </SCButton>
        </div>
      </div>
    </SCBottomSheet>
  )
}
