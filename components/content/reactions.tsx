'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toggleReaction } from '@/app/(portal)/create/actions'
import { REACTION_EMOJIS } from '@/lib/constants'
import type { Reaction } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ReactionsProps {
  contentItemId: string
  initialReactions: Reaction[]
  currentUserId: string
}

export function Reactions({ contentItemId, initialReactions, currentUserId }: ReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions)

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`reactions:${contentItemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `content_item_id=eq.${contentItemId}`,
        },
        async () => {
          // Re-fetch all reactions for this item
          const { data } = await supabase
            .from('reactions')
            .select('*')
            .eq('content_item_id', contentItemId)
          if (data) setReactions(data as Reaction[])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contentItemId])

  async function handleToggle(emoji: string) {
    // Optimistic update
    const existing = reactions.find((r) => r.user_id === currentUserId && r.emoji === emoji)
    if (existing) {
      setReactions((prev) => prev.filter((r) => r.id !== existing.id))
    } else {
      setReactions((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content_item_id: contentItemId,
          user_id: currentUserId,
          emoji,
          created_at: new Date().toISOString(),
        },
      ])
    }

    await toggleReaction(contentItemId, emoji)
  }

  // Count reactions by emoji
  const counts: Record<string, { count: number; userReacted: boolean }> = {}
  for (const emoji of REACTION_EMOJIS) {
    const emojiReactions = reactions.filter((r) => r.emoji === emoji)
    counts[emoji] = {
      count: emojiReactions.length,
      userReacted: emojiReactions.some((r) => r.user_id === currentUserId),
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const { count, userReacted } = counts[emoji]
        return (
          <Button
            key={emoji}
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-1.5 px-2.5 text-sm',
              userReacted && 'bg-primary/10 border-primary/30'
            )}
            onClick={() => handleToggle(emoji)}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                {count}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
