-- ============================================
-- Migration: Update Meta Ads for API v25.0+
-- Description: Adds fields for Meta Marketing API v25.0+
-- Date: 2025-12-31
-- Note: All campaign/adset/ad data fetched live from Meta API
-- ============================================

-- ============================================
-- UPDATE META_AD_DRAFTS Table
-- Add v25.0+ specific fields for local drafts
-- ============================================

-- Add destination_type for messaging/call ads
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS destination_type VARCHAR(50);

COMMENT ON COLUMN meta_ad_drafts.destination_type IS 
'WEBSITE, APP, MESSENGER, WHATSAPP, INSTAGRAM_DIRECT, PHONE_CALL, SHOP, etc.';

-- Add bid_strategy column
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS bid_strategy VARCHAR(50);

COMMENT ON COLUMN meta_ad_drafts.bid_strategy IS 
'LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP, LOWEST_COST_WITH_MIN_ROAS';

-- Add campaign_name for the full ad creation flow
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS campaign_name VARCHAR(255);

-- Add adset_name for the full ad creation flow
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS adset_name VARCHAR(255);

-- Add ad_name for better naming
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS ad_name VARCHAR(255);

-- Add objective for draft campaigns
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS objective VARCHAR(50);

COMMENT ON COLUMN meta_ad_drafts.objective IS 
'v25.0+ OUTCOME-based: OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_APP_PROMOTION';

-- Add optimization_goal for draft ad sets
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS optimization_goal VARCHAR(50);

-- Add targeting_automation for Advantage+ Audience
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS targeting_automation JSONB DEFAULT '{}';

COMMENT ON COLUMN meta_ad_drafts.targeting_automation IS 
'v25.0+ Advantage+ Audience config: { advantage_audience: 1 } for enabled';

-- ============================================
-- MIGRATION COMPLETE
-- All live campaign/adset/ad data fetched directly from Meta API
-- ============================================
