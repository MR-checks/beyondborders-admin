/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
global.WebSocket = require('ws')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
)

async function fix() {
  const email = 'mistachecks@gmail.com'
  
  // 1. Try to fetch the user by email just in case they exist
  let { data: users } = await supabase.auth.admin.listUsers()
  let user = users?.users?.find(u => u.email === email)

  if (!user) {
    console.log('Creating new user explicitly (bypassing invite rate limits)...')
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { display_name: email.split('@')[0] }
    })
    
    if (createError) {
      console.log('Error creating user:', createError)
      return
    }
    user = createData.user
    console.log('User created:', user.id)
  } else {
    console.log('User already exists in auth.users:', user.id)
  }

  // 2. Upsert profile
  if (user) {
    console.log('Upserting profile...')
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      display_name: email.split('@')[0],
      role: 'admin'
    }, { onConflict: 'id' })
    
    if (profileError) {
      console.log('Error upserting profile:', profileError)
    } else {
      console.log('Profile successfully upserted! User should now appear in the UI.')
    }
  }
}

fix()
