import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Proxy (Middleware)
 * Handles session management and cookie refresh for authenticated routes
 * REQUIRES valid Supabase configuration
 */
export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Proxy] Supabase not configured. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
        // Return error response for protected routes
        const pathname = request.nextUrl.pathname
        const authRequiredPaths = ['/api/', '/dashboard']
        const requiresAuth = authRequiredPaths.some(path => pathname.startsWith(path))

        if (requiresAuth) {
            return NextResponse.json(
                { error: 'Authentication service not configured' },
                { status: 503 }
            )
        }
        return response
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        // Refresh session for authenticated API routes
        const pathname = request.nextUrl.pathname

        // Only refresh for routes that need auth
        const authRequiredPaths = ['/api/', '/dashboard']
        const shouldRefresh = authRequiredPaths.some(path => pathname.startsWith(path))

        if (shouldRefresh) {
            await supabase.auth.getSession()
        }
    } catch (error) {
        // Log error and return service unavailable for protected routes
        console.error('[Proxy] Session refresh error:', error)
        const pathname = request.nextUrl.pathname
        const authRequiredPaths = ['/api/', '/dashboard']
        const requiresAuth = authRequiredPaths.some(path => pathname.startsWith(path))

        if (requiresAuth) {
            return NextResponse.json(
                { error: 'Authentication service error' },
                { status: 503 }
            )
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets
         */
        '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
