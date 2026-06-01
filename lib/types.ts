import type { ComputedStatus } from './constants'

export interface ContentItem {
  id: string
  type: string
  title: string
  slug: string | null
  body: Record<string, unknown> | null
  body_html: string | null
  summary: string | null
  country_id: string | null
  visa_type: string | null
  tags: string[]
  source_url: string | null
  details: Record<string, unknown>
  status: string
  start_date: string | null
  end_date: string | null
  publish_at: string | null
  author_id: string
  created_at: string
  updated_at: string
  // Joined fields
  author?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  country?: {
    id: string
    name: string
    flag_emoji: string | null
  } | null
  _comment_count?: number
  _reaction_counts?: Record<string, number>
}

export interface Country {
  id: string
  name: string
  iso_code: string | null
  flag_emoji: string | null
  region: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  role: string
  created_at: string
}

export interface Comment {
  id: string
  content_item_id: string
  author_id: string
  body: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export interface Reaction {
  id: string
  content_item_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface ActivityLog {
  id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  meta: Record<string, unknown>
  created_at: string
  actor?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export interface MediaFile {
  id: string
  content_item_id: string | null
  uploader_id: string
  storage_path: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
  uploader?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

/**
 * Compute display status from data at read time.
 * No scheduled job — Section 11 compliance.
 */
export function computeStatus(item: { status: string; end_date: string | null }): ComputedStatus {
  if (item.status === 'draft') return 'draft'

  if (item.end_date) {
    const endDate = new Date(item.end_date)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    if (endDate < now) return 'expired'
    if (endDate < sevenDaysFromNow) return 'closing_soon'
  }

  return 'active'
}

/**
 * Format relative time.
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
