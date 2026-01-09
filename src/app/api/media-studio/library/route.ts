import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPythonBackendUrl } from '@/lib/backend-url';

const PYTHON_BACKEND_URL = getPythonBackendUrl();

/**
 * GET /api/media-studio/library
 * Get media library items
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspace_id');
        const type = searchParams.get('type');
        const limit = searchParams.get('limit') || '50';
        const mediaId = searchParams.get('media_id');

        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        let url = `${PYTHON_BACKEND_URL}/api/v1/media-studio/library?limit=${limit}`;
        if (workspaceId) url += `&workspace_id=${workspaceId}`;
        if (type) url += `&type=${type}`;
        if (mediaId) url += `&media_id=${mediaId}`;

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
        console.error('Error fetching media library:', error);
        return NextResponse.json({ error: 'Failed to fetch media library' }, { status: 500 });
    }
}

/**
 * POST /api/media-studio/library
 * Add item to media library
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/media-studio/library`, {
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
        console.error('Error adding to media library:', error);
        return NextResponse.json({ error: 'Failed to add to media library' }, { status: 500 });
    }
}

/**
 * DELETE /api/media-studio/library
 * Delete item from media library
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspace_id');
        const mediaId = searchParams.get('media_id');

        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const backendResponse = await fetch(
            `${PYTHON_BACKEND_URL}/api/v1/media-studio/library?workspace_id=${workspaceId}&media_id=${mediaId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            }
        );

        if (backendResponse.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error deleting from media library:', error);
        return NextResponse.json({ error: 'Failed to delete from media library' }, { status: 500 });
    }
}
