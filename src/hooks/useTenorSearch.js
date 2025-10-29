import { useCallback, useMemo, useState } from 'react'

const DEFAULT_FEATURED_LIMIT = 24
const DEFAULT_SEARCH_LIMIT = 48

const extractJson = async (res, context) => {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const trimmed = text.trim()
    if (trimmed.startsWith('<')) {
      throw new Error(`${context}: Unerwartete HTML-Antwort (HTTP ${res.status}).`)
    }
    throw new Error(trimmed || `${context}: HTTP ${res.status}`)
  }
  try {
    return await res.clone().json()
  } catch {
    const text = await res.text().catch(() => '')
    const trimmed = text.trim()
    if (trimmed.startsWith('<')) {
      throw new Error(`${context}: Keine JSON-Antwort (HTML erhalten).`)
    }
    throw new Error(trimmed || `${context}: Antwort konnte nicht gelesen werden.`)
  }
}

const ensureFetch = () => {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis)
  }
  throw new Error('Fetch API ist in dieser Umgebung nicht verfügbar.')
}

const createSearchParams = (init) => {
  if (typeof globalThis.URLSearchParams === 'function') {
    return new globalThis.URLSearchParams(init)
  }
  throw new Error('URLSearchParams ist in dieser Umgebung nicht verfügbar.')
}

const defaultFetcher = async (endpoint, params) => {
  const url = `/api/tenor/${endpoint}?${params.toString()}`
  const res = await ensureFetch()(url)
  return extractJson(res, 'Tenor Proxy')
}

const parseSize = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const mapTenorResults = (results = []) =>
  results.map((item) => {
    const formats = item.media_formats || {}
    const variants = {}
    Object.entries(formats).forEach(([key, value]) => {
      if (!value) {
        variants[key] = null
        return
      }
      variants[key] = {
        url: value.url,
        size: parseSize(value.size),
        mimeType: value.mime_type ?? null
      }
    })

    const fallback = formats.gif || formats.tinygif || formats.nanogif || null
    return {
      id: item.id,
      previewUrl: formats.tinygif?.url || formats.nanogif?.url || fallback?.url || null,
      variants
    }
  })

export function useTenorSearch(options = {}) {
  const {
    fetcher = defaultFetcher,
    featuredLimit = DEFAULT_FEATURED_LIMIT,
    searchLimit = DEFAULT_SEARCH_LIMIT
  } = options

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [mode, setMode] = useState('featured')
  const [currentQuery, setCurrentQuery] = useState('')
  const [nextPos, setNextPos] = useState(null)

  const fetchTenor = useCallback(
    async (endpoint, params) => {
      try {
        const data = await fetcher(endpoint, params)
        if (!data || typeof data !== 'object') {
          throw new Error('Tenor: Leere Antwort erhalten.')
        }
        return data
      } catch (err) {
        const message =
          err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unbekannter Fehler'
        throw new Error(message)
      }
    },
    [fetcher]
  )

  const loadFeatured = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = createSearchParams({ limit: String(featuredLimit) })
      const data = await fetchTenor('featured', params)
      const mapped = mapTenorResults(data?.results ?? [])
      setItems(mapped)
      setMode('featured')
      setCurrentQuery('')
      setNextPos(typeof data?.next === 'string' && data.next ? data.next : null)
      setHasMore(Boolean(data?.next))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setItems([])
      setHasMore(false)
      setNextPos(null)
    } finally {
      setLoading(false)
    }
  }, [fetchTenor, featuredLimit])

  const search = useCallback(
    async (query) => {
      const trimmed = query.trim()
      if (!trimmed) return
      setLoading(true)
      setError(null)
      try {
        const params = createSearchParams({ limit: String(searchLimit), q: trimmed })
        const data = await fetchTenor('search', params)
        const mapped = mapTenorResults(data?.results ?? [])
        setItems(mapped)
        setMode('search')
        setCurrentQuery(trimmed)
        setNextPos(typeof data?.next === 'string' && data.next ? data.next : null)
        setHasMore(Boolean(data?.next))
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
        setItems([])
        setHasMore(false)
        setNextPos(null)
        setMode('search')
        setCurrentQuery(trimmed)
      } finally {
        setLoading(false)
      }
    },
    [fetchTenor, searchLimit]
  )

  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return
    if (!hasMore || !nextPos) return

    setLoadingMore(true)
    setError(null)
    try {
      const params = createSearchParams({
        limit: String(mode === 'featured' ? featuredLimit : searchLimit),
        pos: nextPos
      })
      if (mode === 'search' && currentQuery) {
        params.set('q', currentQuery)
      }
      const data = await fetchTenor(mode, params)
      const mapped = mapTenorResults(data?.results ?? [])
      setItems((prev) => prev.concat(mapped))
      setNextPos(typeof data?.next === 'string' && data.next ? data.next : null)
      setHasMore(Boolean(data?.next))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [
    currentQuery,
    featuredLimit,
    fetchTenor,
    hasMore,
    loading,
    loadingMore,
    mode,
    nextPos,
    searchLimit
  ])

  const reset = useCallback(() => {
    setItems([])
    setLoading(false)
    setLoadingMore(false)
    setError(null)
    setHasMore(false)
    setMode('featured')
    setCurrentQuery('')
    setNextPos(null)
  }, [])

  return useMemo(
    () => ({
      items,
      loading,
      loadingMore,
      error,
      hasMore,
      mode,
      currentQuery,
      loadFeatured,
      search,
      loadMore,
      reset
    }),
    [
      items,
      loading,
      loadingMore,
      error,
      hasMore,
      mode,
      currentQuery,
      loadFeatured,
      search,
      loadMore,
      reset
    ]
  )
}
