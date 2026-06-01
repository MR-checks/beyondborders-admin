import { adminClient } from '@/lib/supabase/admin'

/**
 * Log an activity — server-side only via admin client (bypasses RLS insert restriction).
 */
export async function logActivity(params: {
  actorId: string | null
  action: string
  entityType: string
  entityId?: string | null
  meta?: Record<string, unknown>
}) {
  await adminClient.from('activity_logs').insert({
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    meta: params.meta ?? {},
  })
}
