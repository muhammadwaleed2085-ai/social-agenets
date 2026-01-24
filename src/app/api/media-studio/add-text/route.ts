import { NextResponse } from 'next/server';

/**
 * POST /api/media-studio/add-text
 * Removed: text overlay is no longer supported
 */
export async function POST() {
    return NextResponse.json({ error: 'Text overlay has been removed' }, { status: 410 });
}
