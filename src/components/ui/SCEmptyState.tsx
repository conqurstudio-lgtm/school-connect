'use client'

import React from 'react'

type SCEmptyStateProps = {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
}

export default function SCEmptyState({ icon, title, subtitle, action }: SCEmptyStateProps) {
  return (
    <div className="sc-empty-state" style={{ borderRadius: 24, background: 'var(--sc-soft)', border: '1px solid var(--sc-border-soft)', padding: 18, textAlign: 'center' }}>
      {icon ? <div style={{ width: 44, height: 44, borderRadius: 18, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sc-surface)', color: 'var(--sc-muted-accent)' }}>{icon}</div> : null}
      <div style={{ fontSize: 14, fontWeight: 620, color: 'var(--sc-ink)' }}>{title}</div>
      {subtitle ? <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.4, color: 'var(--sc-ink-3)' }}>{subtitle}</div> : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  )
}
