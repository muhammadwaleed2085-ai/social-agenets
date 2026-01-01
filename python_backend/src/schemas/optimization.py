"""
Optimization Schemas
Meta Marketing API Bid Strategy, Funnel, Placements & Health

Features:
- Bid strategy management
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# =============================================================================
# BID STRATEGY SCHEMAS
# =============================================================================

class BidStrategy(str, Enum):
    """Available bid strategies"""
    LOWEST_COST = "LOWEST_COST"
    COST_CAP = "COST_CAP"
    BID_CAP = "BID_CAP"
    MINIMUM_ROAS = "MINIMUM_ROAS"


class ValueRuleDimension(str, Enum):
    """Dimensions for value rules"""
    AGE = "age"
    GENDER = "gender"
    OPERATING_SYSTEM = "operating_system"
    LOCATION = "location"


class ValueRule(BaseModel):
    """Bid adjustment rule for specific demographics"""
    dimension: ValueRuleDimension
    value: str  # e.g., "18-24", "male", "iOS"
    bid_multiplier: float = Field(
        default=1.0,
        ge=0.1,
        le=3.0,
        description="1.0 = no change, 1.2 = +20%, 0.8 = -20%"
    )


class BidStrategyConfig(BaseModel):
    """Bid strategy configuration"""
    strategy: BidStrategy
    cost_cap: Optional[float] = None  # For COST_CAP
    bid_cap: Optional[float] = None   # For BID_CAP
    roas_target: Optional[float] = None  # For MINIMUM_ROAS
    value_rules: List[ValueRule] = []


class UpdateBidStrategyRequest(BaseModel):
    """Request to update bid strategy"""
    adset_id: str
    strategy: BidStrategy
    cost_cap: Optional[float] = None
    bid_cap: Optional[float] = None
    roas_target: Optional[float] = None



# Funnel, Placement, and Health schemas removed.

# =============================================================================
# BID STRATEGY OPTIONS (for UI)
# =============================================================================

BID_STRATEGY_OPTIONS = [
    {
        "value": "LOWEST_COST",
        "label": "Lowest Cost",
        "description": "Get the most results for your budget (recommended)"
    },
    {
        "value": "COST_CAP",
        "label": "Cost Cap",
        "description": "Control your cost per result"
    },
    {
        "value": "BID_CAP",
        "label": "Bid Cap",
        "description": "Set maximum bid for auctions"
    },
    {
        "value": "MINIMUM_ROAS",
        "label": "Minimum ROAS",
        "description": "Optimize for return on ad spend"
    }
]

