'use client'

import type { ReactNode } from 'react'

type Props = {
  icon?: ReactNode
  title: string
  text?: string
  action?: ReactNode
}

export default function SCEmptyState({ icon, title, text, action }: Props) {
  return (
    <div
      className="sc-empty-state"
      style={{
        padding: '26px 18px',
        textAlign: 'center',
        borderRadius: 24,
        background: 'var(--sc-soft)',
        color: 'var(--sc-ink)',
      }}
    >
      {icon ? <div style={{ marginBottom: 10, color: 'var(--sc-ink-3)' }}>{icon}</div> : null}
      <div style={{ fontSize: 14, fontWeight: 620, marginBottom: text ? 5 : 0 }}>{title}</div>
      {text ? <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: 'var(--sc-ink-3)' }}>{text}</p> : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  )
}
