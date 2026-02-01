import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side client with service role key (bypasses RLS)
// Only use this in server components and API routes

let supabaseAdminInstance: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey)
  }

  return supabaseAdminInstance
}

// For backwards compatibility - creates client on first access
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient]
  }
})
