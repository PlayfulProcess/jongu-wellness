import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  const isProduction = process.env.NODE_ENV === 'production' &&
                       typeof window !== 'undefined' &&
                       window.location.hostname.includes('recursive.eco')

  // Ensures session is persisted (not just in-memory)
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'recursive-eco-auth'
      },
      cookieOptions: isProduction ? {
        domain: '.recursive.eco',
        maxAge: 100000000,
        path: '/',
        sameSite: 'lax',
        secure: true,
      } : {
        // For local dev and Vercel previews: use default browser cookie behavior
        maxAge: 100000000,
        path: '/',
        sameSite: 'lax',
        secure: false,
      },
    }
  )
}