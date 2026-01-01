-- Canva Integration Database Migration
-- Adds unique constraint for user_integrations and creates OAuth states table
-- 
-- Prerequisites: 
--   - auth.users table must exist (Supabase Auth)
--   - public.user_integrations table must exist

-- =====================================================
-- 1. Add unique constraint to user_integrations
-- This is required for upsert operations
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_integrations_user_provider_unique'
    ) THEN
        ALTER TABLE public.user_integrations
        ADD CONSTRAINT user_integrations_user_provider_unique 
        UNIQUE (user_id, provider);
    END IF;
END $$;

-- =====================================================
-- 2. Create canva_oauth_states table for secure PKCE storage
-- Stores state token and code verifier separately from URL
-- This table references auth.users (not public.users) because
-- user_integrations also references auth.users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.canva_oauth_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    state_token varchar(255) NOT NULL UNIQUE,
    code_verifier text NOT NULL,
    expires_at timestamptz NOT NULL,
    used boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint separately (handles if auth.users exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'canva_oauth_states_user_id_fkey'
    ) THEN
        -- Try to add FK to auth.users (Supabase standard)
        BEGIN
            ALTER TABLE public.canva_oauth_states
            ADD CONSTRAINT canva_oauth_states_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        EXCEPTION WHEN others THEN
            -- If auth.users doesn't exist, reference public.users instead
            ALTER TABLE public.canva_oauth_states
            ADD CONSTRAINT canva_oauth_states_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        END;
    END IF;
END $$;

-- Index for faster lookups by state_token
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_token 
ON public.canva_oauth_states(state_token);

-- Index for cleanup queries (partial index for unused, unexpired states)
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_expires 
ON public.canva_oauth_states(expires_at) 
WHERE used = false;

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_canva_oauth_states_user
ON public.canva_oauth_states(user_id);

-- =====================================================
-- 3. Enable RLS on canva_oauth_states
-- =====================================================
ALTER TABLE public.canva_oauth_states ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can manage own canva oauth states" ON public.canva_oauth_states;
DROP POLICY IF EXISTS "Service role full access to canva oauth states" ON public.canva_oauth_states;

-- Policy: Users can only access their own OAuth states (for frontend)
CREATE POLICY "Users can manage own canva oauth states" ON public.canva_oauth_states
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can access all (for backend with service_role key)
-- This uses multiple methods to check for service role for compatibility
CREATE POLICY "Service role full access to canva oauth states" ON public.canva_oauth_states
    FOR ALL
    USING (
        -- Check if using service_role key
        (SELECT current_setting('request.jwt.claim.role', true)) = 'service_role'
        OR
        -- Fallback for different Supabase versions
        (SELECT current_setting('role', true)) = 'service_role'
        OR
        -- Direct role check
        current_user = 'service_role'
    )
    WITH CHECK (
        (SELECT current_setting('request.jwt.claim.role', true)) = 'service_role'
        OR
        (SELECT current_setting('role', true)) = 'service_role'
        OR
        current_user = 'service_role'
    );

-- =====================================================
-- 4. Add index for user_integrations queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_provider 
ON public.user_integrations(user_id, provider);

-- =====================================================
-- 5. Clean up function for expired OAuth states
-- Can be called by a cron job or manually
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_canva_oauth_states()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Delete expired states and used states
    DELETE FROM public.canva_oauth_states
    WHERE expires_at < NOW()
    OR used = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_canva_oauth_states() TO service_role;

-- =====================================================
-- 6. Verify user_id column exists in media_library
-- (It should already exist based on schema)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'media_library' 
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column if it doesn't exist
        ALTER TABLE public.media_library 
        ADD COLUMN user_id uuid;
        
        -- Try to add FK to auth.users
        BEGIN
            ALTER TABLE public.media_library
            ADD CONSTRAINT media_library_user_id_auth_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id);
        EXCEPTION WHEN others THEN
            -- Ignore if constraint already exists or auth.users doesn't exist
            NULL;
        END;
    END IF;
END $$;

-- =====================================================
-- 7. Add comment for documentation
-- =====================================================
COMMENT ON TABLE public.canva_oauth_states IS 
'Stores PKCE state for Canva OAuth flow. State token goes in URL, code_verifier stays in DB.';

COMMENT ON FUNCTION cleanup_expired_canva_oauth_states() IS 
'Deletes expired or used OAuth states. Call periodically via cron or pg_cron.';
