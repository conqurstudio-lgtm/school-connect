'use client'

import { useState } from 'react'

type AuthFormFieldProps = {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'tel'
  placeholder?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
  inputMode?: 'email' | 'tel' | 'text'
  autoFocus?: boolean
  defaultValue?: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const T = {
  ink: '#21222D',
  muted: 'rgba(33, 34, 45, 0.62)',
  border: '#DBDBE5',
  accent: '#958CE8',
  white: '#FFFFFF',
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      {open ? (
        <>
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
          <path d="m2 2 20 20" />
        </>
      )}
    </svg>
  )
}

export function AuthFormField({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  minLength,
  autoComplete,
  inputMode,
  autoFocus,
  defaultValue,
  value,
  onChange,
}: AuthFormFieldProps) {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isPassword = type === 'password'
  const realType = isPassword && showPassword ? 'text' : type

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label
        htmlFor={name}
        style={{
          display: 'block',
          color: T.muted,
          fontSize: 13,
          fontWeight: 560,
          lineHeight: 1.2,
          letterSpacing: '-0.012em',
        }}
      >
        {label}
      </label>

      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          border: `1px solid ${focused ? T.accent : T.border}`,
          background: T.white,
          boxShadow: focused ? '0 0 0 3px rgba(149, 140, 232, 0.16)' : 'none',
          transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
          transform: focused ? 'translateY(-1px)' : 'translateY(0)',
        }}
      >
        <input
          id={name}
          name={name}
          type={realType}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoFocus={autoFocus}
          placeholder={placeholder}
          defaultValue={value === undefined ? defaultValue : undefined}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            minHeight: 52,
            padding: isPassword ? '14px 50px 14px 15px' : '14px 15px',
            border: 'none',
            borderRadius: 16,
            background: 'transparent',
            color: T.ink,
            outline: 'none',
            boxShadow: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 460,
            lineHeight: 1.25,
            boxSizing: 'border-box',
          }}
        />

        {isPassword ? (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((current) => !current)}
            tabIndex={-1}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 34,
              height: 34,
              border: 'none',
              borderRadius: 999,
              background: 'transparent',
              color: 'rgba(33,34,45,0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
              transition: 'color 160ms ease',
            }}
          >
            <EyeIcon open={showPassword} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
