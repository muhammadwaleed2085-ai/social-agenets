"""
Video Merger Service
Merge multiple videos with optional transitions
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Optional

from .core import (
    VideoProbeResult,
    get_ffmpeg_path,
    download_video,
    probe_video,
    create_temp_dir,
    cleanup_temp_dir,
    run_ffmpeg,
    MAX_MERGE_DURATION_SECONDS,
)


@dataclass
class VideoMergeResult:
    """Result of video merge operation"""
    buffer: bytes
    total_duration: float
    is_vertical: bool
    output_width: int
    output_height: int
    file_size: int


class VideoMerger:
    """Video merging service using FFmpeg"""
    
    @classmethod
    async def merge_videos(
        cls,
        video_urls: list[str],
        resolution: Literal["original", "720p", "1080p"] = "720p",
        quality: Literal["draft", "high"] = "draft",
        transition: Optional[str] = None,
        transition_duration: float = 1.0,
        timeout_seconds: int = 600
    ) -> VideoMergeResult:
        """
        Merge multiple videos into one using FFmpeg.
        Features:
        - Audio normalization (loudnorm) for consistent volume
        - Auto-detection of vertical content
        - 5-minute duration limit
        - High quality encoding
        - Optional transitions between clips
        """
        if len(video_urls) < 2:
            raise ValueError("At least 2 videos are required for merging")
        
        ffmpeg_path = get_ffmpeg_path()
        temp_dir = create_temp_dir("video-merge")
        
        downloaded_files: list[Path] = []
        normalized_files: list[Path] = []
        
        # Quality settings
        is_high_quality = quality == "high"
        preset = "slow" if is_high_quality else "fast"
        crf = "18" if is_high_quality else "24"
        audio_bitrate = "256k" if is_high_quality else "128k"
        
        try:
            # 1. Download all videos
            for i, url in enumerate(video_urls):
                video_data = await download_video(url)
                if not video_data:
                    raise ValueError(f"Video {i + 1} is empty")
                file_path = temp_dir / f"input-{i}.mp4"
                file_path.write_bytes(video_data)
                downloaded_files.append(file_path)
            
            # 2. Probe all videos
            probes: list[VideoProbeResult] = []
            total_duration = 0.0
            vertical_count = 0
            horizontal_count = 0
            
            for i, file_path in enumerate(downloaded_files):
                probe = await probe_video(str(file_path))
                probes.append(probe)
                total_duration += probe.duration
                
                if probe.height > probe.width:
                    vertical_count += 1
                else:
                    horizontal_count += 1
            
            # 3. Check duration limit
            if total_duration > MAX_MERGE_DURATION_SECONDS:
                raise ValueError(
                    f"Total duration ({int(total_duration)}s) exceeds the 5-minute limit. "
                    "Please remove some clips."
                )
            
            # 4. Determine output orientation
            is_vertical = vertical_count > horizontal_count
            
            # 5. Determine output resolution
            max_width = max(probe.width for probe in probes)
            max_height = max(probe.height for probe in probes)
            output_width = max_width
            output_height = max_height
            
            if resolution == "720p":
                if output_width > 1280 or output_height > 720:
                    if is_vertical:
                        output_width, output_height = 720, 1280
                    else:
                        output_width, output_height = 1280, 720
            elif resolution == "1080p":
                if output_width > 1920 or output_height > 1080:
                    if is_vertical:
                        output_width, output_height = 1080, 1920
                    else:
                        output_width, output_height = 1920, 1080
            
            # Scale filter with padding for consistent dimensions
            scale_filter = (
                f"scale={output_width}:{output_height}:"
                f"force_original_aspect_ratio=decrease,"
                f"pad={output_width}:{output_height}:(ow-iw)/2:(oh-ih)/2:black,"
                f"setsar=1"
            )
            
            # 6. Normalize each video
            for i, (file_path, probe) in enumerate(zip(downloaded_files, probes)):
                normalized_path = temp_dir / f"normalized-{i}.mp4"
                
                video_filter = f"{scale_filter},fps=30,format=yuv420p"
                audio_filter = (
                    "aresample=44100,"
                    "aformat=sample_fmts=fltp:channel_layouts=stereo"
                )
                
                if probe.has_audio:
                    args = [
                        ffmpeg_path, "-y", "-threads", "0",
                        "-i", str(file_path),
                        "-filter_complex", f"[0:v]{video_filter}[v];[0:a]{audio_filter}[a]",
                        "-map", "[v]", "-map", "[a]",
                        "-c:v", "libx264",
                        "-preset", preset,
                        "-crf", crf,
                        "-profile:v", "high",
                        "-level", "4.1",
                        "-c:a", "aac",
                        "-b:a", audio_bitrate,
                        "-ar", "44100",
                        "-ac", "2",
                        "-movflags", "+faststart",
                        str(normalized_path)
                    ]
                else:
                    # Add silent audio
                    args = [
                        ffmpeg_path, "-y", "-threads", "0",
                        "-i", str(file_path),
                        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                        "-filter_complex", f"[0:v]{video_filter}[v]",
                        "-map", "[v]", "-map", "1:a",
                        "-c:v", "libx264",
                        "-preset", preset,
                        "-crf", crf,
                        "-profile:v", "high",
                        "-level", "4.1",
                        "-c:a", "aac",
                        "-b:a", audio_bitrate,
                        "-ar", "44100",
                        "-ac", "2",
                        "-shortest",
                        "-movflags", "+faststart",
                        str(normalized_path)
                    ]
                
                returncode, stdout, stderr = await run_ffmpeg(args, timeout_seconds)
                
                if returncode != 0:
                    raise RuntimeError(f"Failed to normalize video {i + 1}: {stderr[-500:]}")
                
                normalized_files.append(normalized_path)
            
            # 7. Merge with or without transitions
            output_path = temp_dir / "output.mp4"
            
            if transition and len(normalized_files) > 1:
                # Use xfade for transitions
                output_path = await cls._merge_with_transitions(
                    normalized_files, output_path, transition, transition_duration, 
                    ffmpeg_path, timeout_seconds
                )
            else:
                # Simple concatenation
                concat_path = temp_dir / "concat.txt"
                concat_content = "\n".join(
                    f"file '{f.as_posix()}'" for f in normalized_files
                )
                concat_path.write_text(concat_content)
                
                concat_args = [
                    ffmpeg_path, "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", str(concat_path),
                    "-c:v", "libx264",
                    "-preset", preset,
                    "-crf", crf,
                    "-profile:v", "high",
                    "-level", "4.1",
                    "-c:a", "aac",
                    "-b:a", audio_bitrate,
                    "-ar", "44100",
                    "-ac", "2",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
                
                returncode, stdout, stderr = await run_ffmpeg(concat_args, timeout_seconds)
                
                if returncode != 0:
                    raise RuntimeError(f"Video concatenation failed: {stderr[-500:]}")
            
            # 8. Read output
            output_buffer = output_path.read_bytes()
            
            return VideoMergeResult(
                buffer=output_buffer,
                total_duration=total_duration,
                is_vertical=is_vertical,
                output_width=output_width,
                output_height=output_height,
                file_size=len(output_buffer)
            )
            
        finally:
            cleanup_temp_dir(temp_dir)
    
    @classmethod
    async def _merge_with_transitions(
        cls,
        video_files: list[Path],
        output_path: Path,
        transition: str,
        duration: float,
        ffmpeg_path: str,
        timeout_seconds: int
    ) -> Path:
        """Merge videos with xfade transitions"""
        from .transitions import TransitionService
        
        # Use the transition service to build the filter
        filter_complex, num_videos = TransitionService.build_xfade_filter(
            len(video_files), transition, duration
        )
        
        # Build input arguments
        input_args = []
        for f in video_files:
            input_args.extend(["-i", str(f)])
        
        args = [
            ffmpeg_path, "-y",
            *input_args,
            "-filter_complex", filter_complex,
            "-map", "[vout]",
            "-map", "[aout]",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            str(output_path)
        ]
        
        returncode, stdout, stderr = await run_ffmpeg(args, timeout_seconds)
        
        if returncode != 0:
            # Fallback to simple concat
            temp_dir = output_path.parent
            concat_path = temp_dir / "concat.txt"
            concat_content = "\n".join(
                f"file '{f.as_posix()}'" for f in video_files
            )
            concat_path.write_text(concat_content)
            
            concat_args = [
                ffmpeg_path, "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", str(concat_path),
                "-c", "copy",
                "-movflags", "+faststart",
                str(output_path)
            ]
            
            returncode, stdout, stderr = await run_ffmpeg(concat_args, timeout_seconds)
            if returncode != 0:
                raise RuntimeError(f"Failed to merge videos: {stderr[-500:]}")
        
        return output_path
