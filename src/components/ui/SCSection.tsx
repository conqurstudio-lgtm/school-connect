'use client'

import type { ReactNode } from 'react'

type Props = {
  title?: string
  subtitle?: string
  children: ReactNode
  divided?: boolean
}

export default function SCSection({ title, subtitle, children, divided = false }: Props) {
  return (
    <section className={divided ? 'sc-section sc-section-divided' : 'sc-section'} style={{ marginTop: 18 }}>
      {title ? (
        <div style={{ padding: '0 2px 10px' }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 620, color: 'var(--sc-ink)', letterSpacing: '-.01em' }}>
            {title}
          </h2>
          {subtitle ? (
            <p style={{ margin: '3px 0 0', fontSize: 12.5, lineHeight: 1.35, color: 'var(--sc-ink-3)' }}>
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
