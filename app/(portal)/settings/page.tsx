import { requireUser } from '@/lib/auth'
import { SettingsClient } from './client'

export default async function SettingsPage() {
  const user = await requireUser()

  return <SettingsClient user={user} />
}
