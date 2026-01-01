"""
Video Trimmer Service
Trim videos to specific start/end times
"""

from dataclasses import dataclass
from pathlib import Path

from .core import (
    get_ffmpeg_path,
    download_video,
    probe_video,
    create_temp_dir,
    cleanup_temp_dir,
    run_ffmpeg,
    format_time,
    parse_time,
)


@dataclass
class VideoTrimResult:
    """Result of video trim operation"""
    buffer: bytes
    duration: float
    start_time: float
    end_time: float
    file_size: int


class VideoTrimmer:
    """Video trimming service using FFmpeg"""
    
    @classmethod
    async def trim_video(
        cls,
        video_url: str,
        start_time: float | str,
        end_time: float | str,
        reencode: bool = False,
        timeout_seconds: int = 300
    ) -> VideoTrimResult:
        """
        Trim video to specific start and end times.
        
        Args:
            video_url: URL of the source video
            start_time: Start time in seconds or HH:MM:SS format
            end_time: End time in seconds or HH:MM:SS format
            reencode: If True, re-encode for frame-accurate cutting (slower but more precise)
            timeout_seconds: Processing timeout
            
        Returns:
            VideoTrimResult with trimmed video buffer
        """
        ffmpeg_path = get_ffmpeg_path()
        temp_dir = create_temp_dir("video-trim")
        
        input_path = temp_dir / "input.mp4"
        output_path = temp_dir / "output.mp4"
        
        try:
            # Download video
            video_data = await download_video(video_url)
            input_path.write_bytes(video_data)
            
            # Probe video to get duration
            probe = await probe_video(str(input_path))
            
            # Parse times
            start_sec = parse_time(start_time) if isinstance(start_time, str) else float(start_time)
            end_sec = parse_time(end_time) if isinstance(end_time, str) else float(end_time)
            
            # Validate times
            if start_sec < 0:
                start_sec = 0
            if end_sec > probe.duration:
                end_sec = probe.duration
            if start_sec >= end_sec:
                raise ValueError(f"Start time ({start_sec}s) must be less than end time ({end_sec}s)")
            
            duration = end_sec - start_sec
            
            if reencode:
                # Frame-accurate cutting with re-encoding
                args = [
                    ffmpeg_path,
                    "-y",
                    "-ss", str(start_sec),
                    "-i", str(input_path),
                    "-t", str(duration),
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "20",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
            else:
                # Fast cutting without re-encoding (may not be frame-accurate)
                args = [
                    ffmpeg_path,
                    "-y",
                    "-ss", str(start_sec),
                    "-i", str(input_path),
                    "-t", str(duration),
                    "-c", "copy",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
            
            returncode, stdout, stderr = await run_ffmpeg(args, timeout_seconds)
            
            if returncode != 0:
                # Fallback to re-encoding if copy fails
                fallback_args = [
                    ffmpeg_path,
                    "-y",
                    "-ss", str(start_sec),
                    "-i", str(input_path),
                    "-t", str(duration),
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "22",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
                
                returncode, stdout, stderr = await run_ffmpeg(fallback_args, timeout_seconds)
                
                if returncode != 0:
                    raise RuntimeError(f"Failed to trim video: {stderr[-500:] if stderr else 'Unknown error'}")
            
            # Read output
            output_buffer = output_path.read_bytes()
            
            return VideoTrimResult(
                buffer=output_buffer,
                duration=duration,
                start_time=start_sec,
                end_time=end_sec,
                file_size=len(output_buffer)
            )
            
        finally:
            cleanup_temp_dir(temp_dir)
    
    @classmethod
    async def split_video(
        cls,
        video_url: str,
        segments: list[tuple[float, float]],
        timeout_seconds: int = 600
    ) -> list[VideoTrimResult]:
        """
        Split video into multiple segments.
        
        Args:
            video_url: URL of the source video
            segments: List of (start_time, end_time) tuples
            
        Returns:
            List of VideoTrimResult for each segment
        """
        results = []
        for start, end in segments:
            result = await cls.trim_video(video_url, start, end, timeout_seconds=timeout_seconds)
            results.append(result)
        return results
