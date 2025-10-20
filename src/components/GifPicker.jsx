import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTenorSearch } from '../hooks/useTenorSearch.js'

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024

const defaultLabels = {
  title: 'GIF suchen (Tenor)',
  searchPlaceholder: 'Suchbegriff',
  searchButton: 'Suchen',
  closeButton: 'Schließen',
  emptyFeatured: 'Keine GIFs verfügbar.',
  emptySearch: 'Keine GIFs gefunden. Bitte anderen Suchbegriff probieren.',
  loadingMore: 'Weitere GIFs werden geladen…',
  loadMoreHint: 'Scroll weiter nach unten, um mehr GIFs zu laden.',
  errorPrefix: 'Fehler'
}

const defaultClasses = {
  overlay: '',
  panel: '',
  header: '',
  title: '',
  searchBar: '',
  input: '',
  button: '',
  buttonPrimary: '',
  content: '',
  grid: '',
  itemButton: '',
  image: '',
  statusText: '',
  footer: '',
  skeleton: '',
  error: ''
}

const DEFAULT_STYLES = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(2px)',
    zIndex: 1000,
    padding: '12px'
  },
  panel: {
    width: 'min(580px, 92vw)',
    maxHeight: '82vh',
    borderRadius: '18px',
    border: '1px solid rgba(30, 41, 59, 0.12)',
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 22px 48px rgba(15, 23, 42, 0.28)'
  },
  header: {
    display: 'grid',
    gridTemplateRows: 'auto',
    gridTemplateColumns: '1fr',
    gap: '10px',
    alignItems: 'center',
    padding: '12px 14px',
    borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
    background: 'rgba(248, 250, 252, 0.9)'
  },
  title: {
    flex: '1 1 auto',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a'
  },
  searchBar: {
    display: 'flex',
    gap: '8px',
    flex: '1 1 auto',
    alignItems: 'center'
  },
  input: {
    flex: '1 1 auto',
    borderRadius: '12px',
    border: '1px solid rgba(15, 23, 42, 0.18)',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none'
  },
  button: {
    borderRadius: '10px',
    border: '1px solid rgba(15, 23, 42, 0.15)',
    background: 'rgba(226, 232, 240, 0.6)',
    padding: '6px 10px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  buttonPrimary: {
    borderRadius: '10px',
    border: 'none',
    background: '#2563eb',
    color: '#ffffff',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  content: {
    flex: '1 1 auto',
    padding: '12px 16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: '#f8fafc'
  },
  grid: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))'
  },
  itemButton: {
    borderRadius: '14px',
    border: '1px solid rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
    background: '#ffffff',
    padding: 0,
    cursor: 'pointer'
  },
  image: {
    width: '100%',
    height: '140px',
    objectFit: 'cover',
    display: 'block'
  },
  statusText: {
    fontSize: '13px',
    color: 'rgba(30, 41, 59, 0.7)'
  },
  footer: {
    borderTop: '1px solid rgba(15, 23, 42, 0.08)',
    padding: '12px 16px',
    textAlign: 'right',
    fontSize: '12px',
    color: 'rgba(30, 41, 59, 0.65)'
  },
  skeleton: {
    height: '140px',
    borderRadius: '14px',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    background: 'rgba(226, 232, 240, 0.7)'
  },
  error: {
    fontSize: '13px',
    color: '#dc2626'
  }
}

const parseSize = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return 0
}

const pickVariant = (variants, maxBytes) => {
  const order = ['nanogif', 'tinygif', 'gif']
  for (const key of order) {
    const variant = variants[key]
    if (!variant || !variant.url) continue
    const size = parseSize(variant.size ?? null)
    if (!size || size <= maxBytes) return [key, variant]
  }
  for (const key of order) {
    const variant = variants[key]
    if (variant && variant.url) return [key, variant]
  }
  const first = Object.entries(variants).find(([, variant]) => variant && variant.url)
  if (first) return first
  return ['', null]
}

