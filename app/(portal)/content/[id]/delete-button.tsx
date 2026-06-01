'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { deleteContent } from '@/app/(portal)/create/actions'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this content?')) return

    const result = await deleteContent(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Content deleted')
      router.push('/feed')
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
      Delete
    </Button>
  )
}
