import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPythonBackendUrl } from '@/lib/backend-url';

const PYTHON_BACKEND_URL = getPythonBackendUrl();

type RouteParams = { params: Promise<{ adsetId: string }> };

/**
 * POST /api/v1/meta-ads/adsets/[adsetId]/archive
 * Archive an ad set (sets status to ARCHIVED)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { adsetId } = await params;
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/meta-ads/adsets/${adsetId}/archive`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error archiving ad set:', error);
        return NextResponse.json({ error: 'Failed to archive ad set' }, { status: 500 });
    }
}
