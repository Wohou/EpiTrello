'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react'
import './NotificationModal.css'

// ── Types ────────────────────────────────────────────────────────
type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

type AlertOptions = {
  title?: string
  message: string
  okText?: string
  variant?: 'info' | 'error' | 'success'
}

type ToastOptions = {
  message: string
  variant?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface NotificationContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alert: (options: AlertOptions) => Promise<void>
  toast: (options: ToastOptions) => void
}

// ── Context ──────────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

// ── Toast item ───────────────────────────────────────────────────
interface ToastItem {
  id: number
  message: string
  variant: 'success' | 'error' | 'info' | 'warning'
  exiting?: boolean
}

const TOAST_ICONS: Record<string, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
}

// ── Provider ─────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: ReactNode }) {
  // Confirm state
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)
  // Alert state
  const [alertState, setAlertState] = useState<(AlertOptions & { resolve: () => void }) | null>(null)
  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastIdRef = useRef(0)

  // ── confirm() ──────────────────────────────────────────────────
  const confirmFn = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve })
    })
  }, [])

  const handleConfirmYes = () => {
    confirmState?.resolve(true)
    setConfirmState(null)
  }

  const handleConfirmNo = () => {
    confirmState?.resolve(false)
    setConfirmState(null)
  }

  // ── alert() ────────────────────────────────────────────────────
  const alertFn = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      setAlertState({ ...options, resolve })
    })
  }, [])

  const handleAlertOk = () => {
    alertState?.resolve()
    setAlertState(null)
  }

  // ── toast() ────────────────────────────────────────────────────
  const toastFn = useCallback((options: ToastOptions) => {
    const id = ++toastIdRef.current
    const item: ToastItem = {
      id,
      message: options.message,
      variant: options.variant || 'info',
    }
    setToasts((prev) => [...prev, item])

    const duration = options.duration || 3000
    setTimeout(() => {
      // Start exit animation
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
      // Remove after animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 200)
    }, duration)
  }, [])

  // ── Keyboard support ──────────────────────────────────────────
  useEffect(() => {
    if (!confirmState && !alertState) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmState) handleConfirmNo()
        if (alertState) handleAlertOk()
      }
      if (e.key === 'Enter') {
        if (alertState) handleAlertOk()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  // ── Icon helpers ──────────────────────────────────────────────
  const getConfirmIcon = (variant?: string) => {
    if (variant === 'danger') return '⚠️'
    return '❓'
  }

  const getAlertIcon = (variant?: string) => {
    if (variant === 'error') return '❌'
    if (variant === 'success') return '✅'
    return 'ℹ️'
  }

  const getAlertIconClass = (variant?: string) => {
    if (variant === 'error') return 'alert-icon'
    if (variant === 'success') return 'success-icon'
    return 'info-icon'
  }

  return (
    <NotificationContext.Provider value={{ confirm: confirmFn, alert: alertFn, toast: toastFn }}>
      {children}

      {/* ── Confirm Modal ── */}
      {confirmState && (
        <div className="notification-overlay" onClick={handleConfirmNo}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`notification-icon ${confirmState.variant === 'danger' ? 'alert-icon' : 'confirm-icon'}`}>
              {getConfirmIcon(confirmState.variant)}
            </div>
            {confirmState.title && <div className="notification-title">{confirmState.title}</div>}
            <div className="notification-message">{confirmState.message}</div>
            <div className="notification-actions">
              <button className="notification-btn-cancel" onClick={handleConfirmNo}>
                {confirmState.cancelText || 'Annuler'}
              </button>
              <button
                className={confirmState.variant === 'danger' ? 'notification-btn-danger' : 'notification-btn-confirm'}
                onClick={handleConfirmYes}
                autoFocus
              >
                {confirmState.confirmText || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alert Modal ── */}
      {alertState && (
        <div className="notification-overlay" onClick={handleAlertOk}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`notification-icon ${getAlertIconClass(alertState.variant)}`}>
              {getAlertIcon(alertState.variant)}
            </div>
            {alertState.title && <div className="notification-title">{alertState.title}</div>}
            <div className="notification-message">{alertState.message}</div>
            <div className="notification-actions">
              <button className="notification-btn-ok" onClick={handleAlertOk} autoFocus>
                {alertState.okText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Container ── */}
      {toasts.length > 0 && (
        <div className="notification-toast-container">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`notification-toast toast-border-${t.variant} ${t.exiting ? 'toast-exit' : ''}`}
            >
              <span className="toast-icon">{TOAST_ICONS[t.variant]}</span>
              <span className="toast-message">{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  )
}
