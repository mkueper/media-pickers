import { useCallback, useEffect, useRef, useState } from 'react'

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
      const anchor = anchorRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const width = Math.min(maxWidth, Math.floor(vw * 0.95))
      const height = Math.min(maxHeight, Math.floor(vh * 0.85))

      let top =
        verticalAlign === 'center'
          ? rect.top + rect.height / 2
          : rect.bottom + margin
      let left = rect.left + rect.width / 2 - width / 2

      if (top + height > vh - margin) {
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
  }, [anchorRef, margin, maxHeight, maxWidth])

  useEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const handler = () => updatePosition()
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [open, updatePosition])

  return { position, setPopoverRef, updatePosition }
}
