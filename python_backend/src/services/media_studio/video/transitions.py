"""
Video Transitions Service
Apply professional transitions between video clips
"""

from enum import Enum
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from .core import (
    get_ffmpeg_path,
    download_video,
    probe_video,
    create_temp_dir,
    cleanup_temp_dir,
    run_ffmpeg,
)


class TransitionType(str, Enum):
    """Available transition types (FFmpeg xfade transitions)"""
    # Fade transitions
    FADE = "fade"
    FADEBLACK = "fadeblack"
    FADEWHITE = "fadewhite"
    FADEGRAYS = "fadegrays"
    
    # Wipe transitions
    WIPELEFT = "wipeleft"
    WIPERIGHT = "wiperight"
    WIPEUP = "wipeup"
    WIPEDOWN = "wipedown"
    
    # Slide transitions
    SLIDELEFT = "slideleft"
    SLIDERIGHT = "slideright"
    SLIDEUP = "slideup"
    SLIDEDOWN = "slidedown"
    
    # Special transitions
    DISSOLVE = "dissolve"
    PIXELIZE = "pixelize"
    RADIAL = "radial"
    HBLUR = "hblur"
    DISTANCE = "distance"
    SMOOTHLEFT = "smoothleft"
    SMOOTHRIGHT = "smoothright"
    SMOOTHUP = "smoothup"
    SMOOTHDOWN = "smoothdown"
    CIRCLEOPEN = "circleopen"
    CIRCLECLOSE = "circleclose"
    
    # Zoom transitions
    ZOOMIN = "zoomin"
    
    # No transition (cut)
    NONE = "none"


@dataclass
class TransitionResult:
    """Result of applying transition between two videos"""
    buffer: bytes
    duration: float
    file_size: int
    transition_type: str
    transition_duration: float


class TransitionService:
    """Video transition service using FFmpeg xfade filter"""
    
    @staticmethod
    def get_available_transitions() -> list[dict]:
        """Get all available transition types with descriptions"""
        descriptions = {
            TransitionType.FADE: "Smooth fade transition",
            TransitionType.FADEBLACK: "Fade through black",
            TransitionType.FADEWHITE: "Fade through white",
            TransitionType.FADEGRAYS: "Fade through grayscale",
            TransitionType.WIPELEFT: "Wipe from right to left",
            TransitionType.WIPERIGHT: "Wipe from left to right",
            TransitionType.WIPEUP: "Wipe from bottom to top",
            TransitionType.WIPEDOWN: "Wipe from top to bottom",
            TransitionType.SLIDELEFT: "Slide from right to left",
            TransitionType.SLIDERIGHT: "Slide from left to right",
            TransitionType.SLIDEUP: "Slide from bottom to top",
            TransitionType.SLIDEDOWN: "Slide from top to bottom",
            TransitionType.DISSOLVE: "Dissolve effect",
            TransitionType.PIXELIZE: "Pixelization transition",
            TransitionType.RADIAL: "Radial wipe",
            TransitionType.HBLUR: "Horizontal blur transition",
            TransitionType.DISTANCE: "Distance-based transition",
            TransitionType.SMOOTHLEFT: "Smooth slide left",
            TransitionType.SMOOTHRIGHT: "Smooth slide right",
            TransitionType.SMOOTHUP: "Smooth slide up",
            TransitionType.SMOOTHDOWN: "Smooth slide down",
            TransitionType.CIRCLEOPEN: "Circle opening reveal",
            TransitionType.CIRCLECLOSE: "Circle closing wipe",
            TransitionType.ZOOMIN: "Zoom in transition",
            TransitionType.NONE: "No transition (hard cut)",
        }
        
        return [
            {
                "id": t.value,
                "name": t.name.replace("_", " ").title(),
                "description": descriptions.get(t, "")
            }
            for t in TransitionType
        ]
    
    @staticmethod
    def build_xfade_filter(
        num_videos: int,
        transition: str = "fade",
        duration: float = 1.0
    ) -> tuple[str, int]:
        """
        Build FFmpeg filter_complex string for xfade transitions.
        
        Args:
            num_videos: Number of videos to merge
            transition: Transition type (from TransitionType enum)
            duration: Duration of each transition in seconds
            
        Returns:
            Tuple of (filter_complex string, number of videos)
        """
        if num_videos < 2:
            raise ValueError("At least 2 videos required for transitions")
        
        if transition == "none" or transition == TransitionType.NONE:
            # No transition - simple concat
            return "", num_videos
        
        # Build video xfade chain
        video_parts = []
        audio_parts = []
        
        # First video/audio input
        video_parts.append(f"[0:v]")
        audio_parts.append(f"[0:a]")
        
        for i in range(1, num_videos):
            offset = f"offset_{i}"
            
            if i == 1:
                # First transition
                video_parts.append(
                    f"[1:v]xfade=transition={transition}:duration={duration}:offset=${{offset_1}}[v{i}]"
                )
                audio_parts.append(
                    f"[1:a]acrossfade=d={duration}[a{i}]"
                )
            else:
                # Subsequent transitions
                video_parts.append(
                    f"[v{i-1}][{i}:v]xfade=transition={transition}:duration={duration}:offset=${{offset_{i}}}[v{i}]"
                )
                audio_parts.append(
                    f"[a{i-1}][{i}:a]acrossfade=d={duration}[a{i}]"
                )
        
        # Final output labels
        final_video = f"v{num_videos-1}"
        final_audio = f"a{num_videos-1}"
        
        # Simplified approach: build incrementally
        filter_parts = []
        
        # For 2 videos: [0:v][1:v]xfade=...[vout];[0:a][1:a]acrossfade=...[aout]
        # For 3+ videos: chain them together
        
        if num_videos == 2:
            filter_complex = (
                f"[0:v][1:v]xfade=transition={transition}:duration={duration}:offset=0[vout];"
                f"[0:a][1:a]acrossfade=d={duration}[aout]"
            )
        else:
            # Build video chain
            video_chain = []
            for i in range(num_videos - 1):
                if i == 0:
                    video_chain.append(f"[0:v][1:v]xfade=transition={transition}:duration={duration}:offset=0[v1]")
                else:
                    video_chain.append(f"[v{i}][{i+1}:v]xfade=transition={transition}:duration={duration}:offset=0[v{i+1}]")
            
            # Build audio chain
            audio_chain = []
            for i in range(num_videos - 1):
                if i == 0:
                    audio_chain.append(f"[0:a][1:a]acrossfade=d={duration}[a1]")
                else:
                    audio_chain.append(f"[a{i}][{i+1}:a]acrossfade=d={duration}[a{i+1}]")
            
            # Final labels
            final_v = f"v{num_videos-1}"
            final_a = f"a{num_videos-1}"
            
            # Replace final labels with output labels
            video_chain[-1] = video_chain[-1].replace(f"[v{num_videos-1}]", "[vout]")
            audio_chain[-1] = audio_chain[-1].replace(f"[a{num_videos-1}]", "[aout]")
            
            filter_complex = ";".join(video_chain + audio_chain)
        
        return filter_complex, num_videos
    
    @classmethod
    async def apply_transition(
        cls,
        video1_url: str,
        video2_url: str,
        transition: str | TransitionType = TransitionType.FADE,
        duration: float = 1.0,
        timeout_seconds: int = 300
    ) -> TransitionResult:
        """
        Apply a transition between two videos.
        
        Args:
            video1_url: URL of first video
            video2_url: URL of second video
            transition: Transition type
            duration: Duration of transition in seconds
            
        Returns:
            TransitionResult with merged video
        """
        if isinstance(transition, TransitionType):
            transition = transition.value
        
        ffmpeg_path = get_ffmpeg_path()
        temp_dir = create_temp_dir("video-transition")
        
        input1_path = temp_dir / "input1.mp4"
        input2_path = temp_dir / "input2.mp4"
        output_path = temp_dir / "output.mp4"
        
        try:
            # Download videos
            video1_data = await download_video(video1_url)
            video2_data = await download_video(video2_url)
            
            input1_path.write_bytes(video1_data)
            input2_path.write_bytes(video2_data)
            
            # Probe videos
            probe1 = await probe_video(str(input1_path))
            probe2 = await probe_video(str(input2_path))
            
            total_duration = probe1.duration + probe2.duration - duration
            
            # Calculate offset (when second video starts transitioning)
            offset = probe1.duration - duration
            if offset < 0:
                offset = 0
            
            if transition == "none":
                # Simple concatenation
                concat_path = temp_dir / "concat.txt"
                concat_path.write_text(
                    f"file '{input1_path.as_posix()}'\n"
                    f"file '{input2_path.as_posix()}'"
                )
                
                args = [
                    ffmpeg_path, "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", str(concat_path),
                    "-c", "copy",
                    "-movflags", "+faststart",
                    str(output_path)
                ]
            else:
                # Apply xfade transition
                filter_complex = (
                    f"[0:v][1:v]xfade=transition={transition}:duration={duration}:offset={offset}[vout];"
                    f"[0:a][1:a]acrossfade=d={duration}[aout]"
                )
                
                args = [
                    ffmpeg_path, "-y",
                    "-i", str(input1_path),
                    "-i", str(input2_path),
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
                raise RuntimeError(f"Failed to apply transition: {stderr[-500:] if stderr else 'Unknown error'}")
            
            output_buffer = output_path.read_bytes()
            
            return TransitionResult(
                buffer=output_buffer,
                duration=total_duration,
                file_size=len(output_buffer),
                transition_type=transition,
                transition_duration=duration
            )
            
        finally:
            cleanup_temp_dir(temp_dir)
