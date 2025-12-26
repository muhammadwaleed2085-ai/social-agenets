"""
Content Strategist Agent - Schemas
Simple request/response models for chat functionality
"""
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class AttachmentInput(BaseModel):
    """File attachment for chat messages"""
    type: Literal["image", "pdf", "docx", "pptx", "document", "text", "csv", "json"] = "document"
    name: str
    data: str  # base64 encoded data
    mimeType: Optional[str] = None
    size: Optional[int] = None


class ChatMessage(BaseModel):
    """Single chat message"""
    role: Literal["user", "assistant", "system"]
    content: str


class ChatStrategistRequest(BaseModel):
    """Request to chat with the content strategist agent"""
    message: str = Field(..., description="User message to send to the agent")
    threadId: str = Field(default="", description="Thread ID for conversation continuity")
    modelId: Optional[str] = Field(default=None, description="Optional model ID to use")
    attachments: Optional[List[AttachmentInput]] = Field(default=None, description="Optional file attachments")


class ChatStrategistResponse(BaseModel):
    """Response from the content strategist agent"""
    response: str = Field(..., description="AI response message")
    threadId: str = Field(default="", description="Thread ID for the conversation")
    contentGenerated: bool = Field(default=False, description="Whether content was generated")
    generatedContent: Optional[dict] = Field(default=None, description="Any generated content")
    readyToGenerate: bool = Field(default=False, description="Whether ready to generate content")
    parameters: Optional[dict] = Field(default=None, description="Content parameters if ready")
    generatedImage: Optional[str] = Field(default=None, description="Generated image URL if any")
    generatedVideo: Optional[str] = Field(default=None, description="Generated video URL if any")
    isGeneratingMedia: bool = Field(default=False, description="Whether media is being generated")


class GeneratedContent(BaseModel):
    """Generated content result"""
    content: str
    platform: Optional[str] = None
    hashtags: Optional[List[str]] = None


class PlatformContent(BaseModel):
    """Content for a specific platform"""
    platform: str
    content: str
    hashtags: Optional[List[str]] = None
