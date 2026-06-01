'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { contentTypeConfigs, type FieldConfig } from '@/lib/content-types'
import type { Country, ContentItem } from '@/lib/types'
import { createContent, updateContent } from '@/app/(portal)/create/actions'
import { Loader2, X } from 'lucide-react'

interface ContentFormProps {
  type: string
  countries: Country[]
  editItem?: ContentItem | null
}

export function ContentForm({ type, countries, editItem }: ContentFormProps) {
  const router = useRouter()
  const config = contentTypeConfigs[type]
  const isEdit = !!editItem

  const [title, setTitle] = useState(editItem?.title ?? '')
  const [summary, setSummary] = useState(editItem?.summary ?? '')
  const [countryId, setCountryId] = useState(editItem?.country_id ?? '')
  const [sourceUrl, setSourceUrl] = useState(editItem?.source_url ?? '')
  const [status, setStatus] = useState(editItem?.status ?? 'published')
  const [tags, setTags] = useState<string[]>(editItem?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [body, setBody] = useState<Record<string, unknown> | null>(editItem?.body ?? null)
  const [bodyHtml, setBodyHtml] = useState(editItem?.body_html ?? '')
  const [details, setDetails] = useState<Record<string, unknown>>(
    (editItem?.details as Record<string, unknown>) ?? {}
  )
  const [endDate, setEndDate] = useState(
    editItem?.end_date ? new Date(editItem.end_date).toISOString().slice(0, 16) : ''
  )
  const [loading, setLoading] = useState(false)

  const handleEditorChange = useCallback((json: Record<string, unknown>, html: string) => {
    setBody(json)
    setBodyHtml(html)
  }, [])

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function setDetailField(name: string, value: unknown) {
    setDetails((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setLoading(true)

    // Separate top-level fields from details
    const finalDetails = { ...details }
    let finalEndDate = endDate || undefined

    // Extract top-level fields from type-specific config
    if (config) {
      for (const field of config.fields) {
        if (field.topLevel && field.topLevelColumn === 'end_date' && details[field.name]) {
          finalEndDate = details[field.name] as string
          delete finalDetails[field.name]
        }
      }
    }

    const formData = {
      type,
      title: title.trim(),
      summary: summary.trim() || undefined,
      body,
      body_html: bodyHtml || undefined,
      country_id: countryId || undefined,
      tags,
      source_url: sourceUrl.trim() || undefined,
      status,
      end_date: finalEndDate,
      details: finalDetails,
    }

    try {
      const result = isEdit
        ? await updateContent(editItem!.id, formData)
        : await createContent(formData)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? 'Content updated' : 'Content created')
        router.push(`/content/${result.id}`)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function renderField(field: FieldConfig) {
    const value = field.topLevel
      ? (field.topLevelColumn === 'end_date' ? endDate : details[field.name])
      : details[field.name]

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              placeholder={field.placeholder}
              value={(value as string) ?? ''}
              onChange={(e) =>
                field.topLevel
                  ? undefined // handled by top-level state
                  : setDetailField(field.name, e.target.value)
              }
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            <Select
              value={(value as string) ?? ''}
              onValueChange={(v) => v && setDetailField(field.name, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'multiselect':
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((opt) => {
                const selected = Array.isArray(value) && (value as string[]).includes(opt.value)
                return (
                  <Badge
                    key={opt.value}
                    variant={selected ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = (Array.isArray(value) ? value : []) as string[]
                      const next = selected
                        ? current.filter((v) => v !== opt.value)
                        : [...current, opt.value]
                      setDetailField(field.name, next)
                    }}
                  >
                    {opt.label}
                  </Badge>
                )
              })}
            </div>
          </div>
        )

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor={field.name} className="cursor-pointer">{field.label}</Label>
            <Switch
              id={field.name}
              checked={(value as boolean) ?? false}
              onCheckedChange={(checked) => setDetailField(field.name, checked)}
            />
          </div>
        )

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="datetime-local"
              value={
                field.topLevel
                  ? endDate
                  : (value as string) ?? ''
              }
              onChange={(e) => {
                if (field.topLevel) {
                  setEndDate(e.target.value)
                } else {
                  setDetailField(field.name, e.target.value)
                }
              }}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Enter a descriptive title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="text-lg"
        />
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          placeholder="Brief summary (shown in cards and previews)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
        />
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label>Country</Label>
        <Select value={countryId} onValueChange={(v) => v && setCountryId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.flag_emoji} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type-specific fields */}
      {config && config.fields.length > 0 && (
        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-sm font-medium text-muted-foreground">
            {config.label} Details
          </p>
          {config.fields.map(renderField)}
        </div>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Source URL */}
      <div className="space-y-2">
        <Label htmlFor="source_url">Source URL</Label>
        <Input
          id="source_url"
          type="url"
          placeholder="https://example.com/original-article"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
      </div>

      {/* Rich text body */}
      <div className="space-y-2">
        <Label>Body</Label>
        <TiptapEditor
          content={body}
          onChange={handleEditorChange}
          placeholder="Write your content here…"
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label>Status</Label>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Select value={status} onValueChange={(v) => v && setStatus(v as any)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? 'Saving…' : 'Publishing…'}
            </>
          ) : (
            isEdit ? 'Save Changes' : 'Publish'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
