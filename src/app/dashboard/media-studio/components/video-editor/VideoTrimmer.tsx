'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    Video,
    Scissors,
    Clock,
    Play,
    Pause,
    RotateCcw,
    Check,
    AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { VideoItem } from './types';

interface VideoTrimmerProps {
    libraryVideos: VideoItem[];
    isLoadingLibrary: boolean;
    onTrimComplete: (videoUrl: string) => void;
}

export function VideoTrimmer({ libraryVideos, isLoadingLibrary, onTrimComplete }: VideoTrimmerProps) {
    const { workspaceId } = useAuth();
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
    const [isTrimming, setIsTrimming] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [reEncode, setReEncode] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    const handleVideoSelect = (video: VideoItem) => {
        setSelectedVideo(video);
        setStartTime(0);
        setEndTime(video.duration || 0);
        setCurrentTime(0);
        setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current && selectedVideo) {
            const duration = videoRef.current.duration;
            setEndTime(duration);
        }
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.currentTime = startTime;
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (value: number[]) => {
        if (videoRef.current) {
            const time = value[0];
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleReset = () => {
        if (selectedVideo) {
            setStartTime(0);
            setEndTime(selectedVideo.duration || 0);
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                setCurrentTime(0);
            }
        }
    };

    const handleTrim = async () => {
        if (!selectedVideo || !workspaceId) {
            toast.error('Please select a video first');
            return;
        }

        if (startTime >= endTime) {
            toast.error('Start time must be less than end time');
            return;
        }

        setIsTrimming(true);
        const trimDuration = endTime - startTime;
        const loadingToast = toast.loading(
            `Trimming video to ${formatTime(trimDuration)}... Please wait`,
            { duration: Infinity }
        );

        try {
            const response = await fetch('/api/media-studio/trim-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    videoUrl: selectedVideo.url,
                    startTime,
                    endTime,
                    reencode: reEncode,
                }),
            });

            toast.dismiss(loadingToast);

            if (response.ok) {
                const data = await response.json();
                toast.success(`Video trimmed to ${formatTime(data.duration)}!`);
                onTrimComplete(data.url);
                setSelectedVideo(null);
            } else {
                const error = await response.json();
                toast.error(error.detail?.error || 'Failed to trim video');
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to trim video');
            console.error(error);
        } finally {
            setIsTrimming(false);
        }
    };

    const trimDuration = endTime - startTime;

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
                        Choose a video from your library to trim
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

            {/* Trim Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scissors className="w-5 h-5" />
                        Trim Video
                    </CardTitle>
                    <CardDescription>
                        Set start and end points to trim your video
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
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onEnded={() => setIsPlaying(false)}
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
                                        <span className="text-white text-sm font-mono">
                                            {formatTime(currentTime)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Slider */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Start: {formatTime(startTime)}</span>
                                        <span className="text-muted-foreground">End: {formatTime(endTime)}</span>
                                    </div>

                                    {/* Start Time Slider */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Start Point</Label>
                                        <Slider
                                            value={[startTime]}
                                            min={0}
                                            max={endTime - 0.1}
                                            step={0.1}
                                            onValueChange={(v) => setStartTime(v[0])}
                                            className="cursor-pointer"
                                        />
                                    </div>

                                    {/* End Time Slider */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">End Point</Label>
                                        <Slider
                                            value={[endTime]}
                                            min={startTime + 0.1}
                                            max={selectedVideo.duration || 60}
                                            step={0.1}
                                            onValueChange={(v) => setEndTime(v[0])}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Duration Info */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <span className="text-sm">Trimmed Duration:</span>
                                    <Badge variant={trimDuration < 1 ? 'destructive' : 'default'}>
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatTime(trimDuration)}
                                    </Badge>
                                </div>

                                {/* Options */}
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Frame-accurate trim</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Re-encode for precise cuts (slower)
                                        </p>
                                    </div>
                                    <Switch
                                        checked={reEncode}
                                        onCheckedChange={setReEncode}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                        className="flex-1"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={handleTrim}
                                        disabled={isTrimming || trimDuration < 0.5}
                                        className="flex-1"
                                    >
                                        {isTrimming ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Trimming...
                                            </>
                                        ) : (
                                            <>
                                                <Scissors className="w-4 h-4 mr-2" />
                                                Trim Video
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Scissors className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-center">Select a video from the library to start trimming</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
