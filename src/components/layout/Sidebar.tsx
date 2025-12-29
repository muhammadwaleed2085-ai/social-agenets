'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Edit3,
    History,
    BarChart3,
    Settings,
    User,
    Sparkles,
    FolderOpen,
    Megaphone,
    MessageSquare,
    Video,
    Palette,
    Send,
    Users,
    Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModeToggle } from '@/components/ui/mode-toggle';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const sidebarItems = [
    { icon: Edit3, label: 'Create Content', href: '/dashboard/create' },
    { icon: Video, label: 'Media Studio', href: '/dashboard/media-studio' },
    { icon: Palette, label: 'Canva Editor', href: '/dashboard/canva-editor' },
    { icon: FolderOpen, label: 'Library', href: '/dashboard/library' },
    { icon: Send, label: 'Publish', href: '/dashboard/history' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: MessageSquare, label: 'Comments', href: '/dashboard/comments' },
    { icon: Megaphone, label: 'Meta Ads', href: '/dashboard/meta-ads' },
];

const bottomItems = [
    { icon: Users, label: 'Team', href: '/settings?tab=members' },
    { icon: Star, label: 'Favorites', href: '/dashboard/favorites' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex h-full w-[68px] flex-col items-center bg-sidebar border-r border-sidebar-border py-4">
                {/* Logo */}
                <div className="mb-6">
                    <Link href="/dashboard" className="group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                            <img
                                src="/frappe-framework-logo.svg"
                                alt="Logo"
                                className="h-10 w-10"
                            />
                        </div>
                    </Link>
                </div>

                {/* Main Navigation */}
                <nav className="flex flex-1 flex-col items-center gap-2">
                    {sidebarItems.map((item, index) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/20"
                                                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                        )}
                                    >
                                        {/* Active glow effect */}
                                        {isActive && (
                                            <div className="absolute inset-0 rounded-xl bg-primary/10 blur-sm" />
                                        )}
                                        <item.icon className={cn(
                                            "relative h-5 w-5 transition-all duration-200",
                                            isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                        )} />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-popover border-border shadow-xl">
                                    <p className="font-medium">{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="flex flex-col items-center gap-2 pt-4 border-t border-sidebar-border mt-2">
                    {/* Bottom Navigation Items */}
                    {bottomItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-primary/15 text-primary"
                                                : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                        )}
                                    >
                                        <item.icon className="h-[18px] w-[18px]" />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-popover border-border shadow-xl">
                                    <p className="font-medium">{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}

                    {/* Dark/Light Mode Toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                                <ModeToggle />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-popover border-border shadow-xl">
                            <p className="font-medium">Toggle Theme</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Settings */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/settings"
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                                    pathname?.startsWith('/settings')
                                        ? "bg-primary/15 text-primary"
                                        : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                )}
                            >
                                <Settings className="h-[18px] w-[18px]" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-popover border-border shadow-xl">
                            <p className="font-medium">Settings</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* User Avatar */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href="/settings?tab=profile" className="mt-2">
                                <Avatar className="h-9 w-9 ring-2 ring-sidebar-border ring-offset-2 ring-offset-sidebar transition-all hover:ring-primary/50">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                                        {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-popover border-border shadow-xl">
                            <p className="font-medium">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Profile'}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    );
}
