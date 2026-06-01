import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentCard } from '@/components/content/content-card'
import type { ContentItem } from '@/lib/types'
import { FileText, Users, Globe, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  await requireUser()
  const supabase = await createClient()

  // Fetch overview stats
  const [
    { count: contentCount },
    { count: usersCount },
    { count: countriesCount },
    { data: recentActivity },
    { data: recentContent },
  ] = await Promise.all([
    supabase.from('content_items').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('countries').select('*', { count: 'exact', head: true }),
    supabase
      .from('activity_logs')
      .select('*, actor:profiles!activity_logs_actor_id_fkey(display_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('content_items')
      .select('*, author:profiles!content_items_author_id_fkey(display_name, avatar_url), country:countries(name, flag_emoji)')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome to the BeyondBorders operations dashboard.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Content
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Countries Tracked
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countriesCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Actions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivity?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recently Published</h2>
            <Link href="/feed" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-3">
            {recentContent?.length ? (
              recentContent.map((item) => (
                <ContentCard key={item.id} item={item as unknown as ContentItem} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No content yet.</p>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link href="/activity" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentActivity?.length ? (
                  recentActivity.map((log) => {
                    const meta = log.meta as { title?: string, type?: string } | null
                    return (
                      <div key={log.id} className="flex items-center gap-3 p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {log.actor?.display_name ?? 'Unknown user'}{' '}
                            <span className="font-normal text-muted-foreground">
                              {log.action} {log.entity_type}
                            </span>
                          </p>
                          {meta?.title && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {meta.title}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">No activity recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
