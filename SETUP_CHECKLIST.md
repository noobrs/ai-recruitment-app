# Complete Setup Checklist - Google OAuth Registration

## 🎯 Issues Found & Fixes

You had **2 critical issues** preventing Google OAuth registration from working:

### Issue 1: ❌ Database Trigger Error
**Error:** `Database error saving new user`  
**Cause:** Trigger trying to insert into non-existent `email` column  
**Fix:** Remove `email` from trigger INSERT statement

### Issue 2: ❌ RLS Policy Error  
**Error:** `new row violates row-level security policy for table "job_seeker"`  
**Cause:** No RLS policies for `job_seeker` table  
**Fix:** Add INSERT/SELECT/UPDATE policies

---

## 🚀 Complete Fix Instructions

### Step 1: Fix Database Trigger (5 minutes)

**Go to:** Supabase Dashboard → SQL Editor

**Run this:**
```sql
-- Drop old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create fixed trigger (without email column)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    status,
    created_at
  )
  VALUES (
    NEW.id,
    'pending',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Verify:**
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
-- Should return 1 row with tgenabled = 'O'
```

---

### Step 2: Add RLS Policies (10 minutes)

**Run the complete RLS script:**

**File:** `database/policies/rls_policies_complete.sql`

**Or run this minimal version:**

```sql
-- ============================================
-- USERS TABLE
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

CREATE POLICY "Users can view own record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own record"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- JOB_SEEKER TABLE
-- ============================================
ALTER TABLE public.job_seeker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Job seekers can view own profile" ON public.job_seeker;
DROP POLICY IF EXISTS "Job seekers can insert own profile" ON public.job_seeker;
DROP POLICY IF EXISTS "Job seekers can update own profile" ON public.job_seeker;

CREATE POLICY "Job seekers can view own profile"
  ON public.job_seeker FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Job seekers can insert own profile"
  ON public.job_seeker FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Job seekers can update own profile"
  ON public.job_seeker FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- RECRUITER TABLE
-- ============================================
ALTER TABLE public.recruiter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can view own profile" ON public.recruiter;
DROP POLICY IF EXISTS "Recruiters can insert own profile" ON public.recruiter;
DROP POLICY IF EXISTS "Recruiters can update own profile" ON public.recruiter;

CREATE POLICY "Recruiters can view own profile"
  ON public.recruiter FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can insert own profile"
  ON public.recruiter FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recruiters can update own profile"
  ON public.recruiter FOR UPDATE
  USING (auth.uid() = user_id);
```

**Verify:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'job_seeker', 'recruiter');
-- All should have rowsecurity = 't' (true)

SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'job_seeker', 'recruiter')
ORDER BY tablename, policyname;
-- Should show 9+ policies
```

---

### Step 3: Clean Up Failed Attempts (Optional)

If you had failed registration attempts, clean them up:

```sql
-- View failed registrations
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
AND au.created_at > NOW() - INTERVAL '1 day';

-- Delete them (CAREFUL!)
-- Only run if you're sure these are test accounts
DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL
  AND au.created_at > NOW() - INTERVAL '1 day'
);
```

---

### Step 4: Test Complete Flow (5 minutes)

#### Test Google OAuth Registration:

1. **Clear browser data:**
   - Open DevTools (F12)
   - Application tab → Clear storage
   - Or use Incognito mode

2. **Start registration:**
   ```
   http://localhost:3000/auth/jobseeker/register
   ```

3. **Click "Continue with Google"**
   - Should redirect to Google ✅
   - Authenticate with your Google account ✅

4. **After Google authentication:**
   - Should redirect to onboarding ✅
   - Name fields pre-filled ✅

5. **Complete profile:**
   - Fill location, about me
   - Click "Complete Setup →"
   - Should redirect to dashboard ✅

#### Verify in Database:

```sql
-- Check the complete registration
SELECT 
  u.id,
  u.status,
  u.role,
  u.first_name,
  u.last_name,
  js.location,
  js.about_me,
  au.email
FROM public.users u
JOIN auth.users au ON u.id = au.id
LEFT JOIN public.job_seeker js ON u.id = js.user_id
WHERE au.email = 'your-google-email@gmail.com';

-- Expected result:
-- status: 'active'
-- role: 'jobseeker'
-- first_name: (your name)
-- location: (what you entered)
-- email: (your Google email)
```

---

## ✅ Success Checklist

After running all fixes, verify:

- [ ] Trigger exists and is enabled
- [ ] Trigger doesn't reference `email` column
- [ ] RLS enabled on `users`, `job_seeker`, `recruiter`
- [ ] At least 3 policies per table (SELECT, INSERT, UPDATE)
- [ ] Google OAuth redirects to Google successfully
- [ ] Callback doesn't show database error
- [ ] Onboarding page loads with pre-filled name
- [ ] Onboarding submission works
- [ ] User redirects to dashboard
- [ ] User record in database has status='active'

---

## 📁 Files Created

1. ✅ `database/triggers/auto_create_user_FIXED.sql` - Fixed trigger
2. ✅ `database/policies/rls_policies_complete.sql` - All RLS policies
3. ✅ `DATABASE_TRIGGER_FIX.md` - Trigger error explanation
4. ✅ `RLS_POLICY_FIX.md` - RLS error explanation
5. ✅ `GOOGLE_SSO_FIX.md` - OAuth redirect fix
6. ✅ `SETUP_CHECKLIST.md` - This file

---

## 🎯 Quick Test Command

After both fixes, test with this flow:

```bash
# 1. Clear browser
# 2. Visit registration
http://localhost:3000/auth/jobseeker/register

# 3. Click Google button
# 4. Should work end-to-end! ✅
```

---

## 🆘 Troubleshooting

### Still getting database error?
- Run the trigger fix again
- Check: `SELECT proname FROM pg_proc WHERE proname = 'handle_new_user'`
- Verify trigger exists: `SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created'`

### Still getting RLS error?
- Run the RLS policies again
- Check: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'job_seeker'`
- Verify policies: `SELECT policyname FROM pg_policies WHERE tablename = 'job_seeker'`

### OAuth not redirecting?
- Check `NEXT_PUBLIC_SITE_URL` in `.env.local`
- Verify Google OAuth credentials in Supabase
- Check redirect URLs match

---

## 🎉 Expected Result

After all fixes:

```
User clicks "Continue with Google"
    ↓
✅ Redirect to Google OAuth
    ↓
✅ User authenticates
    ↓
✅ Callback exchanges code for session
    ↓
✅ Trigger creates public.users record (status='pending')
    ↓
✅ Redirect to onboarding
    ↓
✅ User completes profile
    ↓
✅ RLS allows insert into job_seeker
    ↓
✅ Status updated to 'active'
    ↓
✅ Redirect to dashboard
    ↓
🎊 REGISTRATION COMPLETE!
```

---

## 📞 Need Help?

Check these files for detailed explanations:
- Trigger issue → `DATABASE_TRIGGER_FIX.md`
- RLS issue → `RLS_POLICY_FIX.md`
- OAuth issue → `GOOGLE_SSO_FIX.md`

Your Google OAuth registration should now work perfectly! 🚀
