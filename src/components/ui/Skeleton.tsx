// @ts-nocheck
'use client'

interface Props {
  width?:  number | string
  height?: number | string
  radius?: number
  style?:  any
}

export function Skeleton({ width = '100%', height = 14, radius = 6, style = {} }: Props) {
  return (
    <div className="skeleton" style={{
      width, height, borderRadius: radius,
      ...style,
    }} />
  )
}

// Pre-built skeleton for a report card
export function ReportSkeleton() {
  return (
    <div style={{ padding: '8px 24px 32px' }}>
      {/* Hero name */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <Skeleton width={180} height={28} radius={8} style={{ margin: '0 auto 12px' }} />
        <Skeleton width={140} height={14} radius={4} style={{ margin: '0 auto 32px' }} />
      </div>

      {/* Ring placeholder */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <Skeleton width={200} height={200} radius={100} />
      </div>

      {/* Label */}
      <Skeleton width={120} height={18} radius={4} style={{ margin: '0 auto 8px' }} />
      <Skeleton width={150} height={14} radius={4} style={{ margin: '0 auto 40px' }} />

      {/* Comment */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginBottom: 40 }}>
        <Skeleton width="80%" height={14} radius={4} />
        <Skeleton width="65%" height={14} radius={4} />
      </div>

      {/* Subjects toggle */}
      <Skeleton width="100%" height={48} radius={8} />
    </div>
  )
}

// Pre-built skeleton for a feed post
export function PostSkeleton() {
  return (
    <div style={{
      padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <Skeleton width={36} height={36} radius={18} />
        <div style={{ flex: 1 }}>
          <Skeleton width={120} height={12} radius={4} style={{ marginBottom: 6 }} />
          <Skeleton width={80} height={10} radius={4} />
        </div>
      </div>
      <Skeleton width="100%" height={14} radius={4} style={{ marginBottom: 6 }} />
      <Skeleton width="70%" height={14} radius={4} style={{ marginBottom: 14 }} />
      <Skeleton width="100%" height={180} radius={12} />
    </div>
  )
}
