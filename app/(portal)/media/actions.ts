'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export async function deleteMediaFile(id: string, storagePath: string) {
  const user = await requireUser()
  const supabase = await createClient()

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('media')
    .remove([storagePath])

  if (storageError) {
    console.error('Storage deletion error:', storageError)
    // We continue to delete the DB record even if storage fails 
    // to prevent orphaned DB records if the file was already deleted manually
  }

  // Delete from DB
  const { error: dbError } = await supabase
    .from('media_files')
    .delete()
    .eq('id', id)

  if (dbError) return { error: dbError.message }

  await logActivity({
    actorId: user.id,
    action: 'deleted',
    entityType: 'media',
    entityId: id,
  })

  revalidatePath('/media')
  return { success: true }
}

export async function logMediaUpload(
  storagePath: string,
  fileName: string,
  mimeType: string,
  sizeBytes: number
) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('media_files')
    .insert({
      uploader_id: user.id,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logActivity({
    actorId: user.id,
    action: 'uploaded',
    entityType: 'media',
    entityId: data.id,
    meta: { file_name: fileName },
  })

  revalidatePath('/media')
  return { id: data.id }
}
