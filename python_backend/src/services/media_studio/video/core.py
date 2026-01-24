"""
Core Video Utilities
Shared utilities for all video processing operations
"""

import os
import uuid
import json
import shutil
import asyncio
import tempfile
import subprocess
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

import httpx


# Platform video presets - 2025 Official Standards
VIDEO_PLATFORM_PRESETS = {
    # Vertical (9:16) - Short-form video platforms
    "youtube-short": {"width": 1080, "height": 1920, "aspect_ratio": "9:16", "name": "YouTube Shorts", "max_duration": 60},
    "instagram-reel": {"width": 1080, "height": 1920, "aspect_ratio": "9:16", "name": "Instagram Reels", "max_duration": 90},
    "instagram-story": {"width": 1080, "height": 1920, "aspect_ratio": "9:16", "name": "Instagram Story", "max_duration": 60},
    "tiktok": {"width": 1080, "height": 1920, "aspect_ratio": "9:16", "name": "TikTok", "max_duration": 600},
    "facebook-reel": {"width": 1080, "height": 1920, "aspect_ratio": "9:16", "name": "Facebook Reels", "max_duration": 90},
    "twitter-portrait": {"width": 1080, "height": 1920, "aspect_ratio": "9:16", "name": "Twitter/X (Vertical)", "max_duration": 140},
    
    # Square (1:1) - Feed posts
    "instagram-post": {"width": 1080, "height": 1080, "aspect_ratio": "1:1", "name": "Instagram Post (Square)", "max_duration": 60},
    "facebook-post-square": {"width": 1080, "height": 1080, "aspect_ratio": "1:1", "name": "Facebook Post (Square)", "max_duration": 240},
    "linkedin-square": {"width": 1080, "height": 1080, "aspect_ratio": "1:1", "name": "LinkedIn (Square)", "max_duration": 600},
    
    # Portrait (4:5) - Optimized for mobile feed
    "instagram-feed": {"width": 1080, "height": 1350, "aspect_ratio": "4:5", "name": "Instagram Feed (4:5)", "max_duration": 60},
    "facebook-feed": {"width": 1080, "height": 1350, "aspect_ratio": "4:5", "name": "Facebook Feed (4:5)", "max_duration": 240},
    
    # Landscape (16:9) - Traditional video
    "youtube": {"width": 1920, "height": 1080, "aspect_ratio": "16:9", "name": "YouTube (1080p)", "max_duration": None},
    "facebook-post": {"width": 1920, "height": 1080, "aspect_ratio": "16:9", "name": "Facebook (16:9)", "max_duration": 240},
    "twitter": {"width": 1920, "height": 1080, "aspect_ratio": "16:9", "name": "Twitter/X (16:9)", "max_duration": 140},
    "linkedin": {"width": 1920, "height": 1080, "aspect_ratio": "16:9", "name": "LinkedIn (16:9)", "max_duration": 600},
}

# Maximum total duration for merged videos (8 minutes)
MAX_MERGE_DURATION_SECONDS = 480

# Default timeout for video operations
DEFAULT_TIMEOUT_SECONDS = 900


@dataclass
class VideoProbeResult:
    """Result of video probe operation"""
    duration: float
    width: int
    height: int
    has_audio: bool
    fps: float = 30.0
    codec: str = "h264"


def get_ffmpeg_path() -> str:
    """Get FFmpeg executable path"""
    import glob
    
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        return ffmpeg_path
    
    # Common installation paths on Windows
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\Users\Public\ffmpeg\bin\ffmpeg.exe",
    ]
    
    # Add winget installation paths (Gyan.FFmpeg package)
    winget_pattern = os.path.expandvars(
        r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\ffmpeg-*\bin\ffmpeg.exe"
    )
    common_paths.extend(glob.glob(winget_pattern))
    
    for path in common_paths:
        if os.path.exists(path):
            return path
    raise RuntimeError("FFmpeg not found. Please install FFmpeg and add it to PATH.")


