'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: typeof window !== 'undefined' ? {
          getItem: (key: string) => {
            try {
              return localStorage.getItem(key)
            } catch (error) {
              console.error('Error reading from localStorage:', error)
              return null
            }
          },
          setItem: (key: string, value: string) => {
            try {
              localStorage.setItem(key, value)
            } catch (error) {
              console.error('Error writing to localStorage:', error)
            }
          },
          removeItem: (key: string) => {
            try {
              localStorage.removeItem(key)
            } catch (error) {
              console.error('Error removing from localStorage:', error)
            }
          },
        } : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    }
  )
}