"""
Competitor Analysis Schemas
Meta Ad Library Integration for Competitor Research

Features:
- Enhanced Ad Library search
- Competitor watchlist
- Ad trend analysis
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class AdLibraryCountry(str, Enum):
    """Supported countries for Ad Library"""
    US = "US"
    GB = "GB"
    CA = "CA"
    AU = "AU"
    DE = "DE"
    FR = "FR"
    ES = "ES"
    IT = "IT"
    BR = "BR"
    IN = "IN"
    ALL = "ALL"


class AdLibraryPlatform(str, Enum):
    """Platforms to search"""
    FACEBOOK = "FACEBOOK"
    INSTAGRAM = "INSTAGRAM"
    MESSENGER = "MESSENGER"
    ALL = "ALL"


class AdLibraryMediaType(str, Enum):
    """Media types"""
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    MEME = "MEME"
    ALL = "ALL"


class CompetitorSearchRequest(BaseModel):
    """Request to search competitor ads"""
    search_term: str = Field(..., min_length=1)
    page_id: Optional[str] = None
    country: AdLibraryCountry = AdLibraryCountry.ALL
    platform: AdLibraryPlatform = AdLibraryPlatform.ALL
    media_type: AdLibraryMediaType = AdLibraryMediaType.ALL
    active_only: bool = True
    limit: int = Field(default=25, ge=1, le=100)


class CompetitorAd(BaseModel):
    """A competitor ad from Ad Library"""
    id: str
    page_id: str
    page_name: str
    ad_creative_body: Optional[str] = None
    ad_creative_link_caption: Optional[str] = None
    ad_creative_link_title: Optional[str] = None
    ad_delivery_start_time: Optional[str] = None
    ad_delivery_stop_time: Optional[str] = None
    currency: Optional[str] = None
    spend_lower: Optional[float] = None
    spend_upper: Optional[float] = None
    impressions_lower: Optional[int] = None
    impressions_upper: Optional[int] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    is_active: bool = True


class WatchlistItem(BaseModel):
    """A competitor in the watchlist"""
    id: str
    page_id: str
    page_name: str
    industry: Optional[str] = None
    notes: Optional[str] = None
    added_at: datetime
    last_checked: Optional[datetime] = None
    active_ads_count: int = 0


class AddToWatchlistRequest(BaseModel):
    """Request to add competitor to watchlist"""
    page_id: str
    page_name: str
    industry: Optional[str] = None
    notes: Optional[str] = None


class AdTrend(BaseModel):
    """Trend data for competitor ads"""
    period: str  # e.g., "2025-01", "2025-W01"
    total_ads: int
    active_ads: int
    top_formats: List[str]
    common_keywords: List[str]
    avg_ad_duration_days: float


class CompetitorInsight(BaseModel):
    """Insights about a competitor"""
    page_id: str
    page_name: str
    total_ads_found: int
    active_ads: int
    avg_spend_range: Optional[str] = None
    top_platforms: List[str]
    ad_frequency: str  # e.g., "High", "Medium", "Low"
    creative_types: Dict[str, int]  # e.g., {"image": 10, "video": 5}


# =============================================================================
# INDUSTRY CATEGORIES
# =============================================================================

INDUSTRY_CATEGORIES = [
    "E-commerce",
    "SaaS",
    "Finance",
    "Healthcare",
    "Education",
    "Travel",
    "Food & Beverage",
    "Fashion",
    "Technology",
    "Entertainment",
    "Real Estate",
    "Automotive",
    "Other"
]
