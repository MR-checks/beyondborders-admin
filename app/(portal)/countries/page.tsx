import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { fetchCountries } from '@/lib/content'
import { Card, CardContent } from '@/components/ui/card'
import { Globe, MapPin } from 'lucide-react'

export default async function CountriesPage() {
  await requireUser()
  const countries = await fetchCountries()

  // Group by region
  const regions = countries.reduce((acc, country) => {
    const region = country.region || 'Other'
    if (!acc[region]) acc[region] = []
    acc[region].push(country)
    return acc
  }, {} as Record<string, typeof countries>)

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Countries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore structured intelligence organized by destination country.
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(regions).sort().map(([region, regionCountries]) => (
          <div key={region} className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              {region}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {regionCountries.map((country) => (
                <Link key={country.id} href={`/countries/${country.id}`}>
                  <Card className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32 gap-3 group">
                      <span className="text-4xl group-hover:scale-110 transition-transform">
                        {country.flag_emoji || <Globe className="h-8 w-8" />}
                      </span>
                      <span className="font-medium">{country.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
