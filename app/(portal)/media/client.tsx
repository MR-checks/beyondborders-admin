'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteMediaFile, logMediaUpload } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { UploadCloud, FileIcon, Trash2, Copy, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { MediaFile } from '@/lib/types'
import { timeAgo } from '@/lib/types'

interface MediaClientProps {
  files: MediaFile[]
  currentUserId: string
  isSuperAdmin: boolean
}

export function MediaClient({ files, currentUserId, isSuperAdmin }: MediaClientProps) {
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Quick validation
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const storagePath = `uploads/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const result = await logMediaUpload(storagePath, file.name, file.type, file.size)
      if (result.error) throw new Error(result.error)

      toast.success('File uploaded successfully')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: string, path: string) {
    if (!confirm('Are you sure you want to delete this file?')) return
    const result = await deleteMediaFile(id, path)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('File deleted')
    }
  }

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from('media').getPublicUrl(path)
    return data.publicUrl
  }

  async function copyUrl(id: string, path: string) {
    const url = getPublicUrl(path)
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('URL copied to clipboard')
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    const kb = bytes / 1024
    if (kb < 1024) return kb.toFixed(1) + ' KB'
    const mb = kb / 1024
    return mb.toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload images and files to use in your content.
          </p>
        </div>
        <div>
          <Input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*,application/pdf"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {files.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">No media files uploaded yet.</p>
          </div>
        ) : (
          files.map((file) => {
            const isImage = file.mime_type?.startsWith('image/')
            const publicUrl = getPublicUrl(file.storage_path)
            const canDelete = file.uploader_id === currentUserId || isSuperAdmin

            return (
              <Card key={file.id} className="overflow-hidden group">
                <div className="aspect-video bg-muted border-b flex items-center justify-center relative overflow-hidden">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicUrl}
                      alt={file.file_name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <FileIcon className="h-10 w-10 text-muted-foreground/50" />
                  )}
                  
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => copyUrl(file.id, file.storage_path)}
                    >
                      {copiedId === file.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(file.id, file.storage_path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{file.size_bytes ? formatSize(file.size_bytes) : 'Unknown'}</span>
                    <span>{timeAgo(file.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
