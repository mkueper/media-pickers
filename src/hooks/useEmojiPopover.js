import { useCallback, useEffect, useRef, useState } from 'react'

const getWindow = () => (typeof globalThis !== 'undefined' && globalThis.window ? globalThis.window : undefined)

export function useEmojiPopover({
  anchorRef,
  open,
  margin = 8,
  maxWidth = 360,
  maxHeight = 520,
  verticalAlign = 'bottom'
}) {
  const popoverRef = useRef(null)
  const [position, setPosition] = useState({ top: -9999, left: -9999 })

  const setPopoverRef = useCallback((node) => {
    popoverRef.current = node
  }, [])

  const updatePosition = useCallback(() => {
    try {
      const win = getWindow()
      if (!win) return
      const anchor = anchorRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const vw = win.innerWidth
      const vh = win.innerHeight
      const width = Math.min(maxWidth, Math.floor(vw * 0.95))
      const height = Math.min(maxHeight, Math.floor(vh * 0.85))

      let top
      if (verticalAlign === 'center') {
        top = rect.top + rect.height / 2 - height / 2
      } else {
        top = rect.bottom + margin
      }
      let left = rect.left + rect.width / 2 - width / 2

      if (verticalAlign !== 'center' && top + height > vh - margin) {
        top = Math.max(margin, rect.top - height - margin)
      }
      if (top < margin) {
        top = margin
      }
      if (left < margin) {
        left = margin
      }
      if (left + width > vw - margin) {
        left = Math.max(margin, vw - margin - width)
      }

      setPosition({ top, left })
    } catch {
      // ignore
    }
  }, [anchorRef, margin, maxHeight, maxWidth, verticalAlign])

  useEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    const win = getWindow()
    if (!open || !win) return
    const handler = () => updatePosition()
    win.addEventListener('resize', handler)
    win.addEventListener('scroll', handler, true)
    return () => {
      win.removeEventListener('resize', handler)
      win.removeEventListener('scroll', handler, true)
    }
  }, [open, updatePosition])

  return { position, setPopoverRef, updatePosition }
}
