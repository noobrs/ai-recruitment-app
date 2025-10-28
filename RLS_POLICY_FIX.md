# RLS Policy Error Fix

## 🐛 Error
```
Failed to create job seeker profile: new row violates row-level security policy for table "job_seeker"
```

## 🔍 Root Cause
You have RLS policies for the `users` table, but **NOT for the `job_seeker` table**. When the onboarding code tries to insert a record, RLS blocks it.

## ✅ Solution
Add RLS policies for ALL your tables, especially `job_seeker` and `recruiter`.

## 🚀 Quick Fix

### Step 1: Run Complete RLS Policies

Go to **Supabase Dashboard → SQL Editor** and run:

**File:** `database/policies/rls_policies_complete.sql`

Or run this minimal fix for immediate testing:

```sql
-- Enable RLS on job_seeker table
ALTER TABLE public.job_seeker ENABLE ROW LEVEL SECURITY;

-- Allow job seekers to insert their own profile
CREATE POLICY "Job seekers can insert own profile"
  ON public.job_seeker
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow job seekers to view their own profile
CREATE POLICY "Job seekers can view own profile"
  ON public.job_seeker
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow job seekers to update their own profile
CREATE POLICY "Job seekers can update own profile"
  ON public.job_seeker
  FOR UPDATE
  USING (auth.uid() = user_id);
```

### Step 2: Do the Same for Recruiter Table

```sql
-- Enable RLS on recruiter table
ALTER TABLE public.recruiter ENABLE ROW LEVEL SECURITY;

-- Allow recruiters to insert their own profile
CREATE POLICY "Recruiters can insert own profile"
  ON public.recruiter
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow recruiters to view their own profile
CREATE POLICY "Recruiters can view own profile"
  ON public.recruiter
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow recruiters to update their own profile
CREATE POLICY "Recruiters can update own profile"
  ON public.recruiter
  FOR UPDATE
  USING (auth.uid() = user_id);
```

## 📋 Complete RLS Policy Coverage

The full SQL script (`rls_policies_complete.sql`) includes policies for:

1. ✅ **users** - View/update own record
2. ✅ **job_seeker** - CRUD own profile, recruiters can view
3. ✅ **recruiter** - CRUD own profile
4. ✅ **resume** - Job seekers manage own, recruiters view for applications
5. ✅ **company** - All can view, recruiters can create/update
6. ✅ **job** - All can view open jobs, recruiters manage own
7. ✅ **job_requirement** - All can view for open jobs, recruiters manage
8. ✅ **application** - Job seekers apply/view own, recruiters view/update
9. ✅ **notification** - Users view/update own

## 🧪 Test After Fix

1. Clear browser cookies
2. Register with Google OAuth
3. Complete onboarding form
4. Click "Complete Setup"
5. Should now redirect to dashboard ✅

## 🔒 Security Model

### Job Seeker Can:
- ✅ Create/view/update own job_seeker profile
- ✅ Upload/manage own resumes
- ✅ View open jobs
- ✅ Create/view applications
- ✅ View own notifications

### Recruiter Can:
- ✅ Create/view/update own recruiter profile
- ✅ View job seeker profiles (for hiring)
- ✅ Create/manage jobs
- ✅ View applications to their jobs
- ✅ Update application status
- ✅ View resumes for applications

### Everyone (Authenticated) Can:
- ✅ View companies
- ✅ View open jobs

## ✅ Verification

After running the policies, verify with:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'job_seeker', 'recruiter');

-- Expected result:
-- tablename    | rowsecurity
-- users        | t
-- job_seeker   | t
-- recruiter    | t

-- View all policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## 🎯 What This Fixes

Before:
```
User completes onboarding
    ↓
Try to insert into job_seeker
    ↓
❌ RLS blocks: "No policy exists"
    ↓
Error: "violates row-level security policy"
```

After:
```
User completes onboarding
    ↓
Try to insert into job_seeker
    ↓
✅ Policy check: "auth.uid() = user_id" → TRUE
    ↓
Insert succeeds
    ↓
Status set to 'active'
    ↓
Redirect to dashboard ✅
```

## 🎉 Summary

**Problem:** Missing RLS policies for `job_seeker` table  
**Solution:** Add INSERT/SELECT/UPDATE policies  
**File:** `database/policies/rls_policies_complete.sql`  
**Action:** Run the SQL script in Supabase  

After this, your onboarding flow will work! 🚀
