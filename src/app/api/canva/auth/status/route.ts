import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPythonBackendUrl } from '@/lib/backend-url';

const PYTHON_BACKEND_URL = getPythonBackendUrl();

/**
 * GET /api/canva/auth/status
 * Check Canva authentication status
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/canva/auth/status?user_id=${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error checking Canva auth status:', error);
        return NextResponse.json({ error: 'Failed to check Canva auth status' }, { status: 500 });
    }
}
