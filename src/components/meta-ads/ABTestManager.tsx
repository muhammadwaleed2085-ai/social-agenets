'use client';

import React, { useState, useEffect } from 'react';
import {
    FlaskConical,
    Plus,
    Play,
    Pause,
    Trash2,
    Trophy,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Loader2,
    ChevronRight,
    BarChart3,
    Users,
    Image,
    Layout,
    Zap,
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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Test variables
const TEST_VARIABLES = [
    { value: 'AUDIENCE', label: 'Audience', icon: Users, description: 'Compare different target audiences' },
    { value: 'CREATIVE', label: 'Creative', icon: Image, description: 'Test different ad creatives' },
    { value: 'PLACEMENT', label: 'Placement', icon: Layout, description: 'Compare placement performance' },
    { value: 'DELIVERY_OPTIMIZATION', label: 'Optimization', icon: Zap, description: 'Test delivery strategies' },
];

interface ABTest {
    id: string;
    name: string;
    test_type: string;
    test_variable: string;
    status: string;
    cells: Array<{
        name: string;
        treatment_percentage: number;  // v25.0+ format
        campaigns?: string[];
        adsets?: string[];
        results?: {
            spend: number;
            impressions: number;
            clicks: number;
            conversions: number;
            ctr: number;
            cost_per_result: number;
        };
    }>;
    start_time?: string;
    end_time: string;
    confidence_level: number;
    winning_cell?: string;
}

interface ABTestManagerProps {
    onRefresh?: () => void;
}

interface Campaign {
    id: string;
    name: string;
    status: string;
}

interface Business {
    id: string;
    name: string;
}

export default function ABTestManager({ onRefresh }: ABTestManagerProps) {
    const [tests, setTests] = useState<ABTest[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        test_type: 'SPLIT_TEST',
        test_variable: 'CREATIVE',
        description: '',
        business_id: '', // Auto-fetched or selected
        cells: [
            { name: 'Group A', treatment_percentage: 50, campaigns: [] as string[] },
            { name: 'Group B', treatment_percentage: 50, campaigns: [] as string[] },
        ],
        start_time: undefined as number | undefined,
        end_time: undefined as number | undefined,
    });

    useEffect(() => {
        fetchTests();
        fetchCampaigns();
        fetchBusinesses();
    }, []);

    const fetchTests = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/meta-ads/ab-tests');
            if (response.ok) {
                const data = await response.json();
                setTests(data.tests || []);
            }
        } catch (err) {
            console.error('Failed to fetch A/B tests:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const response = await fetch('/api/v1/meta-ads/campaigns');
            if (response.ok) {
                const data = await response.json();
                setCampaigns(data.campaigns || []);
            }
        } catch (err) {
            console.error('Failed to fetch campaigns:', err);
        }
    };

    const fetchBusinesses = async () => {
        try {
            const response = await fetch('/api/v1/meta-ads/businesses');
            if (response.ok) {
                const data = await response.json();
                const bizList = data.businesses || [];
                setBusinesses(bizList);
                // Auto-select first business if available
                if (bizList.length > 0 && !formData.business_id) {
                    setFormData(prev => ({ ...prev, business_id: bizList[0].id }));
                }
            }
        } catch (err) {
            console.error('Failed to fetch businesses:', err);
        }
    };

    const handleCreateTest = async () => {
        setIsCreating(true);
        setError(null);

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                test_type: formData.test_type,
                cells: formData.cells,
                start_time: formData.start_time,
                end_time: formData.end_time,
                business_id: formData.business_id || undefined, // Only include if provided
            };

            const response = await fetch('/api/v1/meta-ads/ab-tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setShowCreateModal(false);
                fetchTests();
                onRefresh?.();
            } else {
                const data = await response.json();
                setError(data.detail || 'Failed to create test');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Play className="w-3 h-3" />
                        Active
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                    </span>
                );
            case 'PAUSED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <Pause className="w-3 h-3" />
                        Paused
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        {status}
                    </span>
                );
        }
    };

    const getVariableIcon = (variable: string) => {
        const found = TEST_VARIABLES.find(v => v.value === variable);
        if (found) {
            const Icon = found.icon;
            return <Icon className="w-4 h-4" />;
        }
        return <FlaskConical className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FlaskConical className="w-6 h-6 text-purple-500" />
                        A/B Testing
                    </h2>
                    <p className="text-muted-foreground">Create and manage split tests</p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                    <Plus className="w-4 h-4" />
                    Create A/B Test
                </Button>
            </div>

            {/* Tests Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : tests.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FlaskConical className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No A/B Tests Yet</h3>
                        <p className="text-muted-foreground text-center max-w-md mb-4">
                            Create your first A/B test to compare different ad strategies and find what works best.
                        </p>
                        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Your First Test
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tests.map((test) => (
                        <Card key={test.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {getVariableIcon(test.test_variable)}
                                        <CardTitle className="text-base">{test.name}</CardTitle>
                                    </div>
                                    {getStatusBadge(test.status)}
                                </div>
                                <CardDescription className="flex items-center gap-2">
                                    Testing: {test.test_variable}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {/* Cells comparison */}
                                    {test.cells?.map((cell, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium flex items-center gap-1">
                                                    {test.winning_cell === cell.name && (
                                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                                    )}
                                                    {cell.name}
                                                </span>
                                                <span className="text-muted-foreground">{cell.treatment_percentage}%</span>
                                            </div>
                                            <Progress value={cell.treatment_percentage} className="h-2" />
                                        </div>
                                    ))}

                                    {/* Confidence level */}
                                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                                        <span className="text-muted-foreground">Confidence Level</span>
                                        <span className="font-medium">{(test.confidence_level * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button variant="ghost" size="sm" className="w-full gap-1">
                                    View Results
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FlaskConical className="w-5 h-5 text-purple-500" />
                                Create A/B Test
                            </CardTitle>
                            <CardDescription>
                                Compare different ad strategies to optimize performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="testName">Test Name</Label>
                                <Input
                                    id="testName"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Holiday Creative Test"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Test Variable</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {TEST_VARIABLES.map((variable) => {
                                        const Icon = variable.icon;
                                        return (
                                            <div
                                                key={variable.value}
                                                className={cn(
                                                    "p-3 rounded-lg border cursor-pointer transition-all",
                                                    formData.test_variable === variable.value
                                                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                                                        : "border-muted hover:border-purple-300"
                                                )}
                                                onClick={() => setFormData({ ...formData, test_variable: variable.value })}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-purple-500" />
                                                    <span className="font-medium text-sm">{variable.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Test video vs image creatives"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Business Account</Label>
                                <Select
                                    value={formData.business_id}
                                    onValueChange={(value) => setFormData({ ...formData, business_id: value === 'ad_account' ? '' : value })}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select business account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ad_account">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                Use Ad Account (Default)
                                            </div>
                                        </SelectItem>
                                        {businesses.map((biz) => (
                                            <SelectItem key={biz.id} value={biz.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                                    {biz.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {businesses.length === 0 ? 'Loading businesses...' : 'Select your Business Manager for cross-account studies'}
                                </p>
                            </div>

                            {/* Test Cells Configuration */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Test Cells (Groups)</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (formData.cells.length < 5) {
                                                setFormData({
                                                    ...formData,
                                                    cells: [
                                                        ...formData.cells,
                                                        {
                                                            name: `Group ${String.fromCharCode(65 + formData.cells.length)}`,
                                                            treatment_percentage: Math.floor(100 / (formData.cells.length + 1)),
                                                            campaigns: []
                                                        }
                                                    ]
                                                });
                                            }
                                        }}
                                        disabled={formData.cells.length >= 5}
                                        className="gap-1 text-xs h-7"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Cell
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {formData.cells.map((cell, idx) => (
                                        <div key={idx} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <Input
                                                    value={cell.name}
                                                    onChange={(e) => {
                                                        const newCells = [...formData.cells];
                                                        newCells[idx].name = e.target.value;
                                                        setFormData({ ...formData, cells: newCells });
                                                    }}
                                                    placeholder={`Group ${String.fromCharCode(65 + idx)}`}
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={99}
                                                        value={cell.treatment_percentage}
                                                        onChange={(e) => {
                                                            const newCells = [...formData.cells];
                                                            newCells[idx].treatment_percentage = parseInt(e.target.value) || 0;
                                                            setFormData({ ...formData, cells: newCells });
                                                        }}
                                                        className="w-16 h-8 text-sm text-center"
                                                    />
                                                    <span className="text-xs text-muted-foreground">%</span>
                                                </div>
                                                {formData.cells.length > 2 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const newCells = formData.cells.filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, cells: newCells });
                                                        }}
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div>
                                                <Select
                                                    value={cell.campaigns[0] || ''}
                                                    onValueChange={(value) => {
                                                        const newCells = [...formData.cells];
                                                        if (value) {
                                                            // Toggle: add if not exists, keep only one for now
                                                            newCells[idx].campaigns = [value];
                                                        } else {
                                                            newCells[idx].campaigns = [];
                                                        }
                                                        setFormData({ ...formData, cells: newCells });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Select a campaign" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {campaigns.length === 0 ? (
                                                            <SelectItem value="-" disabled>No campaigns available</SelectItem>
                                                        ) : (
                                                            campaigns.map((campaign) => (
                                                                <SelectItem key={campaign.id} value={campaign.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={cn(
                                                                            "w-2 h-2 rounded-full",
                                                                            campaign.status === 'ACTIVE' ? "bg-green-500" : "bg-yellow-500"
                                                                        )} />
                                                                        <span className="truncate">{campaign.name}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Treatment percentage total indicator */}
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Total allocation:</span>
                                    <span className={cn(
                                        "font-medium",
                                        formData.cells.reduce((sum, c) => sum + c.treatment_percentage, 0) === 100
                                            ? "text-green-600"
                                            : "text-red-500"
                                    )}>
                                        {formData.cells.reduce((sum, c) => sum + c.treatment_percentage, 0)}%
                                        {formData.cells.reduce((sum, c) => sum + c.treatment_percentage, 0) !== 100 && " (should be 100%)"}
                                    </span>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startTime">Start Date (Optional)</Label>
                                    <Input
                                        id="startTime"
                                        type="datetime-local"
                                        value={formData.start_time ? new Date(formData.start_time * 1000).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : undefined })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endTime">End Date</Label>
                                    <Input
                                        id="endTime"
                                        type="datetime-local"
                                        value={formData.end_time ? new Date(formData.end_time * 1000).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setFormData({ ...formData, end_time: Math.floor(new Date(e.target.value).getTime() / 1000) })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/20">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTest}
                                disabled={isCreating || !formData.name}
                                className="bg-gradient-to-r from-purple-500 to-pink-600"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Test'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
