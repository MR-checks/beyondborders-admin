'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContentCard } from './content-card'
import type { ContentItem, Country, Profile } from '@/lib/types'
import { CONTENT_TYPES, type ContentTypeKey } from '@/lib/constants'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface ContentListProps {
  items: ContentItem[]
  countries: Country[]
  authors: Profile[]
  totalCount: number
  page: number
  pageSize: number
  showTypeFilter?: boolean
}

export function ContentList({
  items,
  countries,
  authors,
  totalCount,
  page,
  pageSize,
  showTypeFilter = true,
}: ContentListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(totalCount / pageSize)

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // reset page on filter change
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title, summary…"
            defaultValue={searchParams.get('q') ?? ''}
            onChange={(e) => {
              // debounce would be nice but keep it simple for V1
              if (!e.target.value) updateParam('q', '')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParam('q', (e.target as HTMLInputElement).value)
              }
            }}
            className="pl-9 h-9"
          />
        </div>

        {showTypeFilter && (
          <Select
            defaultValue={searchParams.get('type') ?? 'all'}
            onValueChange={(v) => v && updateParam('type', v)}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(CONTENT_TYPES).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          defaultValue={searchParams.get('country') ?? 'all'}
          onValueChange={(v) => v && updateParam('country', v)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.flag_emoji} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get('status') ?? 'all'}
          onValueChange={(v) => v && updateParam('status', v)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closing_soon">Closing Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get('author') ?? 'all'}
          onValueChange={(v) => v && updateParam('author', v)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="All authors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All authors</SelectItem>
            {authors.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No content items found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your filters or create a new item
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
