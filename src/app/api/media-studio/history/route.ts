import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPythonBackendUrl } from '@/lib/backend-url';

const PYTHON_BACKEND_URL = getPythonBackendUrl();

/**
 * GET /api/media-studio/history
 * Get media processing history
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspace_id');

        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        let url = `${PYTHON_BACKEND_URL}/api/v1/media-studio/history`;
        if (workspaceId) url += `?workspace_id=${workspaceId}`;

        const backendResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

/**
 * POST /api/media-studio/history
 * Add item to processing history
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/media-studio/history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error adding to history:', error);
        return NextResponse.json({ error: 'Failed to add to history' }, { status: 500 });
    }
}
