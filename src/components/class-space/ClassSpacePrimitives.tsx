'use client'

import React from 'react'
import { CLASS_SPACE_UI, type ClassSpaceTabItem } from './classSpaceUi'

type ShellProps = {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function ClassSpaceMobileShell({ children, style }: ShellProps) {
  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: CLASS_SPACE_UI.color.bg,
      maxWidth: CLASS_SPACE_UI.shell.maxWidth,
      margin: '0 auto',
      fontFamily: CLASS_SPACE_UI.shell.fontFamily,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}>
      {children}
    </div>
  )
}

type TabsProps = {
  tabs: ClassSpaceTabItem[]
  active: string
  onChange: (key: string) => void
  columns?: number
  stickyTop?: number
}

export function ClassSpaceTabs({ tabs, active, onChange, columns, stickyTop = 0 }: TabsProps) {
  return (
    <div style={{
      position: 'sticky',
      top: stickyTop,
      zIndex: 35,
      padding: CLASS_SPACE_UI.tabs.outerPadding,
      background: 'rgba(252,252,255,0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns || tabs.length}, minmax(0, 1fr))`,
        gap: 6,
        padding: CLASS_SPACE_UI.tabs.groupPadding,
        borderRadius: CLASS_SPACE_UI.tabs.radius,
        background: CLASS_SPACE_UI.color.soft,
        border: `1px solid ${CLASS_SPACE_UI.color.border}`,
      }}>
        {tabs.map((tab) => {
          const selected = active === tab.key

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              style={{
                height: CLASS_SPACE_UI.tabs.height,
                minWidth: 0,
                borderRadius: CLASS_SPACE_UI.tabs.radius,
                border: 'none',
                background: selected ? CLASS_SPACE_UI.color.white : 'transparent',
                color: selected ? CLASS_SPACE_UI.color.ink : CLASS_SPACE_UI.color.ink3,
                fontSize: CLASS_SPACE_UI.tabs.fontSize,
                fontWeight: selected ? CLASS_SPACE_UI.tabs.selectedWeight : CLASS_SPACE_UI.tabs.defaultWeight,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: selected ? '0 5px 14px rgba(0,0,0,0.06)' : 'none',
                transition: 'background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '0 8px',
              }}
            >
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </span>

              {!!tab.badge && tab.badge > 0 && (
                <span style={{
                  minWidth: 17,
                  height: 17,
                  padding: '0 5px',
                  borderRadius: 999,
                  background: CLASS_SPACE_UI.color.red,
                  color: CLASS_SPACE_UI.color.white,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10.5,
                  fontWeight: 900,
                  lineHeight: 1,
                }}>
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
}

export function ClassSpaceButton({ variant = 'primary', fullWidth, style, children, ...props }: ButtonProps) {
  const disabled = !!props.disabled

  const background =
    disabled ? '#D4D4D8' :
    variant === 'primary' ? CLASS_SPACE_UI.color.ink :
    variant === 'secondary' ? CLASS_SPACE_UI.color.soft :
    'transparent'

  const color =
    variant === 'primary' || disabled ? CLASS_SPACE_UI.color.white :
    CLASS_SPACE_UI.color.ink2

  const border =
    variant === 'ghost' ? `1px solid ${CLASS_SPACE_UI.color.border}` : 'none'

  return (
    <button
      {...props}
      style={{
        width: fullWidth ? '100%' : undefined,
        minHeight: CLASS_SPACE_UI.button.primaryHeight,
        padding: CLASS_SPACE_UI.button.padding,
        borderRadius: CLASS_SPACE_UI.button.radius,
        border,
        background,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        fontSize: CLASS_SPACE_UI.button.fontSize,
        fontWeight: CLASS_SPACE_UI.button.fontWeight,
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

type ListRowProps = {
  children: React.ReactNode
  onClick?: () => void
  unread?: boolean
  style?: React.CSSProperties
}

export function ClassSpaceListRow({ children, onClick, unread, style }: ListRowProps) {
  const Comp: any = onClick ? 'button' : 'div'

  return (
    <Comp
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: CLASS_SPACE_UI.listRow.minHeight,
        padding: CLASS_SPACE_UI.listRow.padding,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: unread ? '#F7F8FC' : 'transparent',
        border: 'none',
        borderBottom: `1px solid ${CLASS_SPACE_UI.color.border}`,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'inherit',
        textAlign: 'left',
        ...style,
      }}
    >
      {children}
    </Comp>
  )
}

export const classSpaceInputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: CLASS_SPACE_UI.input.minHeight,
  padding: CLASS_SPACE_UI.input.padding,
  fontSize: CLASS_SPACE_UI.input.fontSize,
  lineHeight: CLASS_SPACE_UI.input.lineHeight,
  border: `1px solid ${CLASS_SPACE_UI.color.border}`,
  borderRadius: CLASS_SPACE_UI.input.radius,
  background: '#FAFAFC',
  color: CLASS_SPACE_UI.color.ink,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

export const classSpaceCardStyle: React.CSSProperties = {
  background: CLASS_SPACE_UI.color.white,
  border: `1px solid ${CLASS_SPACE_UI.color.border}`,
  borderRadius: CLASS_SPACE_UI.card.radius,
  padding: CLASS_SPACE_UI.card.padding,
  boxShadow: CLASS_SPACE_UI.card.softShadow,
}
