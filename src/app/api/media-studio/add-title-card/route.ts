import { NextResponse } from 'next/server';

/**
 * POST /api/media-studio/add-title-card
 * Removed: title cards are no longer supported
 */
export async function POST() {
    return NextResponse.json({ error: 'Title card has been removed' }, { status: 410 });
}
