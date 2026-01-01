"""
Reporting Schemas
Meta Marketing API Custom Reports Builder

Features:
- Custom metric selection
- Multiple breakdowns
- Report presets
- Export support
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ReportMetric(str, Enum):
    """Available metrics for reports"""
    # Delivery
    IMPRESSIONS = "impressions"
    REACH = "reach"
    FREQUENCY = "frequency"
    
    # Engagement
    CLICKS = "clicks"
    CTR = "ctr"
    CPC = "cpc"
    CPM = "cpm"
    
    # Spend
    SPEND = "spend"
    DAILY_SPEND = "daily_spend"
    
    # Conversions
    CONVERSIONS = "conversions"
    COST_PER_CONVERSION = "cost_per_conversion"
    CONVERSION_RATE = "conversion_rate"
    ROAS = "roas"
    
    # Video
    VIDEO_VIEWS = "video_views"
    VIDEO_P25_WATCHED = "video_p25_watched_actions"
    VIDEO_P50_WATCHED = "video_p50_watched_actions"
    VIDEO_P75_WATCHED = "video_p75_watched_actions"
    VIDEO_P100_WATCHED = "video_p100_watched_actions"
    
    # Landing Page
    LANDING_PAGE_VIEWS = "landing_page_views"
    OUTBOUND_CLICKS = "outbound_clicks"


class ReportBreakdown(str, Enum):
    """Breakdown dimensions for reports"""
    # Demographics
    AGE = "age"
    GENDER = "gender"
    
    # Placement
    PUBLISHER_PLATFORM = "publisher_platform"
    PLATFORM_POSITION = "platform_position"
    DEVICE_PLATFORM = "device_platform"
    
    # Geography
    COUNTRY = "country"
    REGION = "region"
    
    # Time
    HOURLY = "hourly"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


class ReportEntityLevel(str, Enum):
    """Entity level for reports"""
    ACCOUNT = "account"
    CAMPAIGN = "campaign"
    ADSET = "adset"
    AD = "ad"


class ReportDatePreset(str, Enum):
    """Date range presets"""
    TODAY = "today"
    YESTERDAY = "yesterday"
    THIS_WEEK = "this_week"
    LAST_7D = "last_7d"
    LAST_14D = "last_14d"
    LAST_30D = "last_30d"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    THIS_QUARTER = "this_quarter"
    LAST_90D = "last_90d"
    LIFETIME = "lifetime"


class CreateReportRequest(BaseModel):
    """Request to generate a custom report"""
    name: str = Field(..., min_length=1, max_length=200)
    metrics: List[ReportMetric] = Field(
        ..., 
        min_length=1,
        description="Metrics to include"
    )
    breakdowns: List[ReportBreakdown] = Field(
        default=[],
        description="Breakdown dimensions"
    )
    entity_level: ReportEntityLevel = ReportEntityLevel.CAMPAIGN
    date_preset: ReportDatePreset = ReportDatePreset.LAST_7D
    filters: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional filters (campaign_ids, status, etc.)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Weekly Performance Report",
                "metrics": ["impressions", "clicks", "ctr", "spend", "conversions"],
                "breakdowns": ["age", "gender"],
                "entity_level": "campaign",
                "date_preset": "last_7d"
            }
        }


class ReportRow(BaseModel):
    """Single row in a report"""
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    breakdown_value: Optional[Dict[str, str]] = None
    metrics: Dict[str, Any]


class ReportResponse(BaseModel):
    """Response with generated report data"""
    success: bool
    name: str
    entity_level: str
    date_range: Dict[str, str]
    columns: List[str]
    rows: List[ReportRow] = []
    totals: Optional[Dict[str, Any]] = None
    row_count: int = 0
    generated_at: datetime


class ReportPreset(BaseModel):
    """Saved report preset"""
    id: str
    name: str
    config: CreateReportRequest
    created_at: datetime
    last_used: Optional[datetime] = None


class SavePresetRequest(BaseModel):
    """Request to save a report preset"""
    name: str
    config: CreateReportRequest


class ReportExportFormat(str, Enum):
    """Export formats"""
    CSV = "csv"
    EXCEL = "xlsx"
    JSON = "json"


class ExportReportRequest(BaseModel):
    """Request to export a report"""
    report_config: CreateReportRequest
    format: ReportExportFormat = ReportExportFormat.CSV


# Metric metadata for UI
METRIC_METADATA = {
    ReportMetric.IMPRESSIONS: {"label": "Impressions", "format": "number"},
    ReportMetric.REACH: {"label": "Reach", "format": "number"},
    ReportMetric.FREQUENCY: {"label": "Frequency", "format": "decimal"},
    ReportMetric.CLICKS: {"label": "Clicks", "format": "number"},
    ReportMetric.CTR: {"label": "CTR", "format": "percent"},
    ReportMetric.CPC: {"label": "CPC", "format": "currency"},
    ReportMetric.CPM: {"label": "CPM", "format": "currency"},
    ReportMetric.SPEND: {"label": "Spend", "format": "currency"},
    ReportMetric.CONVERSIONS: {"label": "Conversions", "format": "number"},
    ReportMetric.COST_PER_CONVERSION: {"label": "Cost/Conversion", "format": "currency"},
    ReportMetric.ROAS: {"label": "ROAS", "format": "decimal"},
}
