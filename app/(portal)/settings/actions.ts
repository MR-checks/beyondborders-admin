'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function updateProfile(displayName: string, avatarUrl: string | null) {
  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      avatar_url: avatarUrl,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  await logActivity({
    actorId: user.id,
    action: 'updated',
    entityType: 'profile',
    entityId: user.id,
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function updatePassword(password: string) {
  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  await logActivity({
    actorId: user.id,
    action: 'updated_password',
    entityType: 'profile',
    entityId: user.id,
  })

  return { success: true }
}
