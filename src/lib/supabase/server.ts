/**
 * Supabase Server Client
 * Production-ready server-side client for API routes and server actions
 * 
 * IMPORTANT: Only import this module from API routes and server actions
 */

import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Create a server-side Supabase client
 * Only call this from API routes, server actions, or server components
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  let cookieStore
  try {
    cookieStore = await cookies()
  } catch (error) {
    // During build time, cookies() might not be available
    // Return a client without cookie handling
    return createSupabaseServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get() { return undefined },
          set() { },
          remove() { },
        },
      }
    )
  }

  const client = createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Cookie errors in Server Components are expected
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Cookie errors in Server Components are expected
          }
        },
      },
    }
  )

  return client
}

// Alias for existing imports
export { createClient as createServerClient }

/**
 * Run a function within a request context
 * This is a simplified version that just executes the callback
 * 
 * @param fn - Function to execute
 * @returns Result of the function
 */
export function withRequestContext<T>(fn: () => Promise<T>): Promise<T> {
  return fn()
}

/**
 * Create a Supabase Admin client using service role key
 * This bypasses RLS - use carefully!
 * 
 * Use cases:
 * - Cron jobs / scheduled tasks
 * - Background processing without user session
 * - Admin operations
 */
export async function createAdminClient(): Promise<SupabaseClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
