import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { fetchContentById } from '@/lib/content'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Comments } from '@/components/content/comments'
import { Reactions } from '@/components/content/reactions'
import { CONTENT_TYPES, STATUS_COLORS, type ContentTypeKey } from '@/lib/constants'
import { computeStatus, timeAgo, type Comment, type Reaction } from '@/lib/types'
import { Calendar, ExternalLink, Globe, Pencil, Trash2, User } from 'lucide-react'
import { DeleteButton } from './delete-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ContentDetailPage({ params }: PageProps) {
  const user = await requireUser()
  const { id } = await params

  const item = await fetchContentById(id)
  if (!item) notFound()

  const supabase = await createClient()

  // Fetch comments and reactions
  const [{ data: comments }, { data: reactions }] = await Promise.all([
    supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(id, display_name, avatar_url)')
      .eq('content_item_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('reactions')
      .select('*')
      .eq('content_item_id', id),
  ])

  const status = computeStatus(item)
  const statusConfig = STATUS_COLORS[status]
  const typeConfig = CONTENT_TYPES[item.type as ContentTypeKey]
  const canEdit = item.author_id === user.id || user.role === 'super_admin'
  const details = (item.details ?? {}) as Record<string, unknown>

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {typeConfig && (
            <Badge variant="secondary">{typeConfig.label}</Badge>
          )}
          <Badge variant="outline" className={`border ${statusConfig.className}`}>
            {statusConfig.label}
          </Badge>
          {item.country && (
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              {item.country.flag_emoji} {item.country.name}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {item.author?.display_name}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {timeAgo(item.created_at)}
          </span>
          {item.end_date && (
            <span>Deadline: {new Date(item.end_date).toLocaleDateString()}</span>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Button render={<Link href={`/create?edit=${item.id}`} />} nativeButton={false} variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DeleteButton id={id} />
          </div>
        )}
      </div>

      {/* Summary */}
      {item.summary && (
        <p className="text-muted-foreground leading-relaxed">{item.summary}</p>
      )}

      {/* Source URL */}
      {item.source_url && (
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          View source
        </a>
      )}

      {/* Type-specific details */}
      {Object.keys(details).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-sm">
                    {typeof value === 'boolean'
                      ? value ? '✅ Yes' : '❌ No'
                      : Array.isArray(value)
                      ? value.join(', ')
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Body */}
      {item.body_html && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-card p-6"
          dangerouslySetInnerHTML={{ __html: item.body_html }}
        />
      )}

      <Separator />

      {/* Reactions */}
      <Reactions
        contentItemId={id}
        initialReactions={(reactions ?? []) as Reaction[]}
        currentUserId={user.id}
      />

      <Separator />

      {/* Comments */}
      <Comments
        contentItemId={id}
        initialComments={(comments ?? []) as unknown as Comment[]}
        currentUserId={user.id}
        isSuperAdmin={user.role === 'super_admin'}
      />
    </div>
  )
}
