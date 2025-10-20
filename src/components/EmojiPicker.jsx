import { useEffect } from 'react'
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import { useEmojiPopover } from '../hooks/useEmojiPopover.js'

const defaultClasses = {
  overlay: 'fixed inset-0 z-[1100] pointer-events-none',
  panel: 'pointer-events-auto rounded-2xl border border-border bg-background shadow-lg'
}

export function EmojiPicker({
  open,
  onClose,
  onPick,
  anchorRef,
  locale = 'de',
  theme = 'auto',
  maxWidth = 360,
  maxHeight = 520,
  verticalAlign = 'bottom',
  classNames,
  overlayProps,
  panelProps,
  style
}) {
  const mergedClasses = { ...defaultClasses, ...(classNames ?? {}) }
  const { position, setPopoverRef, updatePosition } = useEmojiPopover({
    anchorRef,
    open,
    maxHeight,
    maxWidth,
    verticalAlign
  })

  useEffect(() => {
    if (!open) return
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    const handleMouseDown = (event) => {
      const anchor = anchorRef.current
      const panel = document.getElementById('kb-emoji-picker-panel')
      if (panel && panel.contains(event.target)) return
      if (anchor && anchor.contains(event.target)) return
      onClose()
    }
    window.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [open, onClose, anchorRef])

  useEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  if (!open) return null

  return (
    <div
      {...overlayProps}
      className={[mergedClasses.overlay, overlayProps?.className].filter(Boolean).join(' ')}
      role='presentation'
      aria-hidden
    >
      <div
        {...panelProps}
        id='kb-emoji-picker-panel'
        ref={setPopoverRef}
        className={[mergedClasses.panel, panelProps?.className].filter(Boolean).join(' ')}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: `min(${maxWidth}px, 95vw)`,
          maxHeight: `min(${maxHeight}px, 85vh)`,
          overflow: 'hidden',
          ...style,
          ...panelProps?.style
        }}
      >
        <Picker
          data={emojiData}
          locale={locale}
          theme={theme}
          navPosition='top'
          previewPosition='none'
          searchPosition='sticky'
          onEmojiSelect={(emoji) => {
            onPick(emoji)
            onClose()
          }}
        />
      </div>
    </div>
  )
}
