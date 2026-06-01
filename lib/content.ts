import { createClient } from '@/lib/supabase/server'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import { computeStatus, type ContentItem } from '@/lib/types'

interface FetchContentParams {
  type?: string
  countryId?: string
  status?: string // computed status filter
  authorId?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function fetchContentItems(params: FetchContentParams = {}) {
  const supabase = await createClient()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? ITEMS_PER_PAGE
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('content_items')
    .select(
      `*, author:profiles!content_items_author_id_fkey(id, display_name, avatar_url), country:countries(id, name, flag_emoji)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (params.type) {
    query = query.eq('type', params.type)
  }

  if (params.countryId) {
    query = query.eq('country_id', params.countryId)
  }

  if (params.authorId) {
    query = query.eq('author_id', params.authorId)
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,summary.ilike.%${params.search}%`)
  }

  // Status filter based on computed status — filter in DB where possible
  if (params.status === 'draft') {
    query = query.eq('status', 'draft')
  } else if (params.status === 'expired') {
    query = query.neq('status', 'draft').lt('end_date', new Date().toISOString())
  } else if (params.status === 'closing_soon') {
    const now = new Date()
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    query = query
      .neq('status', 'draft')
      .gte('end_date', now.toISOString())
      .lte('end_date', sevenDays.toISOString())
  } else if (params.status === 'active') {
    // Active = not draft and (no end_date or end_date > 7 days from now)
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    query = query
      .neq('status', 'draft')
      .or(`end_date.is.null,end_date.gt.${sevenDays.toISOString()}`)
  }

  query = query.range(offset, offset + pageSize - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('fetchContentItems error:', error)
    return { items: [], totalCount: 0 }
  }

  return {
    items: (data ?? []) as unknown as ContentItem[],
    totalCount: count ?? 0,
  }
}

export async function fetchContentById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_items')
    .select(
      `*, author:profiles!content_items_author_id_fkey(id, display_name, avatar_url, email), country:countries(id, name, flag_emoji, iso_code, region)`
    )
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as ContentItem
}

export async function fetchCountries() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('countries')
    .select('id, name, iso_code, flag_emoji, region, created_at')
    .order('name')

  return data ?? []
}

export async function fetchProfiles() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, role, created_at')
    .order('display_name')

  return data ?? []
}

export { computeStatus }
