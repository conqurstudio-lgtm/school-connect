// @ts-nocheck
'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, X } from 'lucide-react'

export type AttachmentDraft = {
  url: string
  name: string
  type: string
  is_image?: boolean
}

const T = {
  ink: '#1A1A1A',
  ink2: '#4A4A4A',
  ink3: '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  white: '#FFFFFF',
}

export function updateAttachment(update: any): AttachmentDraft | null {
  if (update?.attachment_url) {
    return {
      url: update.attachment_url,
      name: update.attachment_name || 'Attachment',
      type: update.attachment_type || '',
      is_image: update.attachment_type?.startsWith?.('image/') || false,
    }
  }

  // Legacy support for messages created before attachment_url existed.
  if (update?.image_url) {
    return {
      url: update.image_url,
      name: 'Image',
      type: 'image',
      is_image: true,
    }
  }

  return null
}

export function AttachmentCard({ attachment, compact = false, onRemove, flush = false }: any) {
  if (!attachment) return null

  const [viewerOpen, setViewerOpen] = useState(false)
  const isImage = attachment.is_image || attachment.type?.startsWith?.('image/')
  const fileName = attachment.name || (isImage ? 'Image' : 'Document')

  if (isImage) {
    const viewer = (
      <div
        onClick={() => setViewerOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100dvh',
          zIndex: 2147483647,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setViewerOpen(false)
          }}
          aria-label="Close image"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 2147483647,
          }}
        >
          <X size={22} strokeWidth={2.1} />
        </button>

        <img
          src={attachment.url}
          alt={fileName}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '96vw',
            maxHeight: '88dvh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: 18,
            boxShadow: '0 24px 90px rgba(0,0,0,0.45)',
            userSelect: 'none',
          }}
        />
      </div>
    )

    return (
      <>
        <div style={{
          marginTop: flush ? 0 : 8,
          position: 'relative',
          maxWidth: compact ? 132 : '100%',
          width: flush ? '100%' : undefined,
        }}>
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            title="Open image"
            style={{
              display: 'block',
              width: compact ? 104 : '100%',
              padding: 0,
              margin: 0,
              border: 'none',
              background: 'transparent',
              lineHeight: 0,
              borderRadius: flush ? 0 : 14,
              overflow: 'hidden',
              cursor: 'zoom-in',
            }}
          >
            <img
              src={attachment.url}
              alt={fileName}
              style={{
                width: '100%',
                maxHeight: compact ? 104 : 320,
                objectFit: 'cover',
                borderRadius: flush ? 0 : 14,
                display: 'block',
                border: flush ? 'none' : `1px solid ${T.border}`,
              }}
            />
          </button>

          {onRemove && (
            <button onClick={onRemove} style={{
              position: 'absolute',
              top: -7,
              right: -7,
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: `1px solid ${T.border}`,
              background: T.white,
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <X size={13} strokeWidth={2.1} />
            </button>
          )}
        </div>

        {viewerOpen && typeof document !== 'undefined'
          ? createPortal(viewer, document.body)
          : null}
      </>
    )
  }

  return (
    <div style={{
      marginTop: 8,
      position: 'relative',
      maxWidth: compact ? 230 : '100%',
    }}>
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: compact ? '8px 9px' : '10px 12px',
          borderRadius: 14,
          background: '#F4F4F6',
          border: `1px solid ${T.border}`,
          color: T.ink,
          textDecoration: 'none',
        }}
      >
        <FileText size={17} strokeWidth={1.9} style={{ flexShrink: 0 }} />
        <span style={{
          fontSize: compact ? 12 : 13,
          fontWeight: 700,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {fileName}
        </span>
        {!compact && (
          <span style={{
            fontSize: 11,
            color: T.ink3,
            fontWeight: 700,
            flexShrink: 0,
          }}>
            Open
          </span>
        )}
      </a>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onRemove() }}
          style={{
            position: 'absolute',
            top: -7,
            right: -7,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: T.white,
            color: T.ink2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={12} strokeWidth={2.2} />
        </button>
      )}
    </div>
  )
}

export function AttachmentPreviewTray({ attachment, onRemove }: any) {
  if (!attachment) return null

  return (
    <div style={{
      padding: '0 2px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      <AttachmentCard attachment={attachment} compact onRemove={onRemove} />
    </div>
  )
}
