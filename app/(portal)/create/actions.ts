'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

export async function createContent(formData: {
  type: string
  title: string
  summary?: string
  body?: Record<string, unknown> | null
  body_html?: string
  country_id?: string
  tags?: string[]
  source_url?: string
  status?: string
  end_date?: string
  details?: Record<string, unknown>
}) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_items')
    .insert({
      type: formData.type,
      title: formData.title,
      summary: formData.summary || null,
      body: formData.body || null,
      body_html: formData.body_html || null,
      country_id: formData.country_id || null,
      tags: formData.tags ?? [],
      source_url: formData.source_url || null,
      status: formData.status || 'published',
      end_date: formData.end_date || null,
      details: formData.details ?? {},
      author_id: user.id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  await logActivity({
    actorId: user.id,
    action: 'created',
    entityType: 'content_item',
    entityId: data.id,
    meta: { title: formData.title, type: formData.type },
  })

  revalidatePath('/')
  revalidatePath('/feed')
  revalidatePath('/news')
  revalidatePath('/scholarships')
  revalidatePath('/work')

  return { id: data.id }
}

export async function updateContent(
  id: string,
  formData: {
    title: string
    summary?: string
    body?: Record<string, unknown> | null
    body_html?: string
    country_id?: string
    tags?: string[]
    source_url?: string
    status?: string
    end_date?: string
    details?: Record<string, unknown>
  }
) {
  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('content_items')
    .update({
      title: formData.title,
      summary: formData.summary || null,
      body: formData.body || null,
      body_html: formData.body_html || null,
      country_id: formData.country_id || null,
      tags: formData.tags ?? [],
      source_url: formData.source_url || null,
      status: formData.status || 'published',
      end_date: formData.end_date || null,
      details: formData.details ?? {},
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  await logActivity({
    actorId: user.id,
    action: 'updated',
    entityType: 'content_item',
    entityId: id,
    meta: { title: formData.title },
  })

  revalidatePath('/')
  revalidatePath('/feed')
  revalidatePath(`/content/${id}`)

  return { id }
}

export async function deleteContent(id: string) {
  const user = await requireUser()
  const supabase = await createClient()

  // Fetch title for activity log before deleting
  const { data: item } = await supabase
    .from('content_items')
    .select('title')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  await logActivity({
    actorId: user.id,
    action: 'deleted',
    entityType: 'content_item',
    entityId: id,
    meta: { title: item?.title ?? 'Unknown' },
  })

  revalidatePath('/')
  revalidatePath('/feed')

  return { success: true }
}

export async function addComment(contentItemId: string, body: string) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .insert({
      content_item_id: contentItemId,
      author_id: user.id,
      body,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logActivity({
    actorId: user.id,
    action: 'commented',
    entityType: 'comment',
    entityId: data.id,
    meta: { content_item_id: contentItemId },
  })

  revalidatePath(`/content/${contentItemId}`)
  return { id: data.id }
}

export async function toggleReaction(contentItemId: string, emoji: string) {
  const user = await requireUser()
  const supabase = await createClient()

  // Check if reaction exists
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('content_item_id', contentItemId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
  } else {
    await supabase.from('reactions').insert({
      content_item_id: contentItemId,
      user_id: user.id,
      emoji,
    })
  }

  revalidatePath(`/content/${contentItemId}`)
  return { toggled: !existing }
}

export async function deleteComment(commentId: string, contentItemId: string) {
  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) return { error: error.message }

  await logActivity({
    actorId: user.id,
    action: 'deleted',
    entityType: 'comment',
    entityId: commentId,
  })

  revalidatePath(`/content/${contentItemId}`)
  return { success: true }
}
