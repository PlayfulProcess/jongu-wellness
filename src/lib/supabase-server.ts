import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  // Check if we're on the production recursive.eco domain
  const host = headerStore.get('host') || ''
  const isProduction = process.env.NODE_ENV === 'production' && host.includes('recursive.eco')

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'recursive-eco-auth'
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = isProduction ? {
                ...options,
                domain: '.recursive.eco',
                path: '/',
                sameSite: 'lax' as const,
                secure: true,
              } : {
                // For local dev and Vercel previews: use default cookie behavior
                ...options,
                path: '/',
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
              };
              cookieStore.set(name, value, cookieOptions);
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}