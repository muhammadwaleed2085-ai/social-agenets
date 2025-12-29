"""
Text Overlay Service
Add text, titles, and captions to videos
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Optional
from enum import Enum

from .core import (
    get_ffmpeg_path,
    download_video,
    probe_video,
    create_temp_dir,
    cleanup_temp_dir,
    run_ffmpeg,
)


class TextPosition(str, Enum):
    """Predefined text positions"""
    TOP_LEFT = "top_left"
    TOP_CENTER = "top_center"
    TOP_RIGHT = "top_right"
    CENTER_LEFT = "center_left"
    CENTER = "center"
    CENTER_RIGHT = "center_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_CENTER = "bottom_center"
    BOTTOM_RIGHT = "bottom_right"


# Position mappings for drawtext filter
POSITION_COORDS = {
    TextPosition.TOP_LEFT: ("20", "20"),
    TextPosition.TOP_CENTER: ("(w-text_w)/2", "20"),
    TextPosition.TOP_RIGHT: ("w-text_w-20", "20"),
    TextPosition.CENTER_LEFT: ("20", "(h-text_h)/2"),
    TextPosition.CENTER: ("(w-text_w)/2", "(h-text_h)/2"),
    TextPosition.CENTER_RIGHT: ("w-text_w-20", "(h-text_h)/2"),
    TextPosition.BOTTOM_LEFT: ("20", "h-text_h-20"),
    TextPosition.BOTTOM_CENTER: ("(w-text_w)/2", "h-text_h-40"),
    TextPosition.BOTTOM_RIGHT: ("w-text_w-20", "h-text_h-20"),
}


@dataclass
class TextOverlayResult:
    """Result of text overlay operation"""
    buffer: bytes
    duration: float
    file_size: int
    text: str
    position: str


class TextOverlayService:
    """Text overlay service using FFmpeg drawtext filter"""
    
    @staticmethod
    def get_positions() -> list[dict]:
        """Get available text positions"""
        return [
            {"id": p.value, "name": p.name.replace("_", " ").title()}
            for p in TextPosition
        ]
    
    @staticmethod
    def _escape_text(text: str) -> str:
        """Escape special characters for FFmpeg drawtext filter"""
        # Escape special characters
        text = text.replace("\\", "\\\\")
        text = text.replace("'", "\\'")
        text = text.replace(":", "\\:")
        text = text.replace("%", "\\%")
        return text
    
    @classmethod
    async def add_text(
        cls,
        video_url: str,
        text: str,
        position: str | TextPosition = TextPosition.BOTTOM_CENTER,
        font_size: int = 48,
        font_color: str = "white",
        bg_color: Optional[str] = None,
        bg_opacity: float = 0.5,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        fade_in: float = 0.0,
        fade_out: float = 0.0,
        timeout_seconds: int = 300
    ) -> TextOverlayResult:
        """
        Add text overlay to video.
        
        Args:
            video_url: URL of the source video
            text: Text to display
            position: Position of text (predefined or custom)
            font_size: Font size in pixels
            font_color: Font color (name or hex)
            bg_color: Background color (optional)
            bg_opacity: Background opacity (0-1)
            start_time: When to show text (None = from start)
            end_time: When to hide text (None = until end)
            fade_in: Fade in duration in seconds
            fade_out: Fade out duration in seconds
            
        Returns:
            TextOverlayResult with video containing text
        """
        ffmpeg_path = get_ffmpeg_path()
        temp_dir = create_temp_dir("video-text")
        
        input_path = temp_dir / "input.mp4"
        output_path = temp_dir / "output.mp4"
        
        try:
            # Download video
            video_data = await download_video(video_url)
            input_path.write_bytes(video_data)
            
            # Probe video
            probe = await probe_video(str(input_path))
            
            # Get position coordinates
            if isinstance(position, str):
                try:
                    position = TextPosition(position)
                except ValueError:
                    position = TextPosition.BOTTOM_CENTER
            
            x_coord, y_coord = POSITION_COORDS.get(position, POSITION_COORDS[TextPosition.BOTTOM_CENTER])
            
            # Escape text for FFmpeg
            escaped_text = cls._escape_text(text)
            
            # Build drawtext filter
            drawtext_parts = [
                f"text='{escaped_text}'",
                f"fontsize={font_size}",
                f"fontcolor={font_color}",
                f"x={x_coord}",
                f"y={y_coord}",
            ]
            
            # Add background box if specified
            if bg_color:
                drawtext_parts.extend([
                    "box=1",
                    f"boxcolor={bg_color}@{bg_opacity}",
                    "boxborderw=10"
                ])
            
            # Add timing if specified
            if start_time is not None or end_time is not None:
                enable_parts = []
                if start_time is not None:
                    enable_parts.append(f"gte(t,{start_time})")
                if end_time is not None:
                    enable_parts.append(f"lte(t,{end_time})")
                enable_expr = "*".join(enable_parts)
                drawtext_parts.append(f"enable='{enable_expr}'")
            
            # Add fade effects using alpha
            if fade_in > 0 and start_time is not None:
                fade_in_alpha = f"if(lt(t,{start_time}),0,if(lt(t,{start_time + fade_in}),(t-{start_time})/{fade_in},1))"
                drawtext_parts.append(f"alpha='{fade_in_alpha}'")
            elif fade_out > 0 and end_time is not None:
                fade_out_alpha = f"if(gt(t,{end_time}),0,if(gt(t,{end_time - fade_out}),({end_time}-t)/{fade_out},1))"
                drawtext_parts.append(f"alpha='{fade_out_alpha}'")
            
            drawtext_filter = "drawtext=" + ":".join(drawtext_parts)
            
            args = [
                ffmpeg_path,
                "-y",
                "-i", str(input_path),
                "-vf", drawtext_filter,
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "22",
                "-c:a", "copy",
                "-movflags", "+faststart",
                str(output_path)
            ]
            
            returncode, stdout, stderr = await run_ffmpeg(args, timeout_seconds)
            
            if returncode != 0:
                raise RuntimeError(f"Failed to add text: {stderr[-500:] if stderr else 'Unknown error'}")
            
            output_buffer = output_path.read_bytes()
            
            return TextOverlayResult(
                buffer=output_buffer,
                duration=probe.duration,
                file_size=len(output_buffer),
                text=text,
                position=position.value if isinstance(position, TextPosition) else position
            )
            
        finally:
            cleanup_temp_dir(temp_dir)
    
    @classmethod
    async def add_captions(
        cls,
        video_url: str,
        captions: list[dict],
        font_size: int = 36,
        font_color: str = "white",
        position: TextPosition = TextPosition.BOTTOM_CENTER,
        timeout_seconds: int = 600
    ) -> TextOverlayResult:
        """
        Add multiple timed captions to video.
        
        Args:
            video_url: URL of the source video
            captions: List of caption dicts with keys: text, start, end
            font_size: Font size for all captions
            font_color: Font color for all captions
            position: Position for all captions
            
        Returns:
            TextOverlayResult with video containing captions
        """
        ffmpeg_path = get_ffmpeg_path()
        temp_dir = create_temp_dir("video-captions")
        
        input_path = temp_dir / "input.mp4"
        output_path = temp_dir / "output.mp4"
        
        try:
            # Download video
            video_data = await download_video(video_url)
            input_path.write_bytes(video_data)
            
            # Probe video
            probe = await probe_video(str(input_path))
            
            # Get position coordinates
            x_coord, y_coord = POSITION_COORDS.get(position, POSITION_COORDS[TextPosition.BOTTOM_CENTER])
            
            # Build drawtext filters for each caption
            filters = []
            for cap in captions:
                text = cls._escape_text(cap.get("text", ""))
                start = cap.get("start", 0)
                end = cap.get("end", probe.duration)
                
                drawtext = (
                    f"drawtext=text='{text}'"
                    f":fontsize={font_size}"
                    f":fontcolor={font_color}"
                    f":x={x_coord}"
                    f":y={y_coord}"
                    f":box=1"
                    f":boxcolor=black@0.5"
                    f":boxborderw=10"
                    f":enable='between(t,{start},{end})'"
                )
                filters.append(drawtext)
            
            # Combine all drawtext filters
            filter_chain = ",".join(filters)
            
            args = [
                ffmpeg_path,
                "-y",
                "-i", str(input_path),
                "-vf", filter_chain,
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "22",
                "-c:a", "copy",
                "-movflags", "+faststart",
                str(output_path)
            ]
            
            returncode, stdout, stderr = await run_ffmpeg(args, timeout_seconds)
            
            if returncode != 0:
                raise RuntimeError(f"Failed to add captions: {stderr[-500:] if stderr else 'Unknown error'}")
            
            output_buffer = output_path.read_bytes()
            
            return TextOverlayResult(
                buffer=output_buffer,
                duration=probe.duration,
                file_size=len(output_buffer),
                text=f"{len(captions)} captions",
                position=position.value
            )
            
        finally:
            cleanup_temp_dir(temp_dir)
    
    @classmethod
    async def add_title_card(
        cls,
        video_url: str,
        title: str,
        subtitle: Optional[str] = None,
        duration: float = 3.0,
        position: Literal["start", "end"] = "start",
        bg_color: str = "black",
        title_color: str = "white",
        title_size: int = 72,
        subtitle_size: int = 36,
        fade_duration: float = 0.5,
        timeout_seconds: int = 300
    ) -> TextOverlayResult:
        """
        Add a title card at the start or end of video.
        
        Args:
            video_url: URL of the source video
            title: Main title text
            subtitle: Optional subtitle text
            duration: Duration of title card in seconds
            position: "start" or "end"
            bg_color: Background color
            title_color: Title text color
            title_size: Title font size
            subtitle_size: Subtitle font size
            fade_duration: Fade in/out duration
            
        Returns:
            TextOverlayResult with video containing title card
        """
        ffmpeg_path = get_ffmpeg_path()
        temp_dir = create_temp_dir("video-title")
        
        input_path = temp_dir / "input.mp4"
        title_path = temp_dir / "title.mp4"
        output_path = temp_dir / "output.mp4"
        
        try:
            # Download video
            video_data = await download_video(video_url)
            input_path.write_bytes(video_data)
            
            # Probe video to get dimensions
            probe = await probe_video(str(input_path))
            
            # Create title card video
            escaped_title = cls._escape_text(title)
            
            # Build drawtext for title
            title_filter = (
                f"drawtext=text='{escaped_title}'"
                f":fontsize={title_size}"
                f":fontcolor={title_color}"
                f":x=(w-text_w)/2"
                f":y=(h-text_h)/2"
            )
            
            # Add subtitle if provided
            if subtitle:
                escaped_subtitle = cls._escape_text(subtitle)
                title_filter += (
                    f",drawtext=text='{escaped_subtitle}'"
                    f":fontsize={subtitle_size}"
                    f":fontcolor={title_color}"
                    f":x=(w-text_w)/2"
                    f":y=(h/2)+{title_size}"
                )
            
            # Add fade effect
            title_filter += f",fade=t=in:st=0:d={fade_duration},fade=t=out:st={duration - fade_duration}:d={fade_duration}"
            
            # Create title card with color source
            title_args = [
                ffmpeg_path,
                "-y",
                "-f", "lavfi",
                "-i", f"color=c={bg_color}:s={probe.width}x{probe.height}:d={duration}",
                "-f", "lavfi",
                "-i", f"anullsrc=channel_layout=stereo:sample_rate=44100:d={duration}",
                "-vf", title_filter,
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "128k",
                "-shortest",
                str(title_path)
            ]
            
            returncode, stdout, stderr = await run_ffmpeg(title_args, timeout_seconds)
            
            if returncode != 0:
                raise RuntimeError(f"Failed to create title card: {stderr[-500:] if stderr else 'Unknown error'}")
            
            # Concatenate title card with video
            concat_path = temp_dir / "concat.txt"
            if position == "start":
                concat_path.write_text(
                    f"file '{title_path.as_posix()}'\n"
                    f"file '{input_path.as_posix()}'"
                )
            else:
                concat_path.write_text(
                    f"file '{input_path.as_posix()}'\n"
                    f"file '{title_path.as_posix()}'"
                )
            
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
                raise RuntimeError(f"Failed to add title card: {stderr[-500:] if stderr else 'Unknown error'}")
            
            output_buffer = output_path.read_bytes()
            
            return TextOverlayResult(
                buffer=output_buffer,
                duration=probe.duration + duration,
                file_size=len(output_buffer),
                text=title,
                position=position
            )
            
        finally:
            cleanup_temp_dir(temp_dir)
