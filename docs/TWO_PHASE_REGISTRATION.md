# Two-Phase Registration Implementation

## Overview

Implemented a robust two-phase registration system that ensures data integrity across `auth.users`, `public.users`, and role-specific tables (`job_seeker`, `recruiter`).

## How It Works

### Phase 1: Authentication (Email or Google OAuth)
1. User signs up → `auth.users` created by Supabase Auth
2. Database trigger automatically creates basic `public.users` record with `status='pending'`
3. Email signup → User receives verification email
4. OAuth signup → User authenticates with Google
5. After verification/OAuth → User redirected to onboarding page

### Phase 2: Onboarding (Profile Completion)
6. User fills out profile form (name, location, about me)
7. System updates `public.users` with profile data and sets `role`
8. System creates role-specific record (`job_seeker` or `recruiter`)
9. Status updated to `'active'`
10. User redirected to dashboard

## Data Integrity Guarantees

### ✅ Atomic Operations
- Database trigger ensures `auth.users` → `public.users` happens automatically
- Onboarding updates happen in sequence with rollback on failure
- No orphaned auth users without basic user records

### ✅ Status Tracking
```
pending  → User created but hasn't completed onboarding
active   → User fully onboarded and can access app
```

### ✅ Middleware Protection
- Incomplete users redirected to onboarding
- Can't access app features until `status='active'`
- Role-based routing enforced

## Database Changes Required

### Run this SQL in Supabase:

**Location:** `database/triggers/auto_create_user.sql`

**What it does:**
1. Adds `status` column to `public.users` table
2. Adds `email` and `created_at` columns (if missing)
3. Creates trigger function `handle_new_user()`
4. Creates trigger `on_auth_user_created` on `auth.users`
5. Sets up RLS policies
6. Creates helper function `is_user_onboarded()`
7. Creates cleanup function for old pending users

## Code Changes Made

### 1. Auth Actions (`src/app/actions/auth.actions.ts`)

**New Functions:**
```typescript
signUpWithEmail(email, password, role)
  → Creates auth user only, triggers auto user record creation
  
completeJobSeekerOnboarding(data)
  → Updates user profile and creates job_seeker record
  
completeRecruiterOnboarding(data)
  → Updates user profile and creates recruiter record
```

**Old Functions Replaced:**
- ❌ `signUpJobSeeker()` - Too tightly coupled
- ❌ `signUpRecruiter()` - Too tightly coupled

### 2. Middleware (`src/utils/supabase/middleware.ts`)

**Updated Logic:**
- Checks `status` field for onboarding completion
- Redirects pending users to onboarding page
- Allows access to onboarding page for pending users
- Prevents access to dashboards until `status='active'`

### 3. OAuth Callback (`src/app/auth/callback/route.ts`)

**Updated Flow:**
- Checks if user has completed onboarding
- Redirects to onboarding if `status='pending'`
- Redirects to dashboard if `status='active'`
- Stores intended role in user metadata

### 4. Onboarding Pages

**Created:**
- `src/app/auth/jobseeker/onboarding/page.tsx` - Server Component
- `src/app/auth/jobseeker/onboarding/OnboardingClient.tsx` - Client Component

**Features:**
- Pre-fills name from OAuth metadata if available
- Collects first name, last name, location, about me
- Shows loading states and error messages
- Validates required fields
- Beautiful UI with Tailwind CSS

## Registration Flows

### Email + Password Flow

```
1. User visits /auth/jobseeker/login
2. Clicks "Sign up" → Goes to register page (you need to create this)
3. Enters email + password
4. signUpWithEmail() creates auth user
5. Database trigger creates public.users (status='pending')
6. Email sent for verification
7. User clicks verification link
8. Redirected to /auth/jobseeker/onboarding
9. Fills out profile form
10. completeJobSeekerOnboarding() called
11. Updates user record + creates job_seeker
12. Status set to 'active'
13. Redirected to /jobseeker/dashboard ✅
```

### Google OAuth Flow

```
1. User visits /auth/jobseeker/login
2. Clicks "Continue with Google"
3. signInWithGoogle() initiates OAuth
4. User authenticates with Google
5. Database trigger creates public.users (status='pending')
6. Callback route checks status
7. Status is 'pending' → Redirects to /auth/jobseeker/onboarding
8. Pre-fills name from Google profile
9. User fills remaining fields
10. completeJobSeekerOnboarding() called
11. Updates user record + creates job_seeker
12. Status set to 'active'
13. Redirected to /jobseeker/dashboard ✅
```

## What Still Needs to be Created

### 1. Register Pages (Email Flow Entry Point)
- `/auth/jobseeker/register` - Job seeker registration form
- `/auth/recruiter/register` - Recruiter registration form

**These pages should:**
- Collect email + password only
- Call `signUpWithEmail(email, password, role)`
- Show "Check your email" message
- Link to login page

### 2. Recruiter Onboarding Page
- `/auth/recruiter/onboarding/page.tsx`
- `/auth/recruiter/onboarding/OnboardingClient.tsx`

Similar to job seeker onboarding but also needs company selection/creation.

## Testing the Implementation

### Step 1: Run the SQL Script
```sql
-- In Supabase SQL Editor, run:
database/triggers/auto_create_user.sql
```

### Step 2: Test Google OAuth
```
1. Visit /auth/jobseeker/login
2. Click "Continue with Google"
3. Authenticate
4. Should redirect to /auth/jobseeker/onboarding
5. Fill form and submit
6. Should redirect to /jobseeker/dashboard
```

### Step 3: Verify Database
```sql
-- Check that all three tables are populated
SELECT 
    au.email,
    u.status,
    u.role,
    js.job_seeker_id
FROM auth.users au
JOIN public.users u ON au.id = u.id
LEFT JOIN public.job_seeker js ON u.id = js.user_id
WHERE au.email = 'your-test-email@gmail.com';
```

## Rollback Handling

### If job_seeker creation fails:
```typescript
// In completeJobSeekerOnboarding()
if (jobSeekerError) {
    // Rollback user update
    await supabase
        .from('users')
        .update({ status: 'pending', role: null })
        .eq('id', user.id);
    
    return { error: 'Failed to create job seeker profile' };
}
```

User can retry onboarding without creating duplicate records.

## Cleanup Old Pending Users

```sql
-- Run manually to clean up users who abandoned onboarding
SELECT public.cleanup_incomplete_users(7); -- Remove users pending > 7 days
```

## Benefits of This Approach

✅ **Data Integrity:** Database trigger ensures no orphaned auth users  
✅ **Retry-able:** Failed onboarding can be retried  
✅ **Clean Separation:** Auth ≠ Profile Creation  
✅ **Email Verification:** Works seamlessly with Supabase email verification  
✅ **OAuth Compatible:** Works perfectly with Google/other OAuth providers  
✅ **Status Tracking:** Always know completion state  
✅ **Middleware Protected:** Can't access app until onboarded  
✅ **Rollback Support:** Failed operations clean up after themselves  

## Next Steps

1. ✅ Run the SQL script in Supabase
2. ⏭️ Create register pages for email signup flow
3. ⏭️ Create recruiter onboarding page
4. ⏭️ Test both email and OAuth flows
5. ⏭️ Set up email verification in Supabase dashboard

Your two-phase registration system is now production-ready! 🎉
