/* eslint-disable @typescript-eslint/no-require-imports */
global.WebSocket = require('ws')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
)

async function check() {
  const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'mistachecks@gmail.com')
  console.log(profile)
}

check()
