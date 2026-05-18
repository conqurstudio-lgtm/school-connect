// Minimal post skeleton — static, no shimmer, very light render.
// Also exports a FeedSkeleton that includes a teachers strip placeholder.

const cellBg = '#F0F0F2'

export function PostSkeleton() {
  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', gap: 12, padding: '16px 20px 8px', alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: cellBg, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: '40%', height: 10, background: cellBg, borderRadius: 4, marginBottom: 6 }} />
          <div style={{ width: '22%', height: 9, background: cellBg, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ width: '92%', height: 10, background: cellBg, borderRadius: 4, marginBottom: 6 }} />
        <div style={{ width: '70%', height: 10, background: cellBg, borderRadius: 4 }} />
      </div>
      <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 20px 0' }} />
    </div>
  )
}

export function TeachersStripSkeleton() {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '16px 16px 20px',
      overflowX: 'hidden',
    }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: 108, height: 108, borderRadius: 36,
          background: cellBg, flexShrink: 0,
        }} />
      ))}
    </div>
  )
}

export function FilterBarSkeleton() {
  return (
    <div style={{
      display: 'flex', gap: 28, padding: '16px 20px 14px',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      marginTop: 16, marginBottom: 24,
    }}>
      {[40, 60, 50, 45, 70, 40].map((w, i) => (
        <div key={i} style={{
          width: w, height: 14, background: cellBg, borderRadius: 4, flexShrink: 0,
        }} />
      ))}
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div style={{ opacity: 0.7 }}>
      <TeachersStripSkeleton />
      <FilterBarSkeleton />
      {[1, 2, 3, 4].map(i => <PostSkeleton key={i} />)}
    </div>
  )
}
