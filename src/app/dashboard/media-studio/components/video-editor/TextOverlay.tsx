'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Loader2,
    Video,
    Type,
    Clock,
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowUp,
    ArrowDown,
    Check,
    Palette,
    Square,
    Film,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { VideoItem } from './types';

interface TextOverlayProps {
    libraryVideos: VideoItem[];
    isLoadingLibrary: boolean;
    onTextComplete: (videoUrl: string) => void;
}

const TEXT_POSITIONS = [
    { value: 'top_left', label: 'Top Left', icon: '↖' },
    { value: 'top_center', label: 'Top Center', icon: '↑' },
    { value: 'top_right', label: 'Top Right', icon: '↗' },
    { value: 'center_left', label: 'Center Left', icon: '←' },
    { value: 'center', label: 'Center', icon: '•' },
    { value: 'center_right', label: 'Center Right', icon: '→' },
    { value: 'bottom_left', label: 'Bottom Left', icon: '↙' },
    { value: 'bottom_center', label: 'Bottom Center', icon: '↓' },
    { value: 'bottom_right', label: 'Bottom Right', icon: '↘' },
];

const FONT_COLORS = [
    { value: 'white', label: 'White', color: '#ffffff' },
    { value: 'black', label: 'Black', color: '#000000' },
    { value: 'yellow', label: 'Yellow', color: '#ffff00' },
    { value: 'red', label: 'Red', color: '#ff0000' },
    { value: 'blue', label: 'Blue', color: '#0066ff' },
    { value: 'green', label: 'Green', color: '#00ff00' },
];

const BG_COLORS = [
    { value: '', label: 'None', color: 'transparent' },
    { value: 'black', label: 'Black', color: '#000000' },
    { value: 'white', label: 'White', color: '#ffffff' },
    { value: 'blue', label: 'Blue', color: '#0066ff' },
    { value: 'red', label: 'Red', color: '#ff0000' },
];

