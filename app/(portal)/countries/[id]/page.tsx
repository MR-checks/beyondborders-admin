import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { fetchContentItems, fetchProfiles } from '@/lib/content'
import { ContentList } from '@/components/content/content-list'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function CountryDetailPage({ params, searchParams }: PageProps) {
  await requireUser()
  const { id } = await params
  const sParams = await searchParams
  const page = parseInt(sParams.page ?? '1', 10)

  const supabase = await createClient()

  // Fetch country details
  const { data: country } = await supabase
    .from('countries')
    .select('*')
    .eq('id', id)
    .single()

  if (!country) notFound()

  // Fetch content for this country
  const { items, totalCount } = await fetchContentItems({
    countryId: id,
    type: sParams.type,
    status: sParams.status,
    authorId: sParams.author,
    search: sParams.q,
    page,
  })

  // We only pass authors to the filter since country is fixed
  const authors = await fetchProfiles()

  return (
    <div className="space-y-8">
      {/* Country Header */}
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="text-6xl">{country.flag_emoji}</div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{country.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{country.region}</Badge>
            {country.iso_code && <Badge variant="outline">{country.iso_code}</Badge>}
          </div>
        </div>
      </div>

      {/* Structured data placeholder for future AI cols */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Cost Level</p>
          <p className="text-sm">{country.cost_level ? `${country.cost_level}/5` : 'Not specified'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Visa Difficulty</p>
          <p className="text-sm">{country.visa_difficulty ? `${country.visa_difficulty}/5` : 'Not specified'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Primary Language</p>
          <p className="text-sm">{country.primary_language || 'Not specified'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Work Rights</p>
          <p className="text-sm">{country.work_rights_note || 'Not specified'}</p>
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold">Related Content</h2>
        <ContentList
          items={items}
          countries={[country]} // fixed in filter
          authors={authors}
          totalCount={totalCount}
          page={page}
          pageSize={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  )
}
