"""
Video Resizer Service
Resize videos for different social media platforms
"""

from dataclasses import dataclass
from pathlib import Path

from .core import (
    VideoProbeResult,
    get_ffmpeg_path,
    download_video,
    probe_video,
    create_temp_dir,
    cleanup_temp_dir,
    run_ffmpeg,
    VIDEO_PLATFORM_PRESETS,
    get_presets,
    get_preset,
)


@dataclass
class VideoResizeResult:
    """Result of video resize operation"""
    buffer: bytes
    duration: float
    width: int
    height: int
    file_size: int


class VideoResizer:
    """Video resizing service using FFmpeg"""
    
    @staticmethod
    def get_presets() -> list[dict]:
        """Get all available platform presets"""
        return get_presets()
    
    @staticmethod
    def get_preset(platform: str) -> dict | None:
        """Get a specific platform preset"""
        return get_preset(platform)
    
    @classmethod
    async def resize_video(
        cls,
        video_url: str,
        target_width: int,
        target_height: int,
        timeout_seconds: int = 300
    ) -> VideoResizeResult:
        """
        Resize video to target dimensions using FFmpeg.
        Uses high quality settings: CRF 18, medium preset, H.264 High Profile.
        """
        ffmpeg_path = get_ffmpeg_path()
        temp_dir = create_temp_dir("video-resize")
        
        input_path = temp_dir / "input.mp4"
        output_path = temp_dir / "output.mp4"
        
        try:
            # Download video
            video_data = await download_video(video_url)
            input_path.write_bytes(video_data)
            
            # Get input duration
            probe = await probe_video(str(input_path))
            
            # Video filter: scale and crop to fill frame (no black bars)
            video_filter = (
                f"scale={target_width}:{target_height}:"
                f"force_original_aspect_ratio=increase,"
                f"crop={target_width}:{target_height},"
                f"setsar=1,format=yuv420p"
            )
            
            # Build FFmpeg command with high quality settings
            args = [
                ffmpeg_path,
                "-y",
                "-threads", "0",
                "-i", str(input_path),
                "-vf", video_filter,
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "18",
                "-profile:v", "high",
                "-level", "4.1",
                "-c:a", "aac",
                "-ar", "44100",
                "-ac", "2",
                "-b:a", "256k",
                "-movflags", "+faststart",
                str(output_path)
            ]
            
            returncode, stdout, stderr = await run_ffmpeg(args, timeout_seconds)
            
            # If failed (possibly no audio), try with silent audio
            if returncode != 0:
                args_silent = [
                    ffmpeg_path,
                    "-y",
                    "-threads", "0",
                    "-i", str(input_path),
                    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                    "-vf", video_filter,
                    "-map", "0:v",
                    "-map", "1:a",
                    "-c:v", "libx264",
                    "-preset", "medium",
                    "-crf", "18",
                    "-profile:v", "high",
                    "-level", "4.1",
                    "-c:a", "aac",
                    "-b:a", "256k",
                    "-movflags", "+faststart",
                    "-shortest",
                    str(output_path)
                ]
                
                returncode, stdout, stderr = await run_ffmpeg(args_silent, timeout_seconds)
                
                if returncode != 0:
                    raise RuntimeError(f"FFmpeg failed: {stderr[-500:] if stderr else 'Unknown error'}")
            
            # Read output
            output_buffer = output_path.read_bytes()
            
            return VideoResizeResult(
                buffer=output_buffer,
                duration=probe.duration,
                width=target_width,
                height=target_height,
                file_size=len(output_buffer)
            )
            
        finally:
            cleanup_temp_dir(temp_dir)
    
    @classmethod
    async def resize_for_platform(
        cls,
        video_url: str,
        platform: str | None = None,
        custom_width: int | None = None,
        custom_height: int | None = None
    ) -> tuple[VideoResizeResult, str]:
        """
        Resize video for a specific platform or custom dimensions.
        Returns tuple of (result, platform_name)
        """
        if platform and platform in VIDEO_PLATFORM_PRESETS:
            preset = VIDEO_PLATFORM_PRESETS[platform]
            target_width = preset["width"]
            target_height = preset["height"]
            platform_name = preset["name"]
        elif custom_width and custom_height:
            target_width = custom_width
            target_height = custom_height
            platform_name = f"Custom ({custom_width}x{custom_height})"
        else:
            raise ValueError("Either platform or custom dimensions required")
        
        result = await cls.resize_video(video_url, target_width, target_height)
        return result, platform_name
