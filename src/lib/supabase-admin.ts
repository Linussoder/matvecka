import { createClient } from '@supabase/supabase-js'

// Server-side client with service role key (bypasses RLS)
// Only use this in server components and API routes

export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase env vars missing:', {
      url: !!supabaseUrl,
      key: !!supabaseServiceKey
    })
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// For backwards compatibility - export a getter
export const supabaseAdmin = {
  from: (table: string) => createSupabaseAdmin().from(table),
  auth: createSupabaseAdmin().auth,
  storage: createSupabaseAdmin().storage,
  rpc: (fn: string, params?: object) => createSupabaseAdmin().rpc(fn, params),
}
