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
  ink2: '#545866',
  border: '#DBDBE5',
  accent: '#958CE8',
  white: '#FFFFFF',
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      {open ? (
        <>
          <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M10.73 5.08a10.75 10.75 0 0 1 11.21 6.57 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.44 2.49" />
          <path d="M14.08 14.16a3 3 0 0 1-4.24-4.24" />
          <path d="M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14" />
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
          color: T.ink,
          fontSize: 12.4,
          fontWeight: 560,
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
          boxShadow: focused ? '0 0 0 3px rgba(149, 140, 232, 0.14)' : 'none',
          transition: 'border-color 170ms ease, box-shadow 170ms ease, transform 170ms ease',
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
            padding: isPassword ? '14px 48px 14px 15px' : '14px 15px',
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
            fontWeight: 440,
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
              color: T.ink2,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <EyeIcon open={showPassword} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
