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
  overlay: 'fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm',
  panel: 'relative w-[min(920px,92vw)] max-h-[88vh] overflow-hidden rounded-2xl border border-border bg-background shadow-lg flex flex-col',
  header: 'flex items-center gap-3 border-b border-border bg-background-subtle px-4 py-3',
  title: 'flex-1 text-base font-semibold text-foreground',
  searchBar: 'flex flex-1 items-center gap-2',
  input:
    'flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40',
  button:
    'rounded-xl border border-border bg-background-subtle px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background',
  buttonPrimary:
    'rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed',
  content: 'flex-1 overflow-y-auto px-4 py-4 space-y-3',
  grid: 'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4',
  itemButton:
    'overflow-hidden rounded-xl border border-border bg-background-subtle transition hover:ring-2 hover:ring-primary/40',
  image: 'h-32 w-full object-cover',
  statusText: 'text-sm text-foreground-muted',
  footer: 'border-t border-border bg-background-subtle px-4 py-3 text-right text-xs text-foreground-muted',
  skeleton: 'h-32 w-full animate-pulse rounded-xl border border-border bg-background-subtle',
  error: 'text-sm text-destructive'
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
  autoFocus = true
}) {
  const mergedLabels = { ...defaultLabels, ...(labels ?? {}) }
  const mergedClasses = { ...defaultClasses, ...(classNames ?? {}) }
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
        <div className={mergedClasses.grid}>
          {skeletonItems.map((_, index) => (
            <div key={index} className={mergedClasses.skeleton} />
          ))}
        </div>
      )
    }

    if (!loading && items.length === 0) {
      return (
        <p className={mergedClasses.statusText}>
          {mode === 'search' ? mergedLabels.emptySearch : mergedLabels.emptyFeatured}
        </p>
      )
    }

    return (
      <div className={mergedClasses.grid}>
        {items.map((item) => (
          <button
            key={item.id}
            type='button'
            className={mergedClasses.itemButton}
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
            />
          </button>
        ))}
      </div>
    )
  }

  if (!open) return null

  return (
    <div
      {...overlayProps}
      className={[mergedClasses.overlay, overlayProps?.className].filter(Boolean).join(' ')}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      role='presentation'
    >
      <div
        {...panelProps}
        className={[mergedClasses.panel, panelProps?.className].filter(Boolean).join(' ')}
      >
        <div className={mergedClasses.header}>
          <div className={mergedClasses.title}>{mergedLabels.title}</div>
          <div className={mergedClasses.searchBar}>
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
            />
            <button
              type='button'
              className={mergedClasses.buttonPrimary}
              onClick={submitSearch}
              disabled={loading || !query.trim()}
            >
              {mergedLabels.searchButton}
            </button>
            <button type='button' className={mergedClasses.button} onClick={onClose}>
              {mergedLabels.closeButton}
            </button>
          </div>
        </div>

        <div
          ref={listRef}
          className={mergedClasses.content}
          onScroll={onScroll}
          aria-busy={loading}
        >
          {error ? (
            <p className={mergedClasses.error}>
              {mergedLabels.errorPrefix}: {error}
            </p>
          ) : null}
          {renderGrid()}
          {loadingMore ? <p className={mergedClasses.statusText}>{mergedLabels.loadingMore}</p> : null}
          {!loading && !loadingMore && hasMore && items.length > 0 ? (
            <p className={mergedClasses.statusText}>{mergedLabels.loadMoreHint}</p>
          ) : null}
        </div>

        {!loading && !loadingMore && !hasMore && items.length > 0 ? (
          <div className={mergedClasses.footer}>Keine weiteren GIFs verfügbar.</div>
        ) : null}
      </div>
    </div>
  )
}
