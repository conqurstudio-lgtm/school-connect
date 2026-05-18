// @ts-nocheck
'use client'

import { useState } from 'react'
import { Plus, MoreVertical, Pencil, Trash2, Users, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  white:  '#FFFFFF',
  red:    '#EF4444',
}

interface Child {
  id: string; name: string; guardian_count: number
}

interface Props {
  children: Child[]
  onChanged: () => void
}

export function TeacherRoster({ children, onChanged }: Props) {
  const [showAdd,  setShowAdd]  = useState(false)
  const [editing,  setEditing]  = useState<Child | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const addChild = async (name: string) => {
    const tid = toast.loading('Adding…')
    try {
      const res = await fetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success(`${name} added`, { id: tid })
      onChanged()
    } catch (e: any) { toast.error(e.message || 'Failed', { id: tid }) }
  }

  const renameChild = async (id: string, name: string) => {
    const tid = toast.loading('Saving…')
    try {
      const res = await fetch('/api/teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success('Renamed', { id: tid })
      setEditing(null)
      onChanged()
    } catch (e: any) { toast.error(e.message || 'Failed', { id: tid }) }
  }

  const removeChild = async (id: string, name: string) => {
    setOpenMenu(null)
    if (!confirm(`Remove ${name} from your class?`)) return
    const tid = toast.loading('Removing…')
    try {
      const res = await fetch(`/api/teacher?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      toast.success(`${name} removed`, { id: tid })
      onChanged()
    } catch { toast.error('Could not remove', { id: tid }) }
  }

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>
          {children.length === 0
            ? 'No children yet'
            : `${children.length} ${children.length === 1 ? 'child' : 'children'} in your class`}
        </p>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 999,
          background: T.ink, color: T.white, border: 'none',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <Plus size={12} strokeWidth={2.4} /> Add child
        </button>
      </div>

      {children.length === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          border: `1px dashed ${T.border}`, borderRadius: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: '#F0F0F4',
            margin: '0 auto 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={20} color={T.ink3} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
            Add children so parents can claim them when they join.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {children.map(child => (
            <div key={child.id} style={{
              padding: '12px 14px', borderRadius: 12,
              background: T.white, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 12,
              position: 'relative',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#F0F0F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 12, color: T.ink2, fontWeight: 600,
              }}>
                {child.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>

              {editing?.id === child.id ? (
                <RenameField value={editing.name}
                  onCancel={() => setEditing(null)}
                  onSave={v => renameChild(child.id, v)} />
              ) : (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: T.ink,
                              margin: 0, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {child.name}
                  </p>
                  <p style={{ fontSize: 11, color: T.ink3, margin: '2px 0 0' }}>
                    {child.guardian_count === 0 ? 'No parents yet'
                    : child.guardian_count === 1 ? '1 parent linked'
                    : `${child.guardian_count} parents linked`}
                  </p>
                </div>
              )}

              {!editing && (
                <button onClick={() => setOpenMenu(openMenu === child.id ? null : child.id)}
                  aria-label="Options" style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.ink3,
                  }}>
                  <MoreVertical size={14} strokeWidth={1.8} />
                </button>
              )}

              {openMenu === child.id && (
                <div className="dropdown-in" style={{
                  position: 'absolute', right: 10, top: 46, zIndex: 10,
                  background: T.white, borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  padding: '4px 0', minWidth: 150,
                }}>
                  <MenuItem onClick={() => { setOpenMenu(null); setEditing(child) }}
                    Icon={Pencil} label="Rename" />
                  <MenuItem onClick={() => removeChild(child.id, child.name)}
                    Icon={Trash2} label="Remove" danger />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddChildModal onClose={() => setShowAdd(false)}
          onAdd={(name) => { addChild(name); setShowAdd(false) }} />
      )}
    </div>
  )
}

function MenuItem({ onClick, Icon, label, danger }: any) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', background: 'none', border: 'none',
      cursor: 'pointer', fontSize: 13, fontWeight: 500,
      color: danger ? T.red : T.ink, fontFamily: 'inherit',
      textAlign: 'left',
    }}>
      <Icon size={13} strokeWidth={1.8} />
      {label}
    </button>
  )
}

function RenameField({ value, onCancel, onSave }: any) {
  const [v, setV] = useState(value)
  return (
    <div style={{ flex: 1, display: 'flex', gap: 6 }}>
      <input value={v} onChange={e => setV(e.target.value)} autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') onSave(v.trim())
          if (e.key === 'Escape') onCancel()
        }}
        style={{ flex: 1, padding: '7px 10px', fontSize: 13,
          border: `1px solid ${T.border}`, borderRadius: 8,
          fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={() => onSave(v.trim())} style={{
        width: 30, height: 30, borderRadius: 8,
        background: T.ink, color: T.white, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Check size={12} strokeWidth={2.4} /></button>
      <button onClick={onCancel} style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'none', border: `1px solid ${T.border}`, cursor: 'pointer',
        color: T.ink3, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}><X size={12} strokeWidth={1.8} /></button>
    </div>
  )
}

function AddChildModal({ onClose, onAdd }: any) {
  const [name, setName] = useState('')
  const submit = () => { const n = name.trim(); if (n) onAdd(n) }
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '20px 20px 0 0', padding: 24,
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.ink,
                       letterSpacing: '-0.02em', margin: 0 }}>Add a child</h3>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}><X size={18} strokeWidth={1.8} /></button>
        </div>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.ink3,
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
            Child's full name
          </span>
          <input autoFocus value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder="Emma Johnson"
            style={{
              width: '100%', padding: '12px 14px', fontSize: 15,
              border: `1px solid ${T.border}`, borderRadius: 12,
              background: T.white, color: T.ink, outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }} />
        </label>
        <button onClick={submit} style={{
          width: '100%', marginTop: 16, padding: '14px',
          borderRadius: 12, background: T.ink, color: T.white, border: 'none',
          fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>Add child</button>
      </div>
    </div>
  )
}
