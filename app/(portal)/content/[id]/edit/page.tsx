import { notFound, redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { fetchContentById, fetchCountries } from '@/lib/content'
import { ContentForm } from '@/components/content/content-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditContentPage({ params }: PageProps) {
  const user = await requireUser()
  const { id } = await params

  const item = await fetchContentById(id)
  if (!item) notFound()

  // Check authorization: author or super_admin
  if (item.author_id !== user.id && user.role !== 'super_admin') {
    redirect('/')
  }

  const countries = await fetchCountries()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Edit Content</h1>
      <ContentForm type={item.type} countries={countries} editItem={item} />
    </div>
  )
}
