'use client';

import React, { useState, useEffect } from 'react';
import {
    FileBarChart,
    Plus,
    Download,
    Save,
    Play,
    Loader2,
    Settings,
    Table,
    BarChart3,
    Calendar,
    ChevronDown,
    Check,
    X,
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

interface Metric {
    value: string;
    label: string;
    format: string;
}

interface Breakdown {
    value: string;
    label: string;
}

interface ReportsBuilderProps {
    onRefresh?: () => void;
}

export default function ReportsBuilder({ onRefresh }: ReportsBuilderProps) {
    const [availableMetrics, setAvailableMetrics] = useState<Metric[]>([]);
    const [availableBreakdowns, setAvailableBreakdowns] = useState<Breakdown[]>([]);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['impressions', 'clicks', 'spend', 'ctr']);
    const [selectedBreakdowns, setSelectedBreakdowns] = useState<string[]>([]);
    const [datePreset, setDatePreset] = useState('last_7d');
    const [entityLevel, setEntityLevel] = useState('campaign');
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchMetrics();
        fetchBreakdowns();
    }, []);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/v1/meta-ads/reports/metrics');
            if (response.ok) {
                const data = await response.json();
                setAvailableMetrics(data.metrics || []);
            }
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
        }
    };

    const fetchBreakdowns = async () => {
        try {
            const response = await fetch('/api/v1/meta-ads/reports/breakdowns');
            if (response.ok) {
                const data = await response.json();
                setAvailableBreakdowns(data.breakdowns || []);
            }
        } catch (err) {
            console.error('Failed to fetch breakdowns:', err);
        }
    };

    const toggleMetric = (metric: string) => {
        setSelectedMetrics(prev =>
            prev.includes(metric)
                ? prev.filter(m => m !== metric)
                : [...prev, metric]
        );
    };

    const toggleBreakdown = (breakdown: string) => {
        setSelectedBreakdowns(prev =>
            prev.includes(breakdown)
                ? prev.filter(b => b !== breakdown)
                : [...prev, breakdown]
        );
    };

    const generateReport = async () => {
        if (selectedMetrics.length === 0) return;

        setIsGenerating(true);
        try {
            const response = await fetch('/api/v1/meta-ads/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metrics: selectedMetrics,
                    breakdowns: selectedBreakdowns.length > 0 ? selectedBreakdowns : undefined,
                    date_preset: datePreset,
                    entity_level: entityLevel
                })
            });

            if (response.ok) {
                const data = await response.json();
                setReportData(data.rows || []);
            }
        } catch (err) {
            console.error('Failed to generate report:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const exportReport = () => {
        if (reportData.length === 0) return;

        const csv = [
            selectedMetrics.join(','),
            ...reportData.map(row =>
                selectedMetrics.map(m => row[m] || '').join(',')
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${datePreset}.csv`;
        a.click();
    };

    const DATE_PRESETS = [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last_7d', label: 'Last 7 Days' },
        { value: 'last_14d', label: 'Last 14 Days' },
        { value: 'last_30d', label: 'Last 30 Days' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileBarChart className="w-6 h-6 text-indigo-500" />
                        Custom Reports
                    </h2>
                    <p className="text-muted-foreground">Build custom reports with your metrics</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={exportReport}
                        disabled={reportData.length === 0}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                    <Button
                        onClick={generateReport}
                        disabled={isGenerating || selectedMetrics.length === 0}
                        className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        Generate Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Config Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Report Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Date Range</Label>
                            <Select value={datePreset} onValueChange={setDatePreset}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATE_PRESETS.map(preset => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Entity Level</Label>
                            <Select value={entityLevel} onValueChange={setEntityLevel}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="campaign">Campaign</SelectItem>
                                    <SelectItem value="adset">Ad Set</SelectItem>
                                    <SelectItem value="ad">Ad</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="mb-2 block">Metrics ({selectedMetrics.length})</Label>
                            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                                {availableMetrics.map(metric => (
                                    <button
                                        key={metric.value}
                                        onClick={() => toggleMetric(metric.value)}
                                        className={cn(
                                            "px-2 py-1 text-xs rounded-full border transition-all",
                                            selectedMetrics.includes(metric.value)
                                                ? "bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30"
                                                : "bg-muted hover:border-indigo-300"
                                        )}
                                    >
                                        {metric.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label className="mb-2 block">Breakdowns ({selectedBreakdowns.length})</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {availableBreakdowns.map(breakdown => (
                                    <button
                                        key={breakdown.value}
                                        onClick={() => toggleBreakdown(breakdown.value)}
                                        className={cn(
                                            "px-2 py-1 text-xs rounded-full border transition-all",
                                            selectedBreakdowns.includes(breakdown.value)
                                                ? "bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30"
                                                : "bg-muted hover:border-purple-300"
                                        )}
                                    >
                                        {breakdown.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Table className="w-4 h-4" />
                            Report Results
                        </CardTitle>
                        <CardDescription>
                            {reportData.length} rows
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reportData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Configure your report and click Generate</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            {selectedMetrics.map(metric => (
                                                <th key={metric} className="text-left p-2 font-medium">
                                                    {availableMetrics.find(m => m.value === metric)?.label || metric}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.slice(0, 20).map((row, i) => (
                                            <tr key={i} className="border-b hover:bg-muted/50">
                                                {selectedMetrics.map(metric => (
                                                    <td key={metric} className="p-2">
                                                        {row[metric] || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {reportData.length > 20 && (
                                    <p className="text-center text-sm text-muted-foreground mt-4">
                                        Showing 20 of {reportData.length} rows
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
