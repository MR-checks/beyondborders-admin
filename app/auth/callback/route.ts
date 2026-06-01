import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    // Code exchange failed — actual error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // No code param — this is the implicit flow (invite links).
  // The tokens are in the URL hash fragment which the server cannot see.
  // Redirect to /login and let the client-side JS pick up the hash.
  return NextResponse.redirect(`${origin}/login`)
}
