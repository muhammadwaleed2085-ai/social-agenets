'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    Video,
    Gauge,
    Clock,
    Play,
    Pause,
    Check,
    Zap,
    Snail,
    Timer,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { VideoItem } from './types';

interface SpeedControllerProps {
    libraryVideos: VideoItem[];
    isLoadingLibrary: boolean;
    onSpeedComplete: (videoUrl: string) => void;
}

const SPEED_PRESETS = [
    { value: '0.25', label: '0.25x', description: 'Super Slow-mo', icon: Snail },
    { value: '0.5', label: '0.5x', description: 'Slow-mo', icon: Snail },
    { value: '0.75', label: '0.75x', description: 'Slightly Slow', icon: Timer },
    { value: '1', label: '1x', description: 'Normal', icon: Play },
    { value: '1.25', label: '1.25x', description: 'Slightly Fast', icon: Timer },
    { value: '1.5', label: '1.5x', description: 'Fast', icon: Zap },
    { value: '2', label: '2x', description: 'Double Speed', icon: Zap },
    { value: '3', label: '3x', description: 'Triple Speed', icon: Gauge },
    { value: '4', label: '4x', description: 'Maximum Speed', icon: Gauge },
];

export function SpeedController({ libraryVideos, isLoadingLibrary, onSpeedComplete }: SpeedControllerProps) {
    const { workspaceId } = useAuth();
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedSpeed, setSelectedSpeed] = useState('1');
    const [maintainPitch, setMaintainPitch] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVideoSelect = (video: VideoItem) => {
        setSelectedVideo(video);
        setIsPlaying(false);
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.playbackRate = parseFloat(selectedSpeed);
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = parseFloat(selectedSpeed);
        }
    }, [selectedSpeed]);

    const calculateNewDuration = () => {
        if (!selectedVideo?.duration) return 0;
        return selectedVideo.duration / parseFloat(selectedSpeed);
    };

    const handleApplySpeed = async () => {
        if (!selectedVideo || !workspaceId) {
            toast.error('Please select a video first');
            return;
        }

        if (selectedSpeed === '1') {
            toast.error('Select a speed other than 1x to apply changes');
            return;
        }

        setIsProcessing(true);
        const newDuration = calculateNewDuration();
        const loadingToast = toast.loading(
            `Applying ${selectedSpeed}x speed... New duration: ${formatTime(newDuration)}`,
            { duration: Infinity }
        );

        try {
            const response = await fetch('/api/media-studio/change-speed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    videoUrl: selectedVideo.url,
                    speed: parseFloat(selectedSpeed),
                    maintainPitch,
                }),
            });

            toast.dismiss(loadingToast);

            if (response.ok) {
                const data = await response.json();
                toast.success(`Speed adjusted to ${selectedSpeed}x! New duration: ${formatTime(data.newDuration)}`);
                onSpeedComplete(data.url);
                setSelectedVideo(null);
                setSelectedSpeed('1');
            } else {
                const error = await response.json();
                toast.error(error.detail?.error || 'Failed to adjust speed');
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to adjust speed');
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const selectedPreset = SPEED_PRESETS.find(p => p.value === selectedSpeed);
    const SpeedIcon = selectedPreset?.icon || Play;

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
                        Choose a video to adjust its playback speed
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

            {/* Speed Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gauge className="w-5 h-5" />
                        Speed Control
                    </CardTitle>
                    <CardDescription>
                        Speed up or slow down your video
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {selectedVideo ? (
                        <>
                            {/* Video Preview */}
                            <div className="relative rounded-lg overflow-hidden bg-black">
                                <video
                                    ref={videoRef}
                                    src={selectedVideo.url}
                                    className="w-full aspect-video object-contain"
                                    onEnded={() => setIsPlaying(false)}
                                    muted
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handlePlayPause}
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-4 h-4" />
                                            ) : (
                                                <Play className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Badge variant="outline" className="text-white border-white/50">
                                            Preview at {selectedSpeed}x
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Speed Selector */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Playback Speed</Label>
                                    <Select value={selectedSpeed} onValueChange={setSelectedSpeed}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue>
                                                <div className="flex items-center gap-2">
                                                    <SpeedIcon className="w-4 h-4" />
                                                    {selectedPreset?.label} - {selectedPreset?.description}
                                                </div>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SPEED_PRESETS.map((preset) => {
                                                const Icon = preset.icon;
                                                return (
                                                    <SelectItem key={preset.value} value={preset.value}>
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="w-4 h-4" />
                                                            <span className="font-medium">{preset.label}</span>
                                                            <span className="text-muted-foreground">- {preset.description}</span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Speed Preview Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    {SPEED_PRESETS.filter(p => ['0.5', '1', '2'].includes(p.value)).map((preset) => {
                                        const Icon = preset.icon;
                                        return (
                                            <Button
                                                key={preset.value}
                                                variant={selectedSpeed === preset.value ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedSpeed(preset.value)}
                                                className="flex flex-col h-auto py-3"
                                            >
                                                <Icon className="w-5 h-5 mb-1" />
                                                <span className="text-lg font-bold">{preset.label}</span>
                                            </Button>
                                        );
                                    })}
                                </div>

                                {/* Duration Info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground mb-1">Original</p>
                                        <Badge variant="outline">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatTime(selectedVideo.duration || 0)}
                                        </Badge>
                                    </div>
                                    <div className="p-3 bg-primary/10 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground mb-1">New Duration</p>
                                        <Badge variant="default">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatTime(calculateNewDuration())}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Maintain Audio Pitch</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Keep natural voice/audio pitch when changing speed
                                        </p>
                                    </div>
                                    <Switch
                                        checked={maintainPitch}
                                        onCheckedChange={setMaintainPitch}
                                    />
                                </div>

                                {/* Apply Button */}
                                <Button
                                    onClick={handleApplySpeed}
                                    disabled={isProcessing || selectedSpeed === '1'}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Applying Speed...
                                        </>
                                    ) : (
                                        <>
                                            <Gauge className="w-4 h-4 mr-2" />
                                            Apply {selectedSpeed}x Speed
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Gauge className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-center">Select a video from the library to adjust speed</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
