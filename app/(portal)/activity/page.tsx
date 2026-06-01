import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { timeAgo } from '@/lib/types'

export default async function ActivityPage() {
  await requireUser()
  const supabase = await createClient()

  // For V1, fetch the latest 100 activity logs
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*, actor:profiles!activity_logs_actor_id_fkey(id, display_name, email, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recent actions across the admin portal
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {!logs || logs.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No activity recorded yet.
              </p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              logs.map((log: any) => {
                const initials = (log.actor?.display_name ?? 'U')
                  .slice(0, 2)
                  .toUpperCase()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const meta = log.meta as Record<string, any>

                return (
                  <div key={log.id} className="flex gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <Avatar className="h-9 w-9 mt-0.5">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium">
                          {log.actor?.display_name ?? 'System'}{' '}
                          <span className="font-normal text-muted-foreground">
                            {log.action} {log.entity_type}
                          </span>
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {timeAgo(log.created_at)}
                        </span>
                      </div>
                      
                      {/* Meta details if available */}
                      {Object.keys(meta).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {meta.title && (
                            <span className="font-medium text-foreground/80 truncate max-w-[300px]">
                              &quot;{meta.title}&quot;
                            </span>
                          )}
                          {meta.email && <span>Email: {meta.email}</span>}
                          {meta.role && <span>Role: {meta.role}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
