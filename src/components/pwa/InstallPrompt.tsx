'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'sc-install-dismissed'

export function InstallPrompt() {
  const [prompt,     setPrompt]     = useState<BeforeInstallPromptEvent | null>(null)
  const [visible,    setVisible]    = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      window.setTimeout(() => setVisible(true), 2600)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    setInstalling(true)
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setVisible(false)
    setInstalling(false)
    setPrompt(null)
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!visible || !prompt) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 18,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 28px)',
      maxWidth: 468,
      zIndex: 55,
      background: '#1A1A1A',
      borderRadius: 16,
      padding: '14px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      animation: 'slideUpPrompt 0.28s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        flexShrink: 0,
        background: '#FCFCFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#1A1A1A',
          fontFamily: '-apple-system,system-ui,sans-serif',
        }}>SC</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#FCFCFF', margin: '0 0 1px', letterSpacing: '-0.01em' }}>
          Add to Home Screen
        </p>
        <p style={{ fontSize: 12, color: 'rgba(252,252,255,0.55)', margin: 0 }}>
          Get the full app experience
        </p>
      </div>

      <button onClick={handleInstall} disabled={installing} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '8px 13px',
        background: '#FCFCFF',
        border: 'none',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        color: '#1A1A1A',
        cursor: installing ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        fontFamily: 'inherit',
        opacity: installing ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}>
        <Download style={{ width: 13, height: 13 }} strokeWidth={2} />
        {installing ? 'Installing…' : 'Install'}
      </button>

      <button onClick={handleDismiss} style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'rgba(252,252,255,0.4)',
        padding: 4,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
      }}>
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  )
}
