/**
 * Platform Disconnect Endpoint
 * DELETE /api/credentials/[platform]/disconnect
 *
 * Proxies to Python backend with server-side authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPythonBackendUrl } from '@/lib/backend-url'

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    try {
        const { platform } = await params

        // Validate platform
        const validPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube']
        if (!validPlatforms.includes(platform)) {
            return NextResponse.json(
                { error: 'Invalid platform' },
                { status: 400 }
            )
        }

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
        const response = await fetch(`${backendUrl}/api/v1/credentials/${platform}/disconnect`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return NextResponse.json(
                { error: errorData.detail || 'Failed to disconnect' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Disconnect error:', error)
        return NextResponse.json(
            { error: 'Failed to disconnect platform' },
            { status: 500 }
        )
    }
}
