import { requireUser } from '@/lib/auth'
import { fetchCountries } from '@/lib/content'
import { CreateFlow } from '@/components/content/create-flow'

export default async function CreatePage() {
  await requireUser()
  const countries = await fetchCountries()

  return <CreateFlow countries={countries} />
}
