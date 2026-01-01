"""
Conversions API (CAPI) Schemas
Meta Marketing API Server-Side Tracking

Features:
- Server-side event tracking
- Cookie-less tracking support
- Event deduplication
- GDPR/CCPA compliant hashed PII
"""
from enum import Enum
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
import hashlib


class CAPIEventType(str, Enum):
    """Standard Conversions API event types"""
    # E-commerce events
    PURCHASE = "Purchase"
    ADD_TO_CART = "AddToCart"
    ADD_PAYMENT_INFO = "AddPaymentInfo"
    ADD_TO_WISHLIST = "AddToWishlist"
    INITIATE_CHECKOUT = "InitiateCheckout"
    
    # Lead events
    LEAD = "Lead"
    COMPLETE_REGISTRATION = "CompleteRegistration"
    SUBMIT_APPLICATION = "SubmitApplication"
    
    # Engagement events
    VIEW_CONTENT = "ViewContent"
    SEARCH = "Search"
    CONTACT = "Contact"
    FIND_LOCATION = "FindLocation"
    SCHEDULE = "Schedule"
    SUBSCRIBE = "Subscribe"
    
    # App events
    START_TRIAL = "StartTrial"
    CUSTOMIZE_PRODUCT = "CustomizeProduct"
    DONATE = "Donate"
    
    # Custom
    CUSTOM = "custom"


class ActionSource(str, Enum):
    """Source of the conversion event"""
    WEBSITE = "website"
    APP = "app"
    EMAIL = "email"
    PHONE_CALL = "phone_call"
    CHAT = "chat"
    PHYSICAL_STORE = "physical_store"
    SYSTEM_GENERATED = "system_generated"
    OTHER = "other"


class CAPIUserData(BaseModel):
    """
    User data for matching (should be hashed before sending to Meta).
    
    All fields should be SHA-256 hashed except:
    - client_ip_address
    - client_user_agent
    - fbc, fbp
    """
    # Hashed PII (SHA-256)
    em: Optional[str] = Field(None, description="SHA-256 hashed lowercase email")
    ph: Optional[str] = Field(None, description="SHA-256 hashed phone (digits only)")
    fn: Optional[str] = Field(None, description="SHA-256 hashed lowercase first name")
    ln: Optional[str] = Field(None, description="SHA-256 hashed lowercase last name")
    db: Optional[str] = Field(None, description="SHA-256 hashed DOB (YYYYMMDD)")
    ge: Optional[str] = Field(None, description="SHA-256 hashed gender (m/f)")
    ct: Optional[str] = Field(None, description="SHA-256 hashed city (lowercase, no spaces)")
    st: Optional[str] = Field(None, description="SHA-256 hashed state (2-letter code)")
    zp: Optional[str] = Field(None, description="SHA-256 hashed ZIP (first 5 digits US)")
    country: Optional[str] = Field(None, description="SHA-256 hashed country (2-letter ISO)")
    
    # Not hashed
    client_ip_address: Optional[str] = None
    client_user_agent: Optional[str] = None
    fbc: Optional[str] = Field(None, description="Facebook click ID (_fbc cookie)")
    fbp: Optional[str] = Field(None, description="Facebook browser ID (_fbp cookie)")
    
    # External ID for matching
    external_id: Optional[str] = Field(None, description="SHA-256 hashed external ID")
    
    # Subscription ID for subscription events
    subscription_id: Optional[str] = None
    
    # Lead ID
    lead_id: Optional[str] = None


class CAPICustomData(BaseModel):
    """Custom data for the conversion event"""
    # E-commerce
    value: Optional[float] = Field(None, description="Value of the event")
    currency: Optional[str] = Field(None, description="ISO 4217 currency code (e.g., USD)")
    content_ids: Optional[List[str]] = Field(None, description="Product IDs")
    content_type: Optional[str] = Field(None, description="product or product_group")
    contents: Optional[List[Dict[str, Any]]] = Field(
        None, 
        description="Array of {id, quantity, item_price}"
    )
    content_name: Optional[str] = None
    content_category: Optional[str] = None
    num_items: Optional[int] = None
    
    # Lead/form
    predicted_ltv: Optional[float] = None
    
    # Search
    search_string: Optional[str] = None
    
    # Registration
    status: Optional[str] = None
    
    # Order
    order_id: Optional[str] = None
    
    # Custom properties (any additional data)
    custom_properties: Optional[Dict[str, Any]] = None


class CAPIEvent(BaseModel):
    """Single Conversions API event"""
    event_name: Union[CAPIEventType, str] = Field(
        ...,
        description="Event name (use CAPIEventType or custom string)"
    )
    event_time: int = Field(
        ...,
        description="Unix timestamp in seconds"
    )
    event_source_url: Optional[str] = Field(
        None,
        description="URL where the event occurred"
    )
    action_source: ActionSource = ActionSource.WEBSITE
    user_data: CAPIUserData
    custom_data: Optional[CAPICustomData] = None
    event_id: Optional[str] = Field(
        None,
        description="Unique event ID for deduplication with pixel"
    )
    opt_out: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "event_name": "Purchase",
                "event_time": 1704067200,
                "event_source_url": "https://example.com/checkout",
                "action_source": "website",
                "user_data": {
                    "em": "SHA256_HASH_OF_EMAIL",
                    "client_ip_address": "192.168.1.1",
                    "fbc": "fb.1.1558571054389.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890"
                },
                "custom_data": {
                    "value": 99.99,
                    "currency": "USD",
                    "content_ids": ["SKU123"]
                },
                "event_id": "unique_event_id_123"
            }
        }


class SendCAPIEventsRequest(BaseModel):
    """Request to send events via Conversions API"""
    pixel_id: str
    events: List[CAPIEvent] = Field(..., min_length=1, max_length=1000)
    test_event_code: Optional[str] = Field(
        None,
        description="Test event code from Events Manager"
    )


class CAPIEventResponse(BaseModel):
    """Response after sending CAPI events"""
    success: bool
    events_received: int = 0
    fbtrace_id: Optional[str] = None
    error: Optional[str] = None


class CAPITestEventRequest(BaseModel):
    """Request to send a test event"""
    pixel_id: str
    event: CAPIEvent
    test_event_code: str = Field(
        ...,
        description="Get this from Events Manager > Test Events"
    )


class CAPIDiagnosticsRequest(BaseModel):
    """Request for CAPI diagnostics"""
    pixel_id: str
    event_name: Optional[str] = None


class EventQualityMetric(BaseModel):
    """Event quality metric from diagnostics"""
    name: str
    score: int  # 0-10
    status: str  # "good", "fair", "poor"
    description: str


class CAPIDiagnosticsResponse(BaseModel):
    """CAPI diagnostics response"""
    pixel_id: str
    overall_quality: str  # "good", "fair", "poor"
    event_match_quality: float  # 0-1
    events_last_24h: int
    dedup_ratio: Optional[float] = None
    metrics: List[EventQualityMetric] = []
    recommendations: List[str] = []


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def hash_for_capi(value: str) -> str:
    """
    Hash a value for CAPI (SHA-256).
    
    Meta requires:
    - Lowercase
    - Trimmed whitespace
    - SHA-256 hex encoded
    """
    if not value:
        return ""
    normalized = value.lower().strip()
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def hash_phone(phone: str) -> str:
    """Hash phone number (digits only)"""
    digits = ''.join(c for c in phone if c.isdigit())
    return hash_for_capi(digits)


def hash_email(email: str) -> str:
    """Hash email (lowercase)"""
    return hash_for_capi(email.lower().strip())
