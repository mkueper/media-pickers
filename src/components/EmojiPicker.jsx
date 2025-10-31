import { useEffect } from 'react'
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import { useEmojiPopover } from '../hooks/useEmojiPopover.js'

/**
 * Stellt einen Emoji-Picker als Popover dar, der sich relativ zu einem Anker-Element positioniert.
 * Der Picker verwaltet sowohl Fokus- als auch Escape-Key-Handhabung und schließt sich, wenn
 * außerhalb des Panels geklickt wird. Die Komponente ist bewusst stilunabhängig und erlaubt
 * umfassendes Styling via Klassen- und Inline-Overrides.
 */
const defaultClasses = {
  overlay: '',
  panel: ''
}

/**
 * Basis-Styling für den transparenten Overlay, der Tastaturfokus und Klicks abfängt.
 */
const DEFAULT_OVERLAY_STYLE = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 1100
}

/**
 * Basis-Styling für das Popover-Panel, das den eigentlichen Emoji-Picker enthält.
 */
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
  /**
   * Klassen- und Stil-Overrides zusammenführen, damit Aufrufer:innen nur einzelne Schlüssel überschreiben müssen.
   */
  const mergedClasses = { ...defaultClasses, ...(classNames ?? {}) }
  const styleOverrides = styles || {}
  const { className: overlayClassNameProp, style: overlayStyleProp, ...restOverlayProps } = overlayProps || {}
  const { className: panelClassNameProp, style: panelStyleProp, ...restPanelProps } = panelProps || {}
  const overlayClassName = [mergedClasses.overlay, overlayClassNameProp].filter(Boolean).join(' ')
  const panelClassName = [mergedClasses.panel, panelClassNameProp].filter(Boolean).join(' ')
  const overlayStyle = { ...DEFAULT_OVERLAY_STYLE, ...(styleOverrides.overlay || {}), ...(overlayStyleProp || {}) }
  const panelStyleBase = { ...DEFAULT_PANEL_STYLE, ...(styleOverrides.panel || {}), ...(panelStyleProp || {}) }
  /**
   * useEmojiPopover berechnet und aktualisiert die Position relativ zum Anker-Element.
   */
  const { position, setPopoverRef, updatePosition } = useEmojiPopover({
    anchorRef,
    open,
    maxHeight,
    maxWidth,
    verticalAlign
  })

  /**
   * Schließen des Popovers mittels Escape-Taste oder Klick außerhalb von Panel bzw. Anker.
   */
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

  /**
   * Position nach dem Öffnen aktualisieren, damit Layout-Änderungen berücksichtigt werden.
   */
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
      aria-hidden
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
          maxHeight: `min(${maxHeight}px, 85vh)`,
          ...style
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
