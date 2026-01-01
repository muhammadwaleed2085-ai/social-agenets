"""
Creative Hub Schemas
Meta Marketing API Creative Management

Features:
- Creative Library management
- Dynamic Creative optimization
- Opportunity Score (0-100)
- Ad Library search
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


class CreativeType(str, Enum):
    """Type of creative asset"""
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    CAROUSEL = "CAROUSEL"
    COLLECTION = "COLLECTION"


class CreativeStatus(str, Enum):
    """Status of creative in library"""
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    PENDING = "PENDING"
    REJECTED = "REJECTED"


class CallToAction(str, Enum):
    """Available CTAs for ads"""
    SHOP_NOW = "SHOP_NOW"
    LEARN_MORE = "LEARN_MORE"
    SIGN_UP = "SIGN_UP"
    SUBSCRIBE = "SUBSCRIBE"
    CONTACT_US = "CONTACT_US"
    GET_QUOTE = "GET_QUOTE"
    APPLY_NOW = "APPLY_NOW"
    BOOK_NOW = "BOOK_NOW"
    DOWNLOAD = "DOWNLOAD"
    GET_OFFER = "GET_OFFER"
    GET_STARTED = "GET_STARTED"
    WATCH_MORE = "WATCH_MORE"
    MESSAGE_PAGE = "MESSAGE_PAGE"


class CreativeAsset(BaseModel):
    """A single creative asset (image/video)"""
    id: str
    name: str
    type: CreativeType
    url: str
    thumbnail_url: Optional[str] = None
    hash: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    duration_seconds: Optional[float] = None  # For videos
    status: CreativeStatus = CreativeStatus.ACTIVE
    created_time: Optional[datetime] = None
    
    # Performance metrics
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    ctr: Optional[float] = None
    spend: Optional[float] = None


class CreativeLibraryResponse(BaseModel):
    """Response for creative library listing"""
    assets: List[CreativeAsset]
    total_count: int
    has_next_page: bool
    cursor: Optional[str] = None


class UploadCreativeRequest(BaseModel):
    """Request to upload a new creative"""
    name: str = Field(..., min_length=1, max_length=255)
    type: CreativeType
    file_url: Optional[str] = None  # For URL-based upload
    # file_data handled separately for multipart upload


class UploadCreativeResponse(BaseModel):
    """Response after uploading creative"""
    success: bool
    asset_id: Optional[str] = None
    asset_hash: Optional[str] = None
    url: Optional[str] = None
    error: Optional[str] = None


# =============================================================================
# DYNAMIC CREATIVE
# =============================================================================

class DynamicCreativeConfig(BaseModel):
    """Configuration for Dynamic Creative optimization"""
    # Images/Videos (up to 10 each)
    image_hashes: List[str] = Field(default=[], max_length=10)
    video_ids: List[str] = Field(default=[], max_length=10)
    
    # Text variations (up to 5 each)
    titles: List[str] = Field(
        default=[],
        max_length=5,
        description="Primary headlines (max 40 chars each)"
    )
    bodies: List[str] = Field(
        default=[],
        max_length=5,
        description="Primary text (max 125 chars each)"
    )
    descriptions: List[str] = Field(
        default=[],
        max_length=5,
        description="Link descriptions"
    )
    
    # CTAs
    call_to_actions: List[CallToAction] = Field(default=[CallToAction.LEARN_MORE])
    
    # Optional
    link_urls: List[str] = Field(default=[])


class DynamicCreativeRequest(BaseModel):
    """Request to create dynamic creative ad"""
    name: str = Field(..., min_length=1)
    adset_id: str
    creative_config: DynamicCreativeConfig
    status: str = "PAUSED"


class DynamicCreativeResponse(BaseModel):
    """Response for dynamic creative creation"""
    success: bool
    ad_id: Optional[str] = None
    creative_id: Optional[str] = None
    combinations_count: int = 0
    error: Optional[str] = None


# =============================================================================
# OPPORTUNITY SCORE
# =============================================================================

class OpportunityArea(str, Enum):
    """Areas for optimization recommendations"""
    CREATIVE = "CREATIVE"
    AUDIENCE = "AUDIENCE"
    BUDGET = "BUDGET"
    BIDDING = "BIDDING"
    PLACEMENT = "PLACEMENT"
    CONVERSION = "CONVERSION"


class OpportunityRecommendation(BaseModel):
    """Single recommendation for improvement"""
    area: OpportunityArea
    title: str
    description: str
    impact: str  # "HIGH", "MEDIUM", "LOW"
    action_url: Optional[str] = None


class OpportunityScore(BaseModel):
    """Account/Campaign Opportunity Score from Meta"""
    score: int = Field(..., ge=0, le=100)
    grade: str  # "EXCELLENT", "GOOD", "FAIR", "NEEDS_WORK"
    recommendations: List[OpportunityRecommendation] = []
    areas_to_improve: List[OpportunityArea] = []
    last_updated: Optional[datetime] = None


# =============================================================================
# AD LIBRARY SEARCH
# =============================================================================

class AdLibrarySearchRequest(BaseModel):
    """Search request for Meta Ad Library"""
    search_terms: Optional[str] = None
    ad_reached_countries: List[str] = Field(
        default=["US"],
        description="ISO country codes"
    )
    ad_type: Optional[str] = Field(
        default="ALL",
        description="ALL, POLITICAL_AND_ISSUE_ADS, HOUSING_ADS, etc."
    )
    ad_active_status: Optional[str] = Field(
        default="ACTIVE",
        description="ACTIVE, INACTIVE, or ALL"
    )
    page_ids: Optional[List[str]] = None
    search_page_ids: bool = False
    media_type: Optional[str] = None  # IMAGE, VIDEO, MEME, etc.
    limit: int = Field(default=25, ge=1, le=100)


class AdLibraryResult(BaseModel):
    """Single result from Ad Library"""
    id: str
    page_id: str
    page_name: str
    ad_creation_time: Optional[str] = None
    ad_delivery_start_time: Optional[str] = None
    ad_delivery_stop_time: Optional[str] = None
    ad_creative_bodies: List[str] = []
    ad_creative_link_titles: List[str] = []
    ad_creative_link_captions: List[str] = []
    ad_snapshot_url: Optional[str] = None
    currency: Optional[str] = None
    spend: Optional[Dict[str, Any]] = None
    impressions: Optional[Dict[str, Any]] = None


class AdLibrarySearchResponse(BaseModel):
    """Response from Ad Library search"""
    results: List[AdLibraryResult]
    total_count: int
    has_next: bool
    next_cursor: Optional[str] = None
