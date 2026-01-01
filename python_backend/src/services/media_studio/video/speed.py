"""
Video Speed Service
Change video playback speed (slow-mo and fast-forward)
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from .core import (
    get_ffmpeg_path,
    download_video,
    probe_video,
    create_temp_dir,
    cleanup_temp_dir,
    run_ffmpeg,
)


# Predefined speed presets
SPEED_PRESETS = {
    "0.25x": 0.25,   # Super slow-mo
    "0.5x": 0.5,     # Slow-mo
    "0.75x": 0.75,   # Slightly slow
    "1x": 1.0,       # Normal
    "1.25x": 1.25,   # Slightly fast
    "1.5x": 1.5,     # Fast
    "2x": 2.0,       # 2x speed
    "3x": 3.0,       # 3x speed
    "4x": 4.0,       # 4x speed
}


@dataclass
class SpeedResult:
    """Result of speed change operation"""
    buffer: bytes
    original_duration: float
    new_duration: float
    speed_factor: float
    file_size: int


class SpeedService:
    """Video speed adjustment service using FFmpeg"""
    
    @staticmethod
    def get_presets() -> list[dict]:
        """Get available speed presets"""
        return [
            {"id": key, "factor": value, "name": key}
            for key, value in SPEED_PRESETS.items()
        ]
    
    @classmethod
    async def change_speed(
        cls,
        video_url: str,
        speed_factor: float,
        maintain_pitch: bool = True,
        timeout_seconds: int = 600
    ) -> SpeedResult:
        """
        Change video playback speed.
        
        Args:
            video_url: URL of the source video
            speed_factor: Speed multiplier (0.25 = 4x slower, 2.0 = 2x faster)
            maintain_pitch: If True, maintain audio pitch (uses atempo filter)
            timeout_seconds: Processing timeout
            
        Returns:
            SpeedResult with speed-adjusted video
        """
        if speed_factor <= 0:
            raise ValueError("Speed factor must be positive")
        if speed_factor < 0.25 or speed_factor > 4.0:
            raise ValueError("Speed factor must be between 0.25 and 4.0")
        
        ffmpeg_path = get_ffmpeg_path()
        temp_dir = create_temp_dir("video-speed")
        
        input_path = temp_dir / "input.mp4"
        output_path = temp_dir / "output.mp4"
        
        try:
            # Download video
            video_data = await download_video(video_url)
            input_path.write_bytes(video_data)
            
            # Probe video
            probe = await probe_video(str(input_path))
            
            original_duration = probe.duration
            new_duration = original_duration / speed_factor
            
            # Build video filter
            # setpts=PTS/speed_factor for speed adjustment
            pts_factor = 1.0 / speed_factor
            video_filter = f"setpts={pts_factor}*PTS"
            
            # Build audio filter
            # atempo only works between 0.5 and 2.0, so we chain them for extreme speeds
            audio_filters = cls._build_atempo_chain(speed_factor)
            
            if probe.has_audio and maintain_pitch:
                args = [
                    ffmpeg_path,
                    "-y",
                    "-i", str(input_path),
                    "-filter_complex", f"[0:v]{video_filter}[v];[0:a]{audio_filters}[a]",
                    "-map", "[v]",
                    "-map", "[a]",
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "22",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
            elif probe.has_audio:
                # Don't maintain pitch - just adjust with video
                args = [
                    ffmpeg_path,
                    "-y",
                    "-i", str(input_path),
                    "-vf", video_filter,
                    "-af", f"asetrate=44100*{speed_factor},aresample=44100",
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "22",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
            else:
                # No audio
                args = [
                    ffmpeg_path,
                    "-y",
                    "-i", str(input_path),
                    "-vf", video_filter,
                    "-an",
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "22",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
            
            returncode, stdout, stderr = await run_ffmpeg(args, timeout_seconds)
            
            if returncode != 0:
                raise RuntimeError(f"Failed to change speed: {stderr[-500:] if stderr else 'Unknown error'}")
            
            output_buffer = output_path.read_bytes()
            
            return SpeedResult(
                buffer=output_buffer,
                original_duration=original_duration,
                new_duration=new_duration,
                speed_factor=speed_factor,
                file_size=len(output_buffer)
            )
            
        finally:
            cleanup_temp_dir(temp_dir)
    
    @staticmethod
    def _build_atempo_chain(speed_factor: float) -> str:
        """
        Build atempo filter chain for extreme speeds.
        atempo only works between 0.5 and 2.0, so we chain them.
        """
        if 0.5 <= speed_factor <= 2.0:
            return f"atempo={speed_factor}"
        
        filters = []
        remaining = speed_factor
        
        if speed_factor > 2.0:
            # Speed up: chain multiple atempo=2.0
            while remaining > 2.0:
                filters.append("atempo=2.0")
                remaining /= 2.0
            if remaining > 1.0:
                filters.append(f"atempo={remaining}")
        else:
            # Slow down: chain multiple atempo=0.5
            while remaining < 0.5:
                filters.append("atempo=0.5")
                remaining /= 0.5
            if remaining < 1.0:
                filters.append(f"atempo={remaining}")
        
        return ",".join(filters) if filters else "atempo=1.0"
    
    @classmethod
    async def reverse_video(
        cls,
        video_url: str,
        reverse_audio: bool = True,
        timeout_seconds: int = 600
    ) -> SpeedResult:
        """
        Reverse video playback.
        
        Args:
            video_url: URL of the source video
            reverse_audio: If True, also reverse audio
            
        Returns:
            SpeedResult with reversed video
        """
        ffmpeg_path = get_ffmpeg_path()
        temp_dir = create_temp_dir("video-reverse")
        
        input_path = temp_dir / "input.mp4"
        output_path = temp_dir / "output.mp4"
        
        try:
            # Download video
            video_data = await download_video(video_url)
            input_path.write_bytes(video_data)
            
            # Probe video
            probe = await probe_video(str(input_path))
            
            if probe.has_audio and reverse_audio:
                args = [
                    ffmpeg_path,
                    "-y",
                    "-i", str(input_path),
                    "-vf", "reverse",
                    "-af", "areverse",
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "22",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
            else:
                args = [
                    ffmpeg_path,
                    "-y",
                    "-i", str(input_path),
                    "-vf", "reverse",
                    "-an",
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "22",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
            
            returncode, stdout, stderr = await run_ffmpeg(args, timeout_seconds)
            
            if returncode != 0:
                raise RuntimeError(f"Failed to reverse video: {stderr[-500:] if stderr else 'Unknown error'}")
            
            output_buffer = output_path.read_bytes()
            
            return SpeedResult(
                buffer=output_buffer,
                original_duration=probe.duration,
                new_duration=probe.duration,
                speed_factor=-1.0,  # Negative indicates reversal
                file_size=len(output_buffer)
            )
            
        finally:
            cleanup_temp_dir(temp_dir)
