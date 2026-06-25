'use client'

const T = {
  primary: '#21222D',
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
        borderRadius: 16,
        border: 'none',
        background: T.primary,
        color: T.white,
        fontSize: 13.2,
        fontWeight: 610,
        cursor: inactive ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        letterSpacing: '-0.012em',
        marginTop: 8,
        opacity: inactive ? 0.72 : 1,
        transition: 'transform 160ms ease, opacity 160ms ease, background 160ms ease',
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
