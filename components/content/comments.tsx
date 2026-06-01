'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { addComment, deleteComment } from '@/app/(portal)/create/actions'
import type { Comment } from '@/lib/types'
import { timeAgo } from '@/lib/types'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface CommentsProps {
  contentItemId: string
  initialComments: Comment[]
  currentUserId: string
  isSuperAdmin: boolean
}

export function Comments({ contentItemId, initialComments, currentUserId, isSuperAdmin }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`comments:${contentItemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `content_item_id=eq.${contentItemId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch full comment with author
            const { data } = await supabase
              .from('comments')
              .select('*, author:profiles!comments_author_id_fkey(id, display_name, avatar_url)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setComments((prev) => {
                if (prev.some((c) => c.id === data.id)) return prev
                return [...prev, data as unknown as Comment]
              })
            }
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contentItemId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return

    setLoading(true)
    const result = await addComment(contentItemId, body.trim())
    if ('error' in result) {
      toast.error(result.error)
    } else {
      setBody('')
    }
    setLoading(false)
  }

  async function handleDelete(commentId: string) {
    const result = await deleteComment(commentId, contentItemId)
    if (result.error) toast.error(result.error)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Comments ({comments.length})</h3>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments.map((comment) => {
          const initials = (comment.author?.display_name ?? '?')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          const canDelete = comment.author_id === currentUserId || isSuperAdmin

          return (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.author?.display_name ?? 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(comment.created_at)}
                  </span>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.body}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Write a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          className="resize-none"
        />
        <Button type="submit" size="sm" disabled={loading || !body.trim()} className="self-end">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
        </Button>
      </form>
    </div>
  )
}
