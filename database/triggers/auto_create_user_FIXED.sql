-- ============================================
-- AUTO-CREATE USER TRIGGER (FIXED)
-- ============================================
-- This trigger automatically creates a basic user record in public.users
-- whenever a new user signs up via Supabase Auth
-- ============================================

-- Step 1: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create the trigger function (FIXED - removed email column)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert basic user record when auth user is created
  -- Role will be set during onboarding based on which portal they used
  INSERT INTO public.users (
    id,
    status,
    created_at
  )
  VALUES (
    NEW.id,
    'pending', -- User needs to complete onboarding
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicates if trigger fires multiple times
  
  RETURN NEW;
END;
$$;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Create helper function to check if user has completed onboarding
CREATE OR REPLACE FUNCTION public.is_user_onboarded(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_status TEXT;
  user_role TEXT;
  has_role_profile BOOLEAN;
BEGIN
  -- Get user status and role
  SELECT status, role INTO user_status, user_role
  FROM public.users
  WHERE id = user_id;
  
  -- If no user record, not onboarded
  IF user_status IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If status is pending, not onboarded
  IF user_status = 'pending' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if role-specific profile exists
  IF user_role = 'jobseeker' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.job_seeker WHERE user_id = user_id
    ) INTO has_role_profile;
  ELSIF user_role = 'recruiter' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.recruiter WHERE user_id = user_id
    ) INTO has_role_profile;
  ELSE
    RETURN FALSE;
  END IF;
  
  RETURN has_role_profile;
END;
$$;

-- Step 5: Create cleanup function for failed registrations (optional)
CREATE OR REPLACE FUNCTION public.cleanup_incomplete_users(older_than_days INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete users who have been pending for more than X days
  WITH deleted AS (
    DELETE FROM public.users
    WHERE status = 'pending'
    AND created_at < NOW() - (older_than_days || ' days')::INTERVAL
    AND role IS NULL -- No role assigned means never started onboarding
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- View pending users
SELECT id, status, role, created_at, first_name, last_name
FROM public.users 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Test inserting a user (for debugging only - don't run in production)
-- This simulates what happens when auth.users gets a new record
/*
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Manually insert into auth.users to test trigger
  INSERT INTO auth.users (id, email)
  VALUES (test_user_id, 'test@example.com');
  
  -- Check if public.users record was created
  RAISE NOTICE 'User created in public.users: %', 
    (SELECT EXISTS(SELECT 1 FROM public.users WHERE id = test_user_id));
END $$;
*/

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. The email is stored in auth.users, not public.users
-- 2. To get user email, join with auth.users or use Supabase Auth API
-- 3. The trigger only creates minimal record - profile completed during onboarding
-- 4. User status flow: pending → active (after onboarding)
-- 5. Clean up old pending users: SELECT public.cleanup_incomplete_users(7);
