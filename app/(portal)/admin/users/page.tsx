import { requireSuperAdmin } from '@/lib/auth'
import { fetchProfiles } from '@/lib/content'
import { AdminUsersClient } from './client'
import type { Profile } from '@/lib/types'

export default async function AdminUsersPage() {
  const user = await requireSuperAdmin()
  const users = await fetchProfiles()

  return <AdminUsersClient users={users as Profile[]} currentUserId={user.id} />
}
