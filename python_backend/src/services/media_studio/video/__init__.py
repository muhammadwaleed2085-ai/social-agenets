"""
Video Processing Module
Professional video editing services powered by FFmpeg
"""

from .core import (
    VideoProbeResult,
    get_ffmpeg_path,
    get_ffprobe_path,
    download_video,
    probe_video,
    create_temp_dir,
    cleanup_temp_dir,
    VIDEO_PLATFORM_PRESETS,
    MAX_MERGE_DURATION_SECONDS,
)
from .resizer import VideoResizer, VideoResizeResult
from .merger import VideoMerger, VideoMergeResult
from .trimmer import VideoTrimmer, VideoTrimResult
from .transitions import TransitionService, TransitionType
from .speed import SpeedService, SpeedResult
from .text_overlay import TextOverlayService, TextOverlayResult

__all__ = [
    # Core
    "VideoProbeResult",
    "get_ffmpeg_path",
    "get_ffprobe_path",
    "download_video",
    "probe_video",
    "create_temp_dir",
    "cleanup_temp_dir",
    "VIDEO_PLATFORM_PRESETS",
    "MAX_MERGE_DURATION_SECONDS",
    # Resizer
    "VideoResizer",
    "VideoResizeResult",
    # Merger
    "VideoMerger",
    "VideoMergeResult",
    # Trimmer
    "VideoTrimmer",
    "VideoTrimResult",
    # Transitions
    "TransitionService",
    "TransitionType",
    # Speed
    "SpeedService",
    "SpeedResult",
    # Text Overlay
    "TextOverlayService",
    "TextOverlayResult",
]
