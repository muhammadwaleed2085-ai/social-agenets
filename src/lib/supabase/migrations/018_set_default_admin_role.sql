-- ============================================================================
-- MIGRATION 018: Set Default Admin Role for New Users
-- ============================================================================
-- This migration ensures that when new users sign up, they are automatically
-- assigned the 'admin' role and get their own workspace created.
-- ============================================================================

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create or replace the function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Create a new workspace for the user
    INSERT INTO public.workspaces (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Workspace') || '''s Workspace')
    RETURNING id INTO new_workspace_id;

    -- Create user profile with ADMIN role by default
    INSERT INTO public.users (id, email, full_name, role, workspace_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        'admin',  -- Default role is ADMIN
        new_workspace_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- ✅ New users will automatically be assigned 'admin' role
-- ✅ Each new user gets their own workspace
-- ✅ Trigger fires on every new auth.users insert
-- ============================================================================
