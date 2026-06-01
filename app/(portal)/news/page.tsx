import { requireUser } from '@/lib/auth'
import { fetchContentItems, fetchCountries, fetchProfiles } from '@/lib/content'
import { ContentList } from '@/components/content/content-list'
import { ITEMS_PER_PAGE } from '@/lib/constants'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function NewsPage({ searchParams }: PageProps) {
  await requireUser()
  const params = await searchParams
  const page = parseInt(params.page ?? '1', 10)

  const { items, totalCount } = await fetchContentItems({
    type: 'visa_news',
    countryId: params.country,
    status: params.status,
    authorId: params.author,
    search: params.q,
    page,
  })

  const [countries, authors] = await Promise.all([
    fetchCountries(),
    fetchProfiles(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visa News</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Immigration policy updates and regulatory changes
        </p>
      </div>
      <ContentList
        items={items}
        countries={countries}
        authors={authors}
        totalCount={totalCount}
        page={page}
        pageSize={ITEMS_PER_PAGE}
        showTypeFilter={false}
      />
    </div>
  )
}
