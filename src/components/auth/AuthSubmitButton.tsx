'use client'

import { authTheme as T } from './authTheme'

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
        minHeight: 56,
        width: '100%',
        borderRadius: T.radius.button,
        border: 'none',
        background: T.colors.ink,
        color: T.colors.white,
        fontSize: 15,
        fontWeight: 680,
        cursor: inactive ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        letterSpacing: '-0.014em',
        marginTop: 8,
        opacity: inactive ? 0.7 : 1,
        boxShadow: inactive ? 'none' : T.shadow.button,
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
              borderTopColor: T.colors.white,
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
