import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'super_admin' | 'admin' | 'editor'

export interface AppUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  role: UserRole
}

/**
 * Get the currently authenticated user with their profile.
 * Uses getUser() (not getSession()) — verified with the Supabase auth server.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? '',
    display_name: profile.display_name ?? user.email ?? '',
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole,
  }
}

/**
 * Require an authenticated user. Redirects to /login if not authenticated.
 */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Require at least admin role. Redirects to /login if not authenticated.
 * Throws 403-like redirect if insufficient role.
 */
export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser()
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    redirect('/')
  }
  return user
}

/**
 * Require super_admin role. Redirects to /login if not authenticated.
 * Redirects to / if not super_admin.
 */
export async function requireSuperAdmin(): Promise<AppUser> {
  const user = await requireUser()
  if (user.role !== 'super_admin') {
    redirect('/')
  }
  return user
}
