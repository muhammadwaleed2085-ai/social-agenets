'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Eye,
    Plus,
    Trash2,
    TrendingUp,
    Loader2,
    ExternalLink,
    Bookmark,
    BookmarkCheck,
    Tag,
    Calendar,
    Globe,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CompetitorAd {
    id: string;
    page_id: string;
    page_name: string;
    ad_creative_body?: string;
    ad_creative_link_title?: string;
    ad_delivery_start_time?: string;
    is_active: boolean;
    is_demo?: boolean;
}

interface WatchlistItem {
    id: string;
    page_id: string;
    page_name: string;
    industry?: string;
    added_at: string;
}

interface Trends {
    total_ads: number;
    active_ads: number;
    common_keywords: string[];
    top_formats: string[];
}

interface CompetitorAnalysisProps {
    onRefresh?: () => void;
}

export default function CompetitorAnalysis({ onRefresh }: CompetitorAnalysisProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [ads, setAds] = useState<CompetitorAd[]>([]);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [trends, setTrends] = useState<Trends | null>(null);
    const [industries, setIndustries] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [country, setCountry] = useState('ALL');

    useEffect(() => {
        fetchWatchlist();
        fetchIndustries();
    }, []);

    const fetchWatchlist = async () => {
        try {
            const response = await fetch('/api/v1/meta-ads/competitors/watchlist');
            if (response.ok) {
                const data = await response.json();
                setWatchlist(data.watchlist || []);
            }
        } catch (err) {
            console.error('Failed to fetch watchlist:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchIndustries = async () => {
        try {
            const response = await fetch('/api/v1/meta-ads/competitors/industries');
            if (response.ok) {
                const data = await response.json();
                setIndustries(data.industries || []);
            }
        } catch (err) {
            console.error('Failed to fetch industries:', err);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            // Use new SDK-based Ad Library endpoint
            const response = await fetch(
                `/api/meta-ads/sdk/ad-library/search?q=${encodeURIComponent(searchQuery)}&country=${country}`
            );

            if (response.ok) {
                const data = await response.json();

                // Map SDK response to component format
                const mappedAds = (data.ads || []).map((ad: any) => ({
                    id: ad.id,
                    page_id: ad.page_id,
                    page_name: ad.page_name,
                    ad_creative_body: ad.ad_text,
                    ad_creative_link_title: ad.headline,
                    ad_delivery_start_time: ad.start_date,
                    is_active: ad.is_active,
                    snapshot_url: ad.snapshot_url,
                    impressions: ad.impressions
                }));

                setAds(mappedAds);

                // Analyze trends locally from fetched ads for now
                if (mappedAds.length > 0) {
                    const activeCount = mappedAds.filter((a: any) => a.is_active).length;

                    // Extract common keywords
                    const text = mappedAds.map((a: any) => a.ad_creative_body || '').join(' ').toLowerCase();
                    const words = text.split(/\W+/).filter((w: string) => w.length > 4);
                    const freq: Record<string, number> = {};
                    words.forEach((w: string) => freq[w] = (freq[w] || 0) + 1);
                    const topKeywords = Object.entries(freq)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([w]) => w);

                    setTrends({
                        total_ads: mappedAds.length,
                        active_ads: activeCount,
                        common_keywords: topKeywords,
                        top_formats: ['Image', 'Video'] // Placeholder
                    });
                }
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const addToWatchlist = async (ad: CompetitorAd) => {
        try {
            const response = await fetch('/api/v1/meta-ads/competitors/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_id: ad.page_id,
                    page_name: ad.page_name
                })
            });

            if (response.ok) {
                fetchWatchlist();
            }
        } catch (err) {
            console.error('Failed to add to watchlist:', err);
        }
    };

    const removeFromWatchlist = async (id: string) => {
        try {
            const response = await fetch(`/api/v1/meta-ads/competitors/watchlist/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setWatchlist(prev => prev.filter(item => item.id !== id));
            }
        } catch (err) {
            console.error('Failed to remove from watchlist:', err);
        }
    };

    const isInWatchlist = (pageId: string) => {
        return watchlist.some(item => item.page_id === pageId);
    };

    const COUNTRIES = [
        { value: 'ALL', label: 'All Countries' },
        { value: 'US', label: 'United States' },
        { value: 'GB', label: 'United Kingdom' },
        { value: 'CA', label: 'Canada' },
        { value: 'AU', label: 'Australia' },
        { value: 'DE', label: 'Germany' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Eye className="w-6 h-6 text-violet-500" />
                        Competitor Analysis
                    </h2>
                    <p className="text-muted-foreground">Research competitor ads from Meta Ad Library</p>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Search competitor ads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery.trim()}
                            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600"
                        >
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Trends */}
                {trends && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <div className="text-2xl font-bold">{trends.total_ads}</div>
                                    <div className="text-xs text-muted-foreground">Total Ads</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <div className="text-2xl font-bold text-green-500">{trends.active_ads}</div>
                                    <div className="text-xs text-muted-foreground">Active</div>
                                </div>
                            </div>

                            {trends.common_keywords.length > 0 && (
                                <div>
                                    <Label className="text-xs">Common Keywords</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {trends.common_keywords.slice(0, 8).map((kw, i) => (
                                            <span key={i} className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full dark:bg-violet-900/30">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Watchlist */}
                <Card className={trends ? '' : 'lg:col-span-1'}>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bookmark className="w-4 h-4 text-amber-500" />
                            Watchlist
                        </CardTitle>
                        <CardDescription>{watchlist.length} competitors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {watchlist.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                Search and add competitors to track
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {watchlist.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                        <div>
                                            <div className="font-medium text-sm">{item.page_name}</div>
                                            {item.industry && (
                                                <div className="text-xs text-muted-foreground">{item.industry}</div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => removeFromWatchlist(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Search Results */}
                <Card className={trends ? 'lg:col-span-1' : 'lg:col-span-2'}>
                    <CardHeader>
                        <CardTitle className="text-lg">Search Results</CardTitle>
                        <CardDescription>{ads.length} ads found</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ads.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Enter a search term to find competitor ads</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {ads.map(ad => (
                                    <div key={ad.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{ad.page_name}</span>
                                                    {ad.is_demo && (
                                                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded">
                                                            Demo
                                                        </span>
                                                    )}
                                                </div>
                                                {ad.ad_creative_body && (
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                        {ad.ad_creative_body}
                                                    </p>
                                                )}
                                                {ad.ad_delivery_start_time && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                                        <Calendar className="w-3 h-3" />
                                                        Started: {ad.ad_delivery_start_time}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => addToWatchlist(ad)}
                                                disabled={isInWatchlist(ad.page_id)}
                                            >
                                                {isInWatchlist(ad.page_id) ? (
                                                    <BookmarkCheck className="w-4 h-4 text-amber-500" />
                                                ) : (
                                                    <Plus className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
