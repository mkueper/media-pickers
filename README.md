# @kampagnen-bot/media-pickers

Gemeinsame React-Komponenten zum Auswählen von GIFs (Tenor) und Emojis (emoji-mart).

## Installation

```bash
npm install @kampagnen-bot/media-pickers @emoji-mart/react @emoji-mart/data
```

Die Picker erwarten eine moderne React-Toolchain (React 18+, Vite/Webpack o. ä.).

## Verwendung

```jsx
import { GifPicker, EmojiPicker } from '@kampagnen-bot/media-pickers'

function Example() {
  const textareaRef = useRef(null)
  const [gifOpen, setGifOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)

  return (
    <>
      <button onClick={() => setGifOpen(true)}>GIF auswählen</button>
      <button onClick={() => setEmojiOpen(true)}>Emoji auswählen</button>

      <GifPicker
        open={gifOpen}
        onClose={() => setGifOpen(false)}
        onPick={(gif) => console.log('Tenor GIF', gif)}
      />

      <EmojiPicker
        open={emojiOpen}
        onClose={() => setEmojiOpen(false)}
        anchorRef={textareaRef}
        onPick={(emoji) => console.log('Emoji', emoji.native)}
      />

      <textarea ref={textareaRef} />
    </>
  )
}
```

### Styling

Die Komponenten liefern schlanke Default-Klassen (Tailwind-kompatibel). Über die Props
`classNames`, `panelProps`, `overlayProps` lassen sich Layout und Farben vollständig
anpassen. Für kompakte Dashboards können z. B. `max-width`/`max-height` per
`panelProps={{ style: { width: '480px', height: '420px' } }}` gesetzt werden.

## Entwicklung

- `src/` enthält die JSX-Quellen (ESM).
- Aktuell wird ohne Build-Step veröffentlicht; die Dateien können von Vite/Webpack direkt verarbeitet werden.
- Für spätere Erweiterungen (z. B. weitere Media-Picker) kann ein Build mit `tsup`/`vite build --lib` ergänzt werden.

## Lizenz

MIT © Michael Küper
