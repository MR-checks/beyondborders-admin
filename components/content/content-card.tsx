import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CONTENT_TYPES, STATUS_COLORS, type ContentTypeKey } from '@/lib/constants'
import { computeStatus, timeAgo, type ContentItem } from '@/lib/types'
import { Calendar, ExternalLink, MapPin, User } from 'lucide-react'

interface ContentCardProps {
  item: ContentItem
}

export function ContentCard({ item }: ContentCardProps) {
  const status = computeStatus(item)
  const statusConfig = STATUS_COLORS[status]
  const typeConfig = CONTENT_TYPES[item.type as ContentTypeKey]

  return (
    <Link href={`/content/${item.id}`}>
      <Card className="group transition-all hover:shadow-md hover:border-border/80 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap">
                {typeConfig && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {typeConfig.label}
                  </Badge>
                )}
                <Badge variant="outline" className={`text-xs border ${statusConfig.className}`}>
                  {statusConfig.label}
                </Badge>
                {item.country?.flag_emoji && (
                  <span className="text-sm" title={item.country.name}>
                    {item.country.flag_emoji} {item.country.name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </h3>

              {/* Summary */}
              {item.summary && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.summary}
                </p>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {item.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.author.display_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {timeAgo(item.created_at)}
                </span>
                {item.end_date && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Deadline: {new Date(item.end_date).toLocaleDateString()}
                  </span>
                )}
                {item.source_url && (
                  <ExternalLink className="h-3 w-3" />
                )}
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {item.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">+{item.tags.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