export function GifPicker({
  open,
  onClose,
  onPick,
  maxBytes = DEFAULT_MAX_BYTES,
  fetcher,
  featuredLimit,
  searchLimit,
  labels,
  classNames,
  overlayProps,
  panelProps,
  styles,
  autoFocus = true
}) {
  const mergedLabels = { ...defaultLabels, ...(labels ?? {}) }
  const mergedClasses = { ...defaultClasses, ...(classNames ?? {}) }
  const styleOverrides = styles || {}
  const styleFor = (key) => ({
    ...DEFAULT_STYLES[key],
    ...(styleOverrides[key] || {})
  })
  const { className: overlayClassNameProp, style: overlayStyleProp, ...restOverlayProps } = overlayProps || {}
  const { className: panelClassNameProp, style: panelStyleProp, ...restPanelProps } = panelProps || {}
  const overlayClassName = [mergedClasses.overlay, overlayClassNameProp].filter(Boolean).join(' ')
  const panelClassName = [mergedClasses.panel, panelClassNameProp].filter(Boolean).join(' ')
  const overlayStyle = { ...styleFor('overlay'), ...(overlayStyleProp || {}) }
  const panelStyle = { ...styleFor('panel'), ...(panelStyleProp || {}) }
  const {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    mode,
    loadFeatured,
    search,
    loadMore,
    reset
  } = useTenorSearch({ fetcher, featuredLimit, searchLimit })
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const shouldAutoFocus = autoFocus && open

  useEffect(() => {
    if (!open) {
      setQuery('')
      reset()
      return
    }
    loadFeatured()
  }, [open, loadFeatured, reset])

  useEffect(() => {
    if (!open || !shouldAutoFocus) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 10)
    return () => window.clearTimeout(id)
  }, [open, shouldAutoFocus])

  useEffect(() => {
    if (!open) return
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    const { style } = document.body
    const prevOverflow = style.overflow
    style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      style.overflow = prevOverflow
    }
  }, [open, onClose])

  const submitSearch = useCallback(async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    if (listRef.current) {
      listRef.current.scrollTop = 0
    }
    await search(trimmed)
  }, [query, search])

  const handleLoadMore = useCallback(async () => {
    if (!open) return
    await loadMore()
  }, [loadMore, open])

  const onScroll = useCallback(() => {
    const el = listRef.current
    if (!el || loading || loadingMore || !hasMore) return
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200
    if (nearBottom) {
      handleLoadMore()
    }
  }, [loading, loadingMore, hasMore, handleLoadMore])

  useEffect(() => {
    if (!open || !hasMore || loading || loadingMore) return
    const el = listRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight + 48) {
      handleLoadMore()
    }
  }, [open, items, hasMore, loading, loadingMore, handleLoadMore])

  const skeletonItems = useMemo(() => Array.from({ length: 8 }), [])

  const renderGrid = () => {
    if (loading && items.length === 0) {
      return (
        <div className={mergedClasses.grid} style={styleFor('grid')}>
          {skeletonItems.map((_, index) => (
            <div key={index} className={mergedClasses.skeleton} style={styleFor('skeleton')} />
          ))}
        </div>
      )
    }

    if (!loading && items.length === 0) {
      return (
        <p className={mergedClasses.statusText} style={styleFor('statusText')}>
          {mode === 'search' ? mergedLabels.emptySearch : mergedLabels.emptyFeatured}
        </p>
      )
    }

    return (
      <div className={mergedClasses.grid} style={styleFor('grid')}>
        {items.map((item) => (
          <button
            key={item.id}
            type='button'
            className={mergedClasses.itemButton}
            style={styleFor('itemButton')}
            onClick={() => {
              const [variantKey, variant] = pickVariant(item.variants, maxBytes)
              if (!variant?.url) return
              onPick({
                id: item.id,
                downloadUrl: variant.url,
                previewUrl: item.previewUrl || variant.url,
                variantKey,
                variant
              })
            }}
          >
                  <img
                    src={item.previewUrl || ''}
                    alt='GIF'
                    className={mergedClasses.image}
                    loading='lazy'
                    style={styleFor('image')}
                  />
          </button>
        ))}
      </div>
    )
  }

  if (!open) return null

  return (
    <div
      {...restOverlayProps}
      className={overlayClassName}
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      role='presentation'
    >
      <div
        {...restPanelProps}
        className={panelClassName}
        style={panelStyle}
      >
        <div className={mergedClasses.header} style={styleFor('header')}>
          <div className={mergedClasses.title} style={styleFor('title')}>{mergedLabels.title}</div>
          <div className={mergedClasses.searchBar} style={styleFor('searchBar')}>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  submitSearch()
                }
              }}
              placeholder={mergedLabels.searchPlaceholder}
              className={mergedClasses.input}
              style={styleFor('input')}
            />
            <button
              type='button'
              className={mergedClasses.buttonPrimary}
              style={styleFor('buttonPrimary')}
              onClick={submitSearch}
              disabled={loading || !query.trim()}
            >
              {mergedLabels.searchButton}
            </button>
            <button
              type='button'
              className={mergedClasses.button}
              style={styleFor('button')}
              onClick={onClose}
            >
              {mergedLabels.closeButton}
            </button>
          </div>
        </div>

        <div
          ref={listRef}
          className={mergedClasses.content}
          style={styleFor('content')}
          onScroll={onScroll}
          aria-busy={loading}
        >
          {error ? (
            <p className={mergedClasses.error} style={styleFor('error')}>
              {mergedLabels.errorPrefix}: {error}
            </p>
          ) : null}
          {renderGrid()}
          {loadingMore ? (
            <p className={mergedClasses.statusText} style={styleFor('statusText')}>
              {mergedLabels.loadingMore}
            </p>
          ) : null}
          {!loading && !loadingMore && hasMore && items.length > 0 ? (
            <p className={mergedClasses.statusText} style={styleFor('statusText')}>
              {mergedLabels.loadMoreHint}
            </p>
          ) : null}
        </div>

        {!loading && !loadingMore && !hasMore && items.length > 0 ? (
          <div className={mergedClasses.footer} style={styleFor('footer')}>Keine weiteren GIFs verfügbar.</div>
        ) : null}
      </div>
    </div>
  )
}
