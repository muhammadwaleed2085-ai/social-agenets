-- Migration: Add code_verifier column to oauth_states table
-- Date: 2026-01-02
-- Description: The oauth_states table needs a code_verifier column to store PKCE verifiers
--              for OAuth 2.0 flows that require PKCE (Twitter, TikTok, YouTube)

-- Add code_verifier column if it doesn't exist
ALTER TABLE public.oauth_states 
ADD COLUMN IF NOT EXISTS code_verifier text;

-- Add comment for documentation
COMMENT ON COLUMN public.oauth_states.code_verifier IS 
'PKCE code verifier for OAuth 2.0 flows. Stored temporarily during OAuth and used during token exchange.';
