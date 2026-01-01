'use client';

import React, { useState } from 'react';
import {
    Server,
    Send,
    TestTube,
    Activity,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Copy,
    Info,
    ShoppingCart,
    UserPlus,
    Eye,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Event types
const EVENT_TYPES = [
    { value: 'Purchase', label: 'Purchase', icon: ShoppingCart },
    { value: 'Lead', label: 'Lead', icon: UserPlus },
    { value: 'ViewContent', label: 'View Content', icon: Eye },
    { value: 'AddToCart', label: 'Add to Cart', icon: ShoppingCart },
    { value: 'InitiateCheckout', label: 'Initiate Checkout', icon: CreditCard },
    { value: 'CompleteRegistration', label: 'Complete Registration', icon: UserPlus },
];

interface ConversionsAPIManagerProps {
    onRefresh?: () => void;
}

export default function ConversionsAPIManager({ onRefresh }: ConversionsAPIManagerProps) {
    const [pixelId, setPixelId] = useState('');
    const [testEventCode, setTestEventCode] = useState('');
    const [eventType, setEventType] = useState('Purchase');
    const [eventValue, setEventValue] = useState('');
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [diagnostics, setDiagnostics] = useState<any>(null);
    const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);

    // SHA-256 hash for demo (in production, use backend hashing)
    const hashValue = async (value: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(value.toLowerCase().trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleSendTestEvent = async () => {
        if (!pixelId || !testEventCode) {
            setResult({ success: false, message: 'Pixel ID and Test Event Code are required' });
            return;
        }

        setIsSending(true);
        setResult(null);

        try {
            const hashedEmail = email ? await hashValue(email) : undefined;

            const event = {
                event_name: eventType,
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                user_data: {
                    em: hashedEmail,
                    client_user_agent: navigator.userAgent,
                },
                custom_data: eventValue ? {
                    value: parseFloat(eventValue),
                    currency: 'USD',
                } : undefined,
                event_id: `test_${Date.now()}`,
            };

            const response = await fetch('/api/v1/meta-ads/capi/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pixel_id: pixelId,
                    event,
                    test_event_code: testEventCode,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    success: true,
                    message: `Event sent successfully! Check Events Manager → Test Events`,
                });
            } else {
                setResult({
                    success: false,
                    message: data.error || 'Failed to send event',
                });
            }
        } catch (err) {
            setResult({
                success: false,
                message: 'Network error. Please try again.',
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleGetDiagnostics = async () => {
        if (!pixelId) return;

        setIsLoadingDiagnostics(true);
        try {
            const response = await fetch(`/api/v1/meta-ads/capi/diagnostics?pixel_id=${pixelId}`);
            const data = await response.json();
            setDiagnostics(data);
        } catch (err) {
            console.error('Failed to get diagnostics:', err);
        } finally {
            setIsLoadingDiagnostics(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Server className="w-6 h-6 text-green-500" />
                        Conversions API
                    </h2>
                    <p className="text-muted-foreground">Server-side event tracking for accurate attribution</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Test Events Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TestTube className="w-5 h-5 text-blue-500" />
                            Test Events
                        </CardTitle>
                        <CardDescription>
                            Send test events to verify your CAPI integration
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="pixelId">Pixel ID</Label>
                            <Input
                                id="pixelId"
                                value={pixelId}
                                onChange={(e) => setPixelId(e.target.value)}
                                placeholder="123456789"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="testCode">
                                Test Event Code
                                <span className="ml-1 text-xs text-muted-foreground">
                                    (from Events Manager → Test Events)
                                </span>
                            </Label>
                            <Input
                                id="testCode"
                                value={testEventCode}
                                onChange={(e) => setTestEventCode(e.target.value)}
                                placeholder="TEST12345"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Event Type</Label>
                            <Select value={eventType} onValueChange={setEventType}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EVENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="value">Value (USD)</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    value={eventValue}
                                    onChange={(e) => setEventValue(e.target.value)}
                                    placeholder="99.99"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email (for matching)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="test@example.com"
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {result && (
                            <div className={cn(
                                "flex items-center gap-2 p-3 rounded-lg",
                                result.success
                                    ? "bg-green-50 text-green-600 dark:bg-green-950/20"
                                    : "bg-red-50 text-red-600 dark:bg-red-950/20"
                            )}>
                                {result.success ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                <span className="text-sm">{result.message}</span>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={handleSendTestEvent}
                            disabled={isSending || !pixelId || !testEventCode}
                            className="w-full gap-2"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Test Event
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Diagnostics Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-500" />
                            Pixel Diagnostics
                        </CardTitle>
                        <CardDescription>
                            Check your pixel health and event quality
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter Pixel ID"
                                value={pixelId}
                                onChange={(e) => setPixelId(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleGetDiagnostics}
                                disabled={isLoadingDiagnostics || !pixelId}
                            >
                                {isLoadingDiagnostics ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Check'
                                )}
                            </Button>
                        </div>

                        {diagnostics && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="font-medium">Pixel Name</span>
                                    <span>{diagnostics.name || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="font-medium">Last Event</span>
                                    <span>{diagnostics.last_fired_time || 'Never'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="font-medium">Status</span>
                                    <span className={cn(
                                        "px-2 py-1 rounded text-xs font-medium",
                                        diagnostics.success
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    )}>
                                        {diagnostics.success ? 'Active' : 'Error'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Setup Guide */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        Quick Setup Guide
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="font-semibold mb-2">1. Get Your Pixel ID</div>
                            <p className="text-sm text-muted-foreground">
                                Find it in Events Manager → Data Sources → Your Pixel
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="font-semibold mb-2">2. Get Test Event Code</div>
                            <p className="text-sm text-muted-foreground">
                                Events Manager → Test Events → Generate Code
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="font-semibold mb-2">3. Send Test Events</div>
                            <p className="text-sm text-muted-foreground">
                                Use this tool to verify events appear in Test Events
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
