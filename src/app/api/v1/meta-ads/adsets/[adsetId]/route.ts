import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPythonBackendUrl } from '@/lib/backend-url';

const PYTHON_BACKEND_URL = getPythonBackendUrl();

type RouteParams = { params: Promise<{ adsetId: string }> };

/**
 * GET /api/v1/meta-ads/adsets/[adsetId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { adsetId } = await params;
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/meta-ads/adsets/${adsetId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error fetching ad set:', error);
        return NextResponse.json({ error: 'Failed to fetch ad set' }, { status: 500 });
    }
}

/**
 * PUT /api/v1/meta-ads/adsets/[adsetId]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { adsetId } = await params;
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/meta-ads/adsets/${adsetId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error updating ad set:', error);
        return NextResponse.json({ error: 'Failed to update ad set' }, { status: 500 });
    }
}

/**
 * PATCH /api/v1/meta-ads/adsets/[adsetId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { adsetId } = await params;
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/meta-ads/adsets/${adsetId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error updating ad set:', error);
        return NextResponse.json({ error: 'Failed to update ad set' }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/meta-ads/adsets/[adsetId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { adsetId } = await params;
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/meta-ads/adsets/${adsetId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        if (backendResponse.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error deleting ad set:', error);
        return NextResponse.json({ error: 'Failed to delete ad set' }, { status: 500 });
    }
}

