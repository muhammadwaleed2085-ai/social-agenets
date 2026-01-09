import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPythonBackendUrl } from '@/lib/backend-url';

const PYTHON_BACKEND_URL = getPythonBackendUrl();

type RouteParams = { params: Promise<{ campaignId: string }> };

/**
 * POST /api/v1/meta-ads/campaigns/[campaignId]/archive
 * Archive a campaign (sets status to ARCHIVED)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { campaignId } = await params;
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/meta-ads/campaigns/${campaignId}/archive`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error archiving campaign:', error);
        return NextResponse.json({ error: 'Failed to archive campaign' }, { status: 500 });
    }
}
