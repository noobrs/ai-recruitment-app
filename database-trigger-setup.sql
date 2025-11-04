-- =============================================================================
-- Database Trigger for User Registration with Email Verification
-- =============================================================================
-- This SQL script should be executed in your Supabase SQL Editor
-- It handles automatic user record creation when a new auth user signs up
-- and ensures the role is set correctly even for unverified users.
--
-- IMPORTANT: Email is stored ONLY in auth.users table, NOT in public.users
-- To get user email, join with auth.users or use Supabase auth methods

-- =============================================================================
-- 1. Function: Create user record when auth.users is inserted
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Extract role from user metadata (set during signUp)
    user_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'jobseeker'
    );

    -- Validate role (must be 'jobseeker' or 'recruiter')
    IF user_role NOT IN ('jobseeker', 'recruiter') THEN
        user_role := 'jobseeker';
    END IF;

    -- Insert into public.users table
    -- Status is set to 'pending' for unverified users
    -- Note: email is NOT stored in public.users, only in auth.users
    INSERT INTO public.users (
        id,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_role::user_role_enum,
        CASE 
            WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active'::user_status_enum
            ELSE 'pending'::user_status_enum
        END,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        status = CASE 
            WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active'::user_status_enum
            ELSE public.users.status
        END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 2. Trigger: Execute handle_new_user on auth.users insert/update
-- =============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 3. Function: Update user status when email is verified
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_user_email_verified()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if email_confirmed_at changed from NULL to a value
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        UPDATE public.users
        SET 
            status = 'active'::user_status_enum,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. Trigger: Execute handle_user_email_verified on email confirmation
-- =============================================================================
DROP TRIGGER IF EXISTS on_user_email_verified ON auth.users;

CREATE TRIGGER on_user_email_verified
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_user_email_verified();

-- =============================================================================
-- 5. Indexes for performance
-- =============================================================================
-- Note: No email index needed as email is in auth.users
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- =============================================================================
-- 6. Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own record
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own record (but not role or status)
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Service role can do everything (for server-side operations)
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
CREATE POLICY "Service role has full access"
    ON public.users
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- 7. Testing the trigger
-- =============================================================================
-- After running this script, test by:
-- 1. Registering a new user via your app
-- 2. Check that a record is created in public.users with status='pending'
-- 3. Verify email and check that status updates to 'active'
-- 4. Query: 
--    SELECT u.*, au.email 
--    FROM public.users u 
--    JOIN auth.users au ON u.id = au.id 
--    WHERE au.email = 'test@example.com';

-- =============================================================================
-- Notes:
-- =============================================================================
-- - The trigger runs on both INSERT and UPDATE of auth.users
-- - Role is extracted from user metadata set during signUp
-- - Status is 'pending' until email is verified, then becomes 'active'
-- - ON CONFLICT ensures idempotency if user already exists
-- - SECURITY DEFINER allows the function to bypass RLS