def get_ffprobe_path() -> str:
    """Get FFprobe executable path"""
    import glob
    
    ffprobe_path = shutil.which("ffprobe")
    if ffprobe_path:
        return ffprobe_path
    
    common_paths = [
        r"C:\ffmpeg\bin\ffprobe.exe",
        r"C:\Program Files\ffmpeg\bin\ffprobe.exe",
        r"C:\Users\Public\ffprobe\bin\ffprobe.exe",
    ]
    
    # Add winget installation paths (Gyan.FFmpeg package)
    winget_pattern = os.path.expandvars(
        r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\ffmpeg-*\bin\ffprobe.exe"
    )
    common_paths.extend(glob.glob(winget_pattern))
    
    for path in common_paths:
        if os.path.exists(path):
            return path
    raise RuntimeError("FFprobe not found. Please install FFmpeg and add it to PATH.")


async def download_video(url: str, timeout: float = 180.0) -> bytes:
    """Download video from URL"""
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise ValueError(f"Failed to download video: HTTP {response.status_code}")
        return response.content


async def probe_video(file_path: str) -> VideoProbeResult:
    """Probe video file to get metadata using FFprobe"""
    ffprobe_path = get_ffprobe_path()
    
    args = [
        ffprobe_path,
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        file_path
    ]
    
    loop = asyncio.get_event_loop()
    
    def run_ffprobe():
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.stdout, result.stderr, result.returncode
    
    stdout, stderr, returncode = await loop.run_in_executor(None, run_ffprobe)
    
    if returncode != 0:
        raise RuntimeError(f"FFprobe failed: {stderr}")
    
    data = json.loads(stdout)
    
    # Find video and audio streams
    video_stream = None
    audio_stream = None
    for stream in data.get("streams", []):
        if stream.get("codec_type") == "video" and not video_stream:
            video_stream = stream
        elif stream.get("codec_type") == "audio" and not audio_stream:
            audio_stream = stream
    
    duration = float(data.get("format", {}).get("duration", 0))
    if not duration and video_stream:
        duration = float(video_stream.get("duration", 0))
    
    # Get FPS
    fps = 30.0
    if video_stream:
        fps_str = video_stream.get("r_frame_rate", "30/1")
        try:
            if "/" in fps_str:
                num, den = fps_str.split("/")
                fps = float(num) / float(den)
            else:
                fps = float(fps_str)
        except (ValueError, ZeroDivisionError):
            fps = 30.0
    
    return VideoProbeResult(
        duration=duration,
        width=video_stream.get("width", 1920) if video_stream else 1920,
        height=video_stream.get("height", 1080) if video_stream else 1080,
        has_audio=audio_stream is not None,
        fps=fps,
        codec=video_stream.get("codec_name", "h264") if video_stream else "h264"
    )


def create_temp_dir(prefix: str = "video-process") -> Path:
    """Create a temporary directory for video processing"""
    temp_dir = Path(tempfile.gettempdir()) / f"{prefix}-{uuid.uuid4()}"
    temp_dir.mkdir(parents=True, exist_ok=True)
    return temp_dir


def cleanup_temp_dir(temp_dir: Path) -> None:
    """Clean up temporary directory"""
    try:
        shutil.rmtree(temp_dir)
    except Exception:
        pass


async def run_ffmpeg(
    args: list[str],
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS
) -> tuple[int, str, str]:
    """Run FFmpeg command asynchronously"""
    loop = asyncio.get_event_loop()
    
    def run():
        try:
            result = subprocess.run(
                args,
                capture_output=True,
                text=True,
                timeout=timeout_seconds
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return -1, "", "Process timed out"
    
    return await loop.run_in_executor(None, run)


def get_presets() -> list[dict]:
    """Get all available platform presets"""
    return [
        {"id": key, **value}
        for key, value in VIDEO_PLATFORM_PRESETS.items()
    ]


def get_preset(platform: str) -> Optional[dict]:
    """Get a specific platform preset"""
    return VIDEO_PLATFORM_PRESETS.get(platform)


def format_time(seconds: float) -> str:
    """Format seconds to HH:MM:SS.mmm format for FFmpeg"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"


def parse_time(time_str: str) -> float:
    """Parse time string to seconds (supports HH:MM:SS.mmm or seconds)"""
    if isinstance(time_str, (int, float)):
        return float(time_str)
    
    try:
        return float(time_str)
    except ValueError:
        pass
    
    parts = time_str.split(":")
    if len(parts) == 3:
        hours, minutes, seconds = parts
        return float(hours) * 3600 + float(minutes) * 60 + float(seconds)
    elif len(parts) == 2:
        minutes, seconds = parts
        return float(minutes) * 60 + float(seconds)
    else:
        raise ValueError(f"Invalid time format: {time_str}")
