// Force all dashboard routes to be dynamically rendered (prevents SSG during build)
// This must be a Server Component to use route segment config
export const dynamic = 'force-dynamic';

import React from 'react';
import DashboardClientLayout from './DashboardClientLayout';

export default function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
