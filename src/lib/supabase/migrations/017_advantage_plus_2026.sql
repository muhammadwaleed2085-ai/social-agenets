-- ============================================
-- Migration: 017_advantage_plus_2026.sql
-- Description: Adds fields for Meta Marketing API v25.0+ Advantage+ Campaigns
-- Date: 2026-01-01
-- 
-- META API v25.0+ COMPLIANCE:
-- - smart_promotion_type is DEPRECATED (removed)
-- - Campaigns achieve Advantage+ status via THREE automation levers:
--   1. Advantage+ Campaign Budget (budget at campaign level)
--   2. Advantage+ Audience (targeting_automation.advantage_audience = 1)
--   3. Advantage+ Placements (no placement exclusions)
-- - advantage_state_info shows which levers are enabled
-- ============================================

-- Add advantage_state column to meta_ad_drafts for local tracking
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS advantage_state VARCHAR(30) DEFAULT 'DISABLED';

COMMENT ON COLUMN meta_ad_drafts.advantage_state IS 
'v25.0+ Advantage+ state: ADVANTAGE_PLUS_SALES, ADVANTAGE_PLUS_APP, ADVANTAGE_PLUS_LEADS, or DISABLED';

-- Add advantage_state_info JSONB for full state tracking
ALTER TABLE meta_ad_drafts 
ADD COLUMN IF NOT EXISTS advantage_state_info JSONB DEFAULT '{"advantage_state": "DISABLED", "advantage_budget_state": "DISABLED", "advantage_audience_state": "DISABLED", "advantage_placement_state": "DISABLED"}';

COMMENT ON COLUMN meta_ad_drafts.advantage_state_info IS 
'v25.0+ advantage_state_info: { advantage_state, advantage_budget_state, advantage_audience_state, advantage_placement_state }';

-- Add targeting_automation column for Advantage+ Audience configuration
ALTER TABLE meta_ad_drafts
ADD COLUMN IF NOT EXISTS targeting_automation JSONB DEFAULT '{"advantage_audience": 1}';

COMMENT ON COLUMN meta_ad_drafts.targeting_automation IS
'v25.0+ targeting_automation: { advantage_audience: 1 } enables AI-powered targeting';

-- Add placement_soft_opt_out for OUTCOME_SALES and OUTCOME_LEADS objectives
-- This allows up to 5% budget on excluded placements for better performance
ALTER TABLE meta_ad_drafts
ADD COLUMN IF NOT EXISTS placement_soft_opt_out BOOLEAN DEFAULT false;

COMMENT ON COLUMN meta_ad_drafts.placement_soft_opt_out IS
'v25.0+ placement_soft_opt_out: Allow 5% spend on excluded placements (Sales/Leads only)';

-- Add is_adset_budget_sharing_enabled for ad set budget sharing
-- This allows sharing up to 20% budget between ad sets
ALTER TABLE meta_ad_drafts
ADD COLUMN IF NOT EXISTS is_adset_budget_sharing_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN meta_ad_drafts.is_adset_budget_sharing_enabled IS
'v25.0+ is_adset_budget_sharing_enabled: Share up to 20% budget between ad sets';

-- Create index on advantage_state for faster filtering
CREATE INDEX IF NOT EXISTS idx_meta_ad_drafts_advantage_state 
ON meta_ad_drafts(advantage_state);

-- ============================================
-- REMOVE DEPRECATED FIELDS (if they exist)
-- ============================================

-- Note: We don't actually have smart_promotion_type in the database schema
-- but if it was added, this would remove it:
-- ALTER TABLE meta_ad_drafts DROP COLUMN IF EXISTS smart_promotion_type;

-- ============================================
-- UPDATE EXISTING DRAFTS
-- ============================================

-- Set default advantage_state_info for existing records
UPDATE meta_ad_drafts
SET advantage_state_info = '{"advantage_state": "DISABLED", "advantage_budget_state": "DISABLED", "advantage_audience_state": "DISABLED", "advantage_placement_state": "DISABLED"}'::jsonb
WHERE advantage_state_info IS NULL OR advantage_state_info = '{}'::jsonb;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
