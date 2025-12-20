/**
 * Supabase Browser Client
 * Production-ready client for client-side components
 * REQUIRES valid Supabase configuration - no mocks or fallbacks
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Singleton instance - lazy initialized
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Validate and get Supabase configuration
 * Throws error if not properly configured
 */
function getSupabaseConfig(): { url: string; anonKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables exist
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '[Supabase] Missing configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    )
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error('[Supabase] Invalid SUPABASE_URL format. Must be a valid URL.')
  }

  // Validate key format (should be a JWT-like string)
  if (supabaseAnonKey.length < 100) {
    throw new Error('[Supabase] Invalid SUPABASE_ANON_KEY format. Key appears to be too short.')
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey }
}

/**
 * Create a Supabase browser client
 * Throws error if Supabase is not configured
 */
export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  const config = getSupabaseConfig()
  return createBrowserClient<Database>(config.url, config.anonKey)
}

/**
 * Get the Supabase client singleton (for client-side use)
 * Throws error if Supabase is not configured
 */
export function getSupabaseClient(): ReturnType<typeof createBrowserClient<Database>> {
  // Server-side during SSG: return fresh client
  if (typeof window === 'undefined') {
    return createClient()
  }

  // Client-side: use singleton pattern
  if (!supabaseInstance) {
    supabaseInstance = createClient()
  }
  return supabaseInstance
}

/**
 * Check if Supabase is configured
 * Returns true if all required environment variables are set
 */
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(supabaseUrl && supabaseAnonKey)
}

// Default export using Proxy for lazy initialization
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(_, prop) {
    const client = getSupabaseClient()
    return (client as any)[prop]
  }
})
