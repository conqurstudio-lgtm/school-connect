'use client'

import React from 'react'
import { CLASS_SPACE_UI, type ClassSpaceTabItem } from './classSpaceUi'

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
