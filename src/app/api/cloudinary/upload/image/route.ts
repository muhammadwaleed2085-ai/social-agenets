import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPythonBackendUrl } from '@/lib/backend-url';

const PYTHON_BACKEND_URL = getPythonBackendUrl();

/**
 * POST /api/cloudinary/upload/image
 * Upload an image to Cloudinary
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Forward the form data to the backend
        const formData = await request.formData();

        const backendResponse = await fetch(`${PYTHON_BACKEND_URL}/api/v1/cloudinary/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData,
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}
