'use client'

const T = {
  primary: '#00733f',
  white: '#FFFFFF',
}

export function AuthSubmitButton({
  children,
  loading,
  disabled,
  type = 'submit',
  onClick,
}: {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  type?: 'submit' | 'button'
  onClick?: () => void
}) {
  const inactive = Boolean(loading || disabled)

  return (
    <button
      type={type}
      className="sc-pressable"
      disabled={inactive}
      onClick={onClick}
      style={{
        minHeight: 52,
        width: '100%',
        borderRadius: 12,
        border: 'none',
        background: T.primary,
        color: T.white,
        fontSize: 14,
        fontWeight: 650,
        cursor: inactive ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        letterSpacing: '-0.012em',
        marginTop: 8,
        opacity: inactive ? 0.7 : 1,
        boxShadow: inactive
          ? '0 10px 22px rgba(0,115,63,0.10)'
          : '0 14px 28px rgba(0,115,63,0.22)',
        transition: 'transform 170ms ease, opacity 170ms ease, background 170ms ease, box-shadow 170ms ease',
      }}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.38)',
              borderTopColor: T.white,
              display: 'inline-block',
              animation: 'scSpin 700ms linear infinite',
            }}
          />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
