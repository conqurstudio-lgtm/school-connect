'use client'

import { useState } from 'react'

import { authTheme as T } from './authTheme'

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

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
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
  const [hovered, setHovered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isPassword = type === 'password'
  const realType = isPassword && showPassword ? 'text' : type

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label
        htmlFor={name}
        style={{
          display: 'block',
          color: T.colors.inkSoft,
          fontSize: 13.5,
          fontWeight: 560,
          lineHeight: 1.2,
          letterSpacing: '-0.012em',
        }}
      >
        {label}
      </label>

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          borderRadius: T.radius.field,
          border: `1px solid ${focused ? T.colors.borderDark : hovered ? 'rgba(33, 34, 45, 0.24)' : T.colors.border}`,
          background: T.colors.white,
          boxShadow: '0 1px 0 rgba(15,23,42,0.02)',
          transition: 'border-color 160ms ease',
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
            padding: isPassword ? '14px 50px 14px 16px' : '14px 16px',
            border: 'none',
            borderRadius: T.radius.field,
            background: 'transparent',
            color: T.colors.ink,
            outline: 'none',
            boxShadow: '0 1px 0 rgba(15,23,42,0.02)',
            appearance: 'none',
            WebkitAppearance: 'none',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 450,
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
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 32,
              height: 32,
              border: 'none',
              borderRadius: 20,
              background: 'transparent',
              color: T.colors.faint,
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
