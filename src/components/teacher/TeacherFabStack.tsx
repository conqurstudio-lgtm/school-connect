// @ts-nocheck
'use client'

import { Plus, GraduationCap, Home } from 'lucide-react'

interface Props {
  surface:         'school' | 'class'
  onSurfaceChange: (s: 'school' | 'class') => void
  onCompose:       () => void
}

export function TeacherFabStack({ surface, onSurfaceChange, onCompose }: Props) {
  const switchTo: 'school' | 'class' = surface === 'school' ? 'class' : 'school'

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      zIndex: 50,
    }}>
      {/* Small surface switcher above */}
      <button
        onClick={() => onSurfaceChange(switchTo)}
        aria-label={surface === 'school' ? 'Go to my class' : 'Go to school feed'}
        style={{
          width: 42, height: 42, borderRadius: 14,
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: '#1A1A1A',
        }}>
        {surface === 'school'
          ? <GraduationCap size={18} strokeWidth={1.7} />
          : <Home size={18} strokeWidth={1.7} />}
      </button>

      {/* Primary post button with gradient ring */}
      <button
        onClick={onCompose}
        className="fab"
        aria-label="Post to my class"
        style={{
          position: 'static', transform: 'none',
          left: 'auto', bottom: 'auto',
        }}>
        <Plus size={22} strokeWidth={1.8} />
      </button>
    </div>
  )
}
