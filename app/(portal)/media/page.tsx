import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { MediaClient } from './client'
import type { MediaFile } from '@/lib/types'

export default async function MediaPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: files } = await supabase
    .from('media_files')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <MediaClient
      files={(files ?? []) as MediaFile[]}
      currentUserId={user.id}
      isSuperAdmin={user.role === 'super_admin'}
    />
  )
}
