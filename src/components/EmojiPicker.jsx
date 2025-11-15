import { useEffect } from 'react'
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import { useEmojiPopover } from '../hooks/useEmojiPopover.js'

const defaultClasses = {
  overlay: '',
  panel: ''
}

const DEFAULT_OVERLAY_STYLE = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 1100
}

const DEFAULT_PANEL_STYLE = {
  position: 'fixed',
  pointerEvents: 'auto',
  borderRadius: 16,
  border: '1px solid rgba(15, 23, 42, 0.12)',
  background: '#ffffff',
  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.22)',
  overflow: 'hidden'
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
  style,
  styles
}) {
  const mergedClasses = { ...defaultClasses, ...(classNames ?? {}) }
  const styleOverrides = styles || {}
  const { className: overlayClassNameProp, style: overlayStyleProp, ...restOverlayProps } = overlayProps || {}
  const { className: panelClassNameProp, style: panelStyleProp, ...restPanelProps } = panelProps || {}
  const overlayClassName = [mergedClasses.overlay, overlayClassNameProp].filter(Boolean).join(' ')
  const panelClassName = [mergedClasses.panel, panelClassNameProp].filter(Boolean).join(' ')
  const overlayStyle = { ...DEFAULT_OVERLAY_STYLE, ...(styleOverrides.overlay || {}), ...(overlayStyleProp || {}) }
  const panelStyleBase = { ...DEFAULT_PANEL_STYLE, ...(styleOverrides.panel || {}), ...(panelStyleProp || {}) }
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
      {...restOverlayProps}
      className={overlayClassName}
      style={overlayStyle}
      role='presentation'
    >
      <div
        {...restPanelProps}
        id='kb-emoji-picker-panel'
        ref={setPopoverRef}
        className={panelClassName}
        style={{
          ...panelStyleBase,
          top: position.top,
          left: position.left,
          width: `min(${maxWidth}px, 95vw)`,
          height: `min(${maxHeight}px, 85vh)`,
          ...style
        }}
      >
        <Picker
          data={emojiData}
          locale={locale}
          theme={theme}
          set='native'
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
