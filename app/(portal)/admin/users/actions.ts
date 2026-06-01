'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/activity'

export async function inviteUser(email: string, role: 'admin' | 'editor' | 'super_admin') {
  const user = await requireSuperAdmin()

  // Use the admin service role to invite a user
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { display_name: email.split('@')[0] },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?next=/settings`,
  })

  console.log('INVITE RESULT:', { data, error })

  if (error) return { error: error.message }

  // (the trigger usually creates it, but we upsert here to catch edge cases like re-inviting soft-deleted users)
  if (data.user) {
    await adminClient.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      display_name: data.user.user_metadata?.display_name || email.split('@')[0],
      role: role
    }, { onConflict: 'id' })
  }

  await logActivity({
    actorId: user.id,
    action: 'invited',
    entityType: 'user',
    meta: { email, role },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateUserRole(userId: string, newRole: string) {
  const user = await requireSuperAdmin()

  if (userId === user.id) {
    return { error: 'You cannot change your own role' }
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: error.message }

  await logActivity({
    actorId: user.id,
    action: 'updated_role',
    entityType: 'user',
    entityId: userId,
    meta: { newRole },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const user = await requireSuperAdmin()

  if (userId === user.id) {
    return { error: 'You cannot delete yourself' }
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  await logActivity({
    actorId: user.id,
    action: 'deleted',
    entityType: 'user',
    entityId: userId,
  })

  revalidatePath('/admin/users')
  return { success: true }
}
