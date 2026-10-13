'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Two-step confirmation for destructive actions.
 *
 * A `window.confirm` dialog is easy but gets blocked in some embedded
 * browsers and cannot be styled to match. Requiring a second click within a
 * few seconds is just as hard to do by accident and stays on-theme; the
 * armed state resets itself so a stray first click does not leave a live
 * delete button sitting there.
 */
export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel,
  className,
  icon,
  disabled,
  timeoutMs = 4000,
}: {
  onConfirm: () => void
  label: string
  confirmLabel: string
  className?: string
  icon?: ReactNode
  disabled?: boolean
  timeoutMs?: number
}) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <button
      type="button"
      disabled={disabled}
      aria-live="polite"
      className={className}
      onBlur={() => {
        if (timer.current) clearTimeout(timer.current)
        setArmed(false)
      }}
      onClick={() => {
        if (armed) {
          if (timer.current) clearTimeout(timer.current)
          setArmed(false)
          onConfirm()
          return
        }
        setArmed(true)
        timer.current = setTimeout(() => setArmed(false), timeoutMs)
      }}
    >
      {icon}
      {armed ? confirmLabel : label}
    </button>
  )
}
