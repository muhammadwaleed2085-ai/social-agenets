import { NextRequest, NextResponse } from 'next/server';
import { getPythonBackendUrl } from '@/lib/backend-url';

const PYTHON_BACKEND_URL = getPythonBackendUrl();

/**
 * GET /api/canva/callback
 * Handle Canva OAuth callback - proxies to Python backend
 * 
 * This endpoint receives the OAuth callback from Canva after user authorization.
 * It forwards the callback to the backend which exchanges the code for tokens.
 * The backend then redirects to the dashboard with success/error params.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Build query string for backend
        const params = new URLSearchParams();
        if (code) params.set('code', code);
        if (state) params.set('state', state);
        if (error) params.set('error', error);

        // Call the backend callback endpoint
        const backendResponse = await fetch(
            `${PYTHON_BACKEND_URL}/api/v1/canva/callback?${params.toString()}`,
            {
                method: 'GET',
                redirect: 'manual', // Don't follow redirects automatically
            }
        );

        // Backend returns a redirect response
        if (backendResponse.status >= 300 && backendResponse.status < 400) {
            const redirectUrl = backendResponse.headers.get('location');
            if (redirectUrl) {
                return NextResponse.redirect(redirectUrl);
            }
        }

        // If backend returned a non-redirect response, something went wrong
        const responseText = await backendResponse.text();
        console.error('Canva callback unexpected response:', backendResponse.status, responseText);

        // Redirect to dashboard with error
        return NextResponse.redirect(new URL('/dashboard/canva-editor?canva_error=callback_failed', request.url));
    } catch (error) {
        console.error('Error handling Canva callback:', error);
        return NextResponse.redirect(new URL('/dashboard/canva-editor?canva_error=unknown', request.url));
    }
}