export function TextOverlay({ libraryVideos, isLoadingLibrary, onTextComplete }: TextOverlayProps) {
    const { workspaceId } = useAuth();
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeMode, setActiveMode] = useState<'text' | 'title'>('text');

    // Text Overlay State
    const [text, setText] = useState('');
    const [position, setPosition] = useState('bottom_center');
    const [fontSize, setFontSize] = useState(48);
    const [fontColor, setFontColor] = useState('white');
    const [bgColor, setBgColor] = useState('');
    const [bgOpacity, setBgOpacity] = useState(0.5);

    // Title Card State
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [titleDuration, setTitleDuration] = useState(3);
    const [titlePosition, setTitlePosition] = useState<'start' | 'end'>('start');
    const [titleBgColor, setTitleBgColor] = useState('black');
    const [titleColor, setTitleColor] = useState('white');
    const [titleSize, setTitleSize] = useState(72);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVideoSelect = (video: VideoItem) => {
        setSelectedVideo(video);
    };

    const handleAddText = async () => {
        if (!selectedVideo || !workspaceId) {
            toast.error('Please select a video first');
            return;
        }

        if (!text.trim()) {
            toast.error('Please enter text to overlay');
            return;
        }

        setIsProcessing(true);
        const loadingToast = toast.loading('Adding text overlay...', { duration: Infinity });

        try {
            const response = await fetch('/api/media-studio/add-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    videoUrl: selectedVideo.url,
                    text: text.trim(),
                    position,
                    fontSize,
                    fontColor,
                    bgColor: bgColor || undefined,
                    bgOpacity,
                }),
            });

            toast.dismiss(loadingToast);

            if (response.ok) {
                const data = await response.json();
                toast.success('Text overlay added successfully!');
                onTextComplete(data.url);
                setSelectedVideo(null);
                setText('');
            } else {
                const error = await response.json();
                toast.error(error.detail?.error || 'Failed to add text overlay');
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to add text overlay');
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddTitleCard = async () => {
        if (!selectedVideo || !workspaceId) {
            toast.error('Please select a video first');
            return;
        }

        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        setIsProcessing(true);
        const loadingToast = toast.loading('Adding title card...', { duration: Infinity });

        try {
            const response = await fetch('/api/media-studio/add-title-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    videoUrl: selectedVideo.url,
                    title: title.trim(),
                    subtitle: subtitle.trim() || undefined,
                    duration: titleDuration,
                    position: titlePosition,
                    bgColor: titleBgColor,
                    titleColor,
                    titleSize,
                }),
            });

            toast.dismiss(loadingToast);

            if (response.ok) {
                const data = await response.json();
                toast.success('Title card added successfully!');
                onTextComplete(data.url);
                setSelectedVideo(null);
                setTitle('');
                setSubtitle('');
            } else {
                const error = await response.json();
                toast.error(error.detail?.error || 'Failed to add title card');
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to add title card');
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Library */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Select Video
                    </CardTitle>
                    <CardDescription>
                        Choose a video to add text or title card
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingLibrary ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : libraryVideos.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No videos in library</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                            {libraryVideos.map((video) => (
                                <button
                                    key={video.id}
                                    onClick={() => handleVideoSelect(video)}
                                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedVideo?.id === video.id
                                            ? 'border-primary ring-2 ring-primary/30'
                                            : 'border-transparent hover:border-muted-foreground/30'
                                        }`}
                                >
                                    <video
                                        src={video.url}
                                        className="w-full aspect-video object-cover bg-black"
                                        muted
                                        preload="metadata"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                        <Badge variant="secondary" className="text-xs">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatTime(video.duration || 0)}
                                        </Badge>
                                    </div>
                                    {selectedVideo?.id === video.id && (
                                        <div className="absolute top-2 right-2">
                                            <div className="bg-primary rounded-full p-1">
                                                <Check className="w-3 h-3 text-primary-foreground" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Text Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Type className="w-5 h-5" />
                        Add Text
                    </CardTitle>
                    <CardDescription>
                        Add text overlay or title card to your video
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {selectedVideo ? (
                        <>
                            {/* Video Preview */}
                            <div className="relative rounded-lg overflow-hidden bg-black">
                                <video
                                    src={selectedVideo.url}
                                    className="w-full aspect-video object-contain"
                                    muted
                                />
                                {/* Preview overlay - shows approximate text position */}
                                {activeMode === 'text' && text && (
                                    <div
                                        className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none"
                                        style={{
                                            alignItems: position.includes('top') ? 'flex-start' : position.includes('bottom') ? 'flex-end' : 'center',
                                            justifyContent: position.includes('left') ? 'flex-start' : position.includes('right') ? 'flex-end' : 'center',
                                        }}
                                    >
                                        <div
                                            className="px-3 py-1 rounded"
                                            style={{
                                                backgroundColor: bgColor ? `${FONT_COLORS.find(c => c.value === bgColor)?.color || bgColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}` : 'transparent',
                                                color: FONT_COLORS.find(c => c.value === fontColor)?.color || fontColor,
                                                fontSize: `${fontSize / 3}px`,
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {text}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mode Tabs */}
                            <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as 'text' | 'title')}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="text" className="gap-2">
                                        <Type className="w-4 h-4" />
                                        Text Overlay
                                    </TabsTrigger>
                                    <TabsTrigger value="title" className="gap-2">
                                        <Film className="w-4 h-4" />
                                        Title Card
                                    </TabsTrigger>
                                </TabsList>

                                {/* Text Overlay Tab */}
                                <TabsContent value="text" className="space-y-4 mt-4">
                                    {/* Text Input */}
                                    <div className="space-y-2">
                                        <Label>Text</Label>
                                        <Input
                                            placeholder="Enter your text..."
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            className="text-lg"
                                        />
                                    </div>

                                    {/* Position Grid */}
                                    <div className="space-y-2">
                                        <Label>Position</Label>
                                        <div className="grid grid-cols-3 gap-1 p-2 bg-muted/30 rounded-lg">
                                            {TEXT_POSITIONS.map((pos) => (
                                                <Button
                                                    key={pos.value}
                                                    variant={position === pos.value ? 'default' : 'ghost'}
                                                    size="sm"
                                                    onClick={() => setPosition(pos.value)}
                                                    className="h-10"
                                                >
                                                    {pos.icon}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Font Size */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Font Size</Label>
                                            <span className="text-sm text-muted-foreground">{fontSize}px</span>
                                        </div>
                                        <Slider
                                            value={[fontSize]}
                                            min={24}
                                            max={120}
                                            step={4}
                                            onValueChange={(v) => setFontSize(v[0])}
                                        />
                                    </div>

                                    {/* Colors */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Font Color</Label>
                                            <div className="flex gap-1">
                                                {FONT_COLORS.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        onClick={() => setFontColor(color.value)}
                                                        className={`w-8 h-8 rounded-full border-2 transition-all ${fontColor === color.value ? 'border-primary scale-110' : 'border-transparent'
                                                            }`}
                                                        style={{ backgroundColor: color.color }}
                                                        title={color.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Background</Label>
                                            <div className="flex gap-1">
                                                {BG_COLORS.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        onClick={() => setBgColor(color.value)}
                                                        className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === color.value ? 'border-primary scale-110' : 'border-muted-foreground/30'
                                                            }`}
                                                        style={{ backgroundColor: color.color }}
                                                        title={color.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Apply Button */}
                                    <Button
                                        onClick={handleAddText}
                                        disabled={isProcessing || !text.trim()}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Adding Text...
                                            </>
                                        ) : (
                                            <>
                                                <Type className="w-4 h-4 mr-2" />
                                                Add Text Overlay
                                            </>
                                        )}
                                    </Button>
                                </TabsContent>

                                {/* Title Card Tab */}
                                <TabsContent value="title" className="space-y-4 mt-4">
                                    {/* Title Input */}
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input
                                            placeholder="Enter title..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="text-lg font-bold"
                                        />
                                    </div>

                                    {/* Subtitle Input */}
                                    <div className="space-y-2">
                                        <Label>Subtitle (optional)</Label>
                                        <Input
                                            placeholder="Enter subtitle..."
                                            value={subtitle}
                                            onChange={(e) => setSubtitle(e.target.value)}
                                        />
                                    </div>

                                    {/* Duration */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Duration</Label>
                                            <span className="text-sm text-muted-foreground">{titleDuration}s</span>
                                        </div>
                                        <Slider
                                            value={[titleDuration]}
                                            min={1}
                                            max={10}
                                            step={0.5}
                                            onValueChange={(v) => setTitleDuration(v[0])}
                                        />
                                    </div>

                                    {/* Position */}
                                    <div className="space-y-2">
                                        <Label>Position</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant={titlePosition === 'start' ? 'default' : 'outline'}
                                                onClick={() => setTitlePosition('start')}
                                                className="gap-2"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                                Start of Video
                                            </Button>
                                            <Button
                                                variant={titlePosition === 'end' ? 'default' : 'outline'}
                                                onClick={() => setTitlePosition('end')}
                                                className="gap-2"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                                End of Video
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Colors */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Title Color</Label>
                                            <Select value={titleColor} onValueChange={setTitleColor}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FONT_COLORS.map((color) => (
                                                        <SelectItem key={color.value} value={color.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-4 h-4 rounded-full border"
                                                                    style={{ backgroundColor: color.color }}
                                                                />
                                                                {color.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Background</Label>
                                            <Select value={titleBgColor} onValueChange={setTitleBgColor}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FONT_COLORS.filter(c => c.value !== 'yellow' && c.value !== 'green').map((color) => (
                                                        <SelectItem key={color.value} value={color.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-4 h-4 rounded-full border"
                                                                    style={{ backgroundColor: color.color }}
                                                                />
                                                                {color.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Apply Button */}
                                    <Button
                                        onClick={handleAddTitleCard}
                                        disabled={isProcessing || !title.trim()}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Adding Title Card...
                                            </>
                                        ) : (
                                            <>
                                                <Film className="w-4 h-4 mr-2" />
                                                Add Title Card
                                            </>
                                        )}
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Type className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-center">Select a video from the library to add text</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
