'use client';

import React, { useState, useEffect } from 'react';
import {
    Image,
    Video,
    Upload,
    Search,
    Grid3x3,
    List,
    Eye,
    BarChart3,
    Loader2,
    Plus,
    ExternalLink,
    Filter,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CreativeAsset {
    id: string;
    name: string;
    hash: string;
    url: string;
    width?: number;
    height?: number;
    created_time?: string;
    status?: string;
}

interface AdLibraryResult {
    id: string;
    page_id: string;
    page_name: string;
    ad_creative_bodies: string[];
    ad_creative_link_titles: string[];
    ad_snapshot_url?: string;
    ad_delivery_start_time?: string;
}

interface CreativeHubProps {
    onRefresh?: () => void;
}

export default function CreativeHub({ onRefresh }: CreativeHubProps) {
    const [activeTab, setActiveTab] = useState('library');
    const [assets, setAssets] = useState<CreativeAsset[]>([]);
    const [adLibraryResults, setAdLibraryResults] = useState<AdLibraryResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadUrl, setUploadUrl] = useState('');
    const [uploadName, setUploadName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/meta-ads/creative/library');
            if (response.ok) {
                const data = await response.json();
                setAssets(data.assets || []);
            }
        } catch (err) {
            console.error('Failed to fetch assets:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadUrl) return;

        setIsUploading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/meta-ads/creative/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: uploadName || 'Uploaded Image',
                    image_url: uploadUrl
                }),
            });

            if (response.ok) {
                setShowUploadModal(false);
                setUploadUrl('');
                setUploadName('');
                fetchAssets();
                onRefresh?.();
            } else {
                const data = await response.json();
                setError(data.detail || 'Upload failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const searchAdLibrary = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `/api/v1/meta-ads/adlibrary/search?search_terms=${encodeURIComponent(searchQuery)}&limit=25`
            );
            if (response.ok) {
                const data = await response.json();
                setAdLibraryResults(data.results || []);
            }
        } catch (err) {
            console.error('Failed to search ad library:', err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Image className="w-6 h-6 text-pink-500" />
                        Creative Hub
                    </h2>
                    <p className="text-muted-foreground">Manage creative assets and research competitors</p>
                </div>
                <Button
                    onClick={() => setShowUploadModal(true)}
                    className="gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
                >
                    <Upload className="w-4 h-4" />
                    Upload Creative
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="library" className="gap-2">
                        <Image className="w-4 h-4" />
                        Creative Library
                    </TabsTrigger>
                    <TabsTrigger value="research" className="gap-2">
                        <Search className="w-4 h-4" />
                        Ad Library
                    </TabsTrigger>
                </TabsList>

                {/* Library Tab */}
                <TabsContent value="library" className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {assets.length} assets
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : assets.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Image className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg mb-2">No Creatives Yet</h3>
                                <p className="text-muted-foreground text-center max-w-md mb-4">
                                    Upload images and videos to use in your ads.
                                </p>
                                <Button onClick={() => setShowUploadModal(true)} className="gap-2">
                                    <Upload className="w-4 h-4" />
                                    Upload Your First Creative
                                </Button>
                            </CardContent>
                        </Card>
                    ) : viewMode === 'grid' ? (
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {assets.map((asset) => (
                                <Card key={asset.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="aspect-square bg-muted relative">
                                        <img
                                            src={asset.url}
                                            alt={asset.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                                            }}
                                        />
                                    </div>
                                    <CardContent className="p-3">
                                        <p className="font-medium text-sm truncate">{asset.name || 'Untitled'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {asset.width && asset.height ? `${asset.width}×${asset.height}` : 'Image'}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {assets.map((asset) => (
                                <Card key={asset.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-3 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                            <img
                                                src={asset.url}
                                                alt={asset.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{asset.name || 'Untitled'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {asset.width && asset.height ? `${asset.width}×${asset.height}` : 'Image'}
                                                {asset.hash && ` • ${asset.hash.substring(0, 8)}...`}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Ad Library Research Tab */}
                <TabsContent value="research" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Meta Ad Library Research</CardTitle>
                            <CardDescription>Search competitor ads for inspiration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search by keyword, brand, or page..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchAdLibrary()}
                                    className="flex-1"
                                />
                                <Button onClick={searchAdLibrary} disabled={isSearching}>
                                    {isSearching ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>

                            {adLibraryResults.length > 0 && (
                                <div className="space-y-3 mt-4">
                                    {adLibraryResults.map((ad) => (
                                        <Card key={ad.id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold">{ad.page_name}</p>
                                                        {ad.ad_creative_bodies?.[0] && (
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                                {ad.ad_creative_bodies[0]}
                                                            </p>
                                                        )}
                                                        {ad.ad_creative_link_titles?.[0] && (
                                                            <p className="text-sm font-medium mt-2">
                                                                {ad.ad_creative_link_titles[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {ad.ad_snapshot_url && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(ad.ad_snapshot_url, '_blank')}
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5 text-pink-500" />
                                Upload Creative
                            </CardTitle>
                            <CardDescription>
                                Add a new image to your creative library
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name (optional)</Label>
                                <Input
                                    id="name"
                                    value={uploadName}
                                    onChange={(e) => setUploadName(e.target.value)}
                                    placeholder="My Creative"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="url">Image URL</Label>
                                <Input
                                    id="url"
                                    value={uploadUrl}
                                    onChange={(e) => setUploadUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="mt-1"
                                />
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/20">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || !uploadUrl}
                                className="bg-gradient-to-r from-pink-500 to-rose-600"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
