import type { CSSProperties, HTMLAttributes, RefObject } from 'react'

export interface GifVariant {
  url?: string
  size?: number | null
  mimeType?: string | null
}

export interface GifPickResult {
  id: string
  downloadUrl: string
  previewUrl: string
  variantKey: string
  variant: GifVariant | null
}

export interface GifPickerLabels {
  title?: string
  searchPlaceholder?: string
  searchButton?: string
  closeButton?: string
  emptyFeatured?: string
  emptySearch?: string
  loadingMore?: string
  loadMoreHint?: string
  errorPrefix?: string
}

export interface GifPickerClassNames {
  overlay?: string
  panel?: string
  header?: string
  title?: string
  searchBar?: string
  input?: string
  button?: string
  buttonPrimary?: string
  content?: string
  grid?: string
  itemButton?: string
  image?: string
  statusText?: string
  footer?: string
  skeleton?: string
  error?: string
}

export interface GifPickerStyles {
  overlay?: CSSProperties
  panel?: CSSProperties
  header?: CSSProperties
  title?: CSSProperties
  searchBar?: CSSProperties
  input?: CSSProperties
  button?: CSSProperties
  buttonPrimary?: CSSProperties
  content?: CSSProperties
  grid?: CSSProperties
  itemButton?: CSSProperties
  image?: CSSProperties
  statusText?: CSSProperties
  footer?: CSSProperties
  skeleton?: CSSProperties
  error?: CSSProperties
}

export type TenorFetcher = (endpoint: 'featured' | 'search', params: URLSearchParams) => Promise<any>

export interface GifPickerProps {
  open: boolean
  onClose: () => void
  onPick: (gif: GifPickResult) => void
  maxBytes?: number
  fetcher?: TenorFetcher
  featuredLimit?: number
  searchLimit?: number
  labels?: GifPickerLabels
  classNames?: GifPickerClassNames
  overlayProps?: HTMLAttributes<HTMLDivElement>
  panelProps?: HTMLAttributes<HTMLDivElement>
  styles?: Partial<GifPickerStyles>
  autoFocus?: boolean
}

export declare function GifPicker(props: GifPickerProps): JSX.Element | null

export interface EmojiSelectEvent {
  native?: string
  shortcodes?: string
  id?: string
  unicode?: string
}

export interface EmojiPickerClassNames {
  overlay?: string
  panel?: string
}

export interface EmojiPickerProps {
  open: boolean
  onClose: () => void
  onPick: (emoji: EmojiSelectEvent) => void
  anchorRef: RefObject<HTMLElement>
  locale?: string
  theme?: 'auto' | 'light' | 'dark'
  maxWidth?: number
  maxHeight?: number
  verticalAlign?: 'bottom' | 'center'
  classNames?: EmojiPickerClassNames
  overlayProps?: HTMLAttributes<HTMLDivElement>
  panelProps?: HTMLAttributes<HTMLDivElement>
  style?: CSSProperties
  styles?: {
    overlay?: CSSProperties
    panel?: CSSProperties
  }
}

export declare function EmojiPicker(props: EmojiPickerProps): JSX.Element | null

export interface UseTenorSearchOptions {
  fetcher?: TenorFetcher
  featuredLimit?: number
  searchLimit?: number
}

export interface TenorSearchControls {
  items: Array<{
    id: string
    previewUrl?: string | null
    variants: Record<string, GifVariant | null>
  }>
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  mode: 'featured' | 'search'
  currentQuery: string
  loadFeatured: () => Promise<void>
  search: (query: string) => Promise<void>
  loadMore: () => Promise<void>
  reset: () => void
}

export declare function useTenorSearch(options?: UseTenorSearchOptions): TenorSearchControls

export interface UseEmojiPopoverOptions {
  anchorRef: RefObject<HTMLElement>
  open: boolean
  margin?: number
  maxWidth?: number
  maxHeight?: number
  verticalAlign?: 'bottom' | 'center'
}

export interface EmojiPopoverControls {
  position: { top: number; left: number }
  setPopoverRef: (node: HTMLDivElement | null) => void
  updatePosition: () => void
}

export declare function useEmojiPopover(options: UseEmojiPopoverOptions): EmojiPopoverControls
