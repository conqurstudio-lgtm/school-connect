export function PageGhostLoader() {
  const row = (width: number | string, height = 12, radius = 999) => (
    <span
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #F1F2F3 0%, #FAFAFA 48%, #F1F2F3 100%)',
        backgroundSize: '220% 100%',
        animation: 'scGhostMove 1.35s ease-in-out infinite',
        display: 'block',
      }}
    />
  )

  return (
    <main
      aria-label="Loading"
      style={{
        minHeight: '100dvh',
        background: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 'calc(18px + env(safe-area-inset-top, 0px)) 18px calc(24px + env(safe-area-inset-bottom, 0px))',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <style>{`
        @keyframes scGhostMove {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
      `}</style>

      <section
        style={{
          width: '100%',
          maxWidth: 430,
          paddingTop: 8,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 28,
        }}>
          {row(38, 38, 999)}
          <div style={{ flex: 1 }}>
            {row('52%', 13)}
            <div style={{ height: 8 }} />
            {row('34%', 9)}
          </div>
        </div>

        <div style={{
          borderRadius: 24,
          background: '#FFFFFF',
          padding: 18,
          border: '1px solid rgba(0,0,0,0.04)',
        }}>
          {row('70%', 16)}
          <div style={{ height: 14 }} />
          {row('92%', 11)}
          <div style={{ height: 8 }} />
          {row('78%', 11)}
          <div style={{ height: 20 }} />
          {row('100%', 52, 18)}
          <div style={{ height: 10 }} />
          {row('100%', 52, 18)}
          <div style={{ height: 10 }} />
          {row('64%', 52, 18)}
        </div>
      </section>
    </main>
  )
}
