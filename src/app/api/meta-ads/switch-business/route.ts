/**
 * Meta Ads Switch Business Endpoint
 * GET/POST /api/meta-ads/switch-business
 *
 * Proxies to Python backend with server-side authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPythonBackendUrl } from '@/lib/backend-url'

export async function GET(req: NextRequest) {
    return handleRequest(req, 'GET')
}

export async function POST(req: NextRequest) {
    return handleRequest(req, 'POST')
}

async function handleRequest(req: NextRequest, method: 'GET' | 'POST') {
    try {
        // Authenticate user server-side
        const supabase = await createServerClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Forward to Python backend
        const backendUrl = getPythonBackendUrl()
        const body = method === 'POST' ? await req.json().catch(() => null) : null

        const response = await fetch(`${backendUrl}/api/v1/meta-ads/switch-business`, {
            method,
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return NextResponse.json(
                { error: errorData.detail || 'Failed to switch business' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Switch business error:', error)
        return NextResponse.json(
            { error: 'Failed to switch business' },
            { status: 500 }
        )
    }
}
