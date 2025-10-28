# Database Trigger Error Fix

## 🐛 Error Description

```
GET /auth/callback?error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user&role=jobseeker 307 in 322ms
```

## 🔍 Root Cause

Your database trigger `handle_new_user()` is trying to insert an `email` column into the `public.users` table, but **this column doesn't exist** in your database schema.

### Your Current Trigger (Broken):
```sql
INSERT INTO public.users (
  id,
  email,        -- ❌ ERROR: Column doesn't exist!
  status,
  created_at
)
VALUES (
  NEW.id,
  NEW.email,    -- ❌ This causes the database error
  'pending',
  NOW()
)
```

### Your Actual Schema:
According to `src/types/database.types.ts`, the `users` table has:
- ✅ `id` (string)
- ✅ `created_at` (string)
- ✅ `first_name` (string | null)
- ✅ `last_name` (string | null)
- ✅ `profile_picture_path` (string | null)
- ✅ `role` (enum | null)
- ✅ `status` (enum | null)
- ✅ `updated_at` (string | null)
- ❌ **NO `email` column!**

## ✅ Solution

The email is already stored in `auth.users` table (managed by Supabase Auth). You don't need to duplicate it in `public.users`.

### Fixed Trigger:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert basic user record when auth user is created
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
```

## 🚀 How to Fix

### Step 1: Run the Fixed SQL Script

Go to your Supabase Dashboard → SQL Editor and run this script:

**File:** `database/triggers/auto_create_user_FIXED.sql`

Or copy-paste this:

\`\`\`sql
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create fixed trigger function (without email column)
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
\`\`\`

### Step 2: Verify the Fix

Run this query to check if the trigger was created successfully:

\`\`\`sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
\`\`\`

Expected result:
| tgname | tgenabled |
|--------|-----------|
| on_auth_user_created | O |

### Step 3: Clean Up Failed Registrations (Optional)

If you had failed Google OAuth attempts, you might have orphaned records in `auth.users` without corresponding `public.users` records. Clean them up:

\`\`\`sql
-- View orphaned auth users (no public.users record)
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Delete orphaned auth users (BE CAREFUL!)
-- Only run this if you're sure these are failed registrations
/*
DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL
  AND au.created_at > NOW() - INTERVAL '1 day'  -- Only recent ones
);
*/
\`\`\`

### Step 4: Test Google OAuth Again

1. Clear your browser cookies for localhost
2. Go to: `http://localhost:3000/auth/jobseeker/register`
3. Click "Continue with Google"
4. Authenticate with Google
5. Should now redirect to onboarding page ✅

## 📊 How to Get User Email

Since email is not in `public.users`, here's how to access it:

### Option 1: From Supabase Auth
\`\`\`typescript
const { data: { user } } = await supabase.auth.getUser();
console.log(user.email); // Email from auth.users
\`\`\`

### Option 2: Join Query (if needed)
\`\`\`sql
SELECT 
  pu.id,
  pu.first_name,
  pu.last_name,
  pu.role,
  pu.status,
  au.email  -- Get email from auth.users
FROM public.users pu
JOIN auth.users au ON pu.id = au.id
WHERE pu.id = 'user-uuid-here';
\`\`\`

### Option 3: Your Current Code (Already Correct!)
Your onboarding pages already get email from auth:

\`\`\`typescript
// In src/app/auth/jobseeker/onboarding/page.tsx
const { data: { user } } = await supabase.auth.getUser();
const email = user?.email ?? ''; // ✅ Gets email from auth.users
\`\`\`

## 🎯 Data Architecture

\`\`\`
┌─────────────────────┐     ┌─────────────────────┐
│   auth.users        │     │   public.users      │
│  (Supabase Auth)    │     │  (Your App Data)    │
├─────────────────────┤     ├─────────────────────┤
│ id (UUID)           │────▶│ id (UUID) [FK]      │
│ email               │     │ first_name          │
│ encrypted_password  │     │ last_name           │
│ email_confirmed_at  │     │ role                │
│ created_at          │     │ status              │
│ ... (auth fields)   │     │ profile_picture_path│
└─────────────────────┘     │ created_at          │
                            │ updated_at          │
                            └─────────────────────┘
                                     │
                    ┌────────────────┴─────────────────┐
                    ▼                                  ▼
        ┌──────────────────┐              ┌──────────────────┐
        │  job_seeker      │              │  recruiter       │
        ├──────────────────┤              ├──────────────────┤
        │ user_id [FK]     │              │ user_id [FK]     │
        │ location         │              │ company_id [FK]  │
        │ about_me         │              │ position         │
        └──────────────────┘              └──────────────────┘
\`\`\`

## ✅ Verification Checklist

After running the fix:

- [ ] Trigger exists in database
- [ ] Function doesn't reference email column
- [ ] Google OAuth registration works
- [ ] User record created in public.users with status='pending'
- [ ] No database errors in callback
- [ ] Onboarding page receives user email
- [ ] Profile completion works
- [ ] User redirects to dashboard

## 🎉 Expected Flow After Fix

\`\`\`
User clicks "Continue with Google"
    ↓
Redirects to Google OAuth
    ↓
Google authenticates user
    ↓
Callback receives code
    ↓
Exchange code for session
    ↓
NEW: Supabase creates auth.users record
    ↓
TRIGGER: Auto-creates public.users record ✅
    {
      id: <uuid>,
      status: 'pending',
      created_at: <timestamp>,
      role: null,
      first_name: null,
      last_name: null
    }
    ↓
Callback checks user status
    ↓
Status is 'pending' → Redirect to onboarding
    ↓
User completes profile
    ↓
Updates public.users + creates job_seeker
    ↓
Status set to 'active'
    ↓
Redirect to dashboard ✅
\`\`\`

## 🔧 Alternative: Add Email Column (Not Recommended)

If you really want to store email in public.users:

\`\`\`sql
-- Add email column to public.users
ALTER TABLE public.users 
ADD COLUMN email TEXT;

-- Add unique constraint
ALTER TABLE public.users 
ADD CONSTRAINT users_email_key UNIQUE (email);

-- Update trigger to include email
-- (Use your original trigger code)
\`\`\`

**However, this is NOT recommended because:**
- ❌ Data duplication
- ❌ Sync issues if user changes email
- ❌ auth.users is already the source of truth
- ❌ More complex to maintain

## 📝 Summary

**Problem:** Trigger tried to insert non-existent `email` column  
**Solution:** Remove `email` from INSERT statement  
**Result:** Google OAuth registration now works! ✅

Run the fixed SQL script and test again! 🚀
