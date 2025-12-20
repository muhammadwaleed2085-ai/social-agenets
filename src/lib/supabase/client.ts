/**
 * Supabase Browser Client
 * Production-ready client for client-side components
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Singleton instance - lazy initialized
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Environment validation
function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    console.error('[Supabase] Invalid SUPABASE_URL format')
    return null
  }

  // Validate key format (should be a JWT-like string)
  if (supabaseAnonKey.length < 100) {
    console.error('[Supabase] Invalid SUPABASE_ANON_KEY format')
    return null
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey }
}

/**
 * Create a Supabase browser client
 * Returns mock client during SSG/build time to prevent crashes
 */
export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  const config = getSupabaseConfig()

  if (!config) {
    // Return mock client for SSG/build time
    return createMockClient()
  }

  return createBrowserClient<Database>(config.url, config.anonKey)
}

/**
 * Get the Supabase client singleton (for client-side use)
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
 * Mock client for SSG/build scenarios
 * Returns safe defaults without crashing
 */
function createMockClient(): ReturnType<typeof createBrowserClient<Database>> {
  const mockBuilder = {
    select: () => mockBuilder,
    insert: () => mockBuilder,
    update: () => mockBuilder,
    delete: () => mockBuilder,
    eq: () => mockBuilder,
    neq: () => mockBuilder,
    gt: () => mockBuilder,
    gte: () => mockBuilder,
    lt: () => mockBuilder,
    lte: () => mockBuilder,
    like: () => mockBuilder,
    ilike: () => mockBuilder,
    is: () => mockBuilder,
    in: () => mockBuilder,
    contains: () => mockBuilder,
    containedBy: () => mockBuilder,
    range: () => mockBuilder,
    order: () => mockBuilder,
    limit: () => mockBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: null, error: null }),
  }

  return {
    from: () => mockBuilder,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
  } as unknown as ReturnType<typeof createBrowserClient<Database>>
}

// Default export using Proxy for lazy initialization
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(_, prop) {
    const client = getSupabaseClient()
    return (client as any)[prop]
  }
})
