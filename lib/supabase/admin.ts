import { createClient } from '@supabase/supabase-js'

// Runtime guard: this module must never be imported on the client
if (typeof window !== 'undefined') {
  throw new Error(
    'lib/supabase/admin.ts must not be imported in client-side code. ' +
    'The SUPABASE_SECRET_KEY must never be exposed to the browser.'
  )
}

export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
