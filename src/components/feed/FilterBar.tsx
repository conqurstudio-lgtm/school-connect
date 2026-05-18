'use client'

import type { FeedFilter } from '@/lib/types'

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'moments',   label: 'Moments'   },
  { key: 'updates',   label: 'Updates'   },
  { key: 'events',    label: 'Events'    },
  { key: 'documents', label: 'Documents' },
  { key: 'pinned',    label: 'Pinned'    },
]

export function FilterBar({ active, onChange, newPosts }: {
  active:    FeedFilter
  onChange:  (f: FeedFilter) => void
  newPosts?: Partial<Record<FeedFilter, boolean>>
}) {
  return (
    <div style={{
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      marginTop:    16,
      marginBottom: 24,
    }}>
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' as any,
        msOverflowStyle: 'none' as any,
        scrollbarWidth: 'none' as any,
        padding: '0 20px',
        gap: 28,
      }}>
        {FILTERS.map(({ key, label }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              style={{
                position:      'relative',
                display:       'inline-flex',
                alignItems:    'center',
                justifyContent:'center',
                height:        42,
                padding:       '0 14px',
                background:    'none',
                border:        'none',
                borderBottom:  isActive ? '2px solid #1A1A1A' : '2px solid transparent',
                marginBottom:  -1, /* sits on top of container border */
                color:         isActive ? '#1A1A1A' : '#9A9A9A',
                fontSize:      14,
                fontWeight:    isActive ? 600 : 400,
                whiteSpace:    'nowrap',
                flexShrink:    0,
                cursor:        'pointer',
                fontFamily:    'inherit',
                transition:    'color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {label}
              {newPosts?.[key] && !isActive && (
                <span style={{
                  position: 'absolute', top: 8, right: 6,
                  width: 5, height: 5,
                  background: '#E8281E', borderRadius: '50%',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
