# Email Registration & Role Assignment Fix

## 🐛 Issues Found

### Issue 1: Email Verification Doesn't Redirect to Onboarding
**Problem:** After clicking email verification link, user doesn't get redirected to onboarding page.

**Cause:** The `emailRedirectTo` URL was missing the `role` parameter, so the callback route didn't know which onboarding page to redirect to.

**Before:**
```typescript
emailRedirectTo: `${SITE_URL}/auth/jobseeker/onboarding`
// ❌ Direct to onboarding, but callback route expects role param
```

**After:**
```typescript
emailRedirectTo: `${SITE_URL}/auth/callback?role=jobseeker`
// ✅ Goes through callback which properly routes to onboarding
```

---

### Issue 2: Login Shows "Please use the jobseeker login"
**Problem:** After email registration but before onboarding, trying to login shows error: "Please use the jobseeker login"

**Cause:** Role was `NULL` during pending state. When you tried to login, the code checked if `role === 'jobseeker'` and it was NULL, so it failed.

**Before:**
```sql
-- User record after registration
id: uuid
role: NULL          ❌ Not set yet
status: 'pending'
```

**After:**
```sql
-- User record after registration
id: uuid
role: 'jobseeker'   ✅ Set immediately
status: 'pending'
```

---

### Issue 3: Should Role Be Set Even in Pending State?
**Answer:** YES! ✅

**Benefits:**
1. ✅ User can login before completing onboarding
2. ✅ System knows which onboarding page to show
3. ✅ Prevents "wrong role" errors
4. ✅ Simplifies login logic
5. ✅ Matches user's original registration choice

**New Flow:**
```
Registration → role='jobseeker', status='pending'
    ↓
Email Verification → Redirect to callback
    ↓
Callback checks role → Redirect to jobseeker/onboarding
    ↓
Complete Onboarding → status='active' (role stays 'jobseeker')
    ↓
Login → Check role + status → Redirect accordingly
```

---

## ✅ Fixes Applied

### Fix 1: Update Email Redirect URL
**File:** `src/app/actions/auth.actions.ts`

```typescript
export async function signUpWithEmail(email: string, password: string, role: 'jobseeker' | 'recruiter') {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // ✅ FIXED: Add role parameter to callback
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?role=${role}`,
            data: {
                role: role,
            },
        },
    });

    // ✅ FIXED: Set role immediately in public.users
    if (authData.user) {
        await supabase
            .from('users')
            .update({ role: role })
            .eq('id', authData.user.id);
    }

    return { success: true, message: 'Check your email' };
}
```

### Fix 2: Update Login to Handle Pending Users
**File:** `src/app/actions/auth.actions.ts`

```typescript
export async function signIn(email: string, password: string, expectedRole?: 'jobseeker' | 'recruiter') {
    const { data: authData } = await supabase.auth.signInWithPassword({ email, password });

    // ✅ FIXED: Get both role AND status
    const { data: user } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', authData.user.id)
        .single();

    // Verify role matches
    if (expectedRole && user?.role !== expectedRole) {
        return { error: `Please use the ${expectedRole} login` };
    }

    // ✅ FIXED: Check status and redirect to onboarding if pending
    if (user?.status === 'pending') {
        const rolePath = user.role === 'recruiter' ? 'recruiter' : 'jobseeker';
        redirect(`/auth/${rolePath}/onboarding`);
    }

    // Active users go to dashboard
    if (user?.role === 'jobseeker') {
        redirect('/jobseeker/dashboard');
    } else if (user?.role === 'recruiter') {
        redirect('/recruiter/dashboard');
    }
}
```

### Fix 3: Update Callback to Use Role from Database
**File:** `src/app/auth/callback/route.ts`

```typescript
if (existingUser) {
    if (existingUser.status === 'active' && existingUser.role) {
        // Redirect to dashboard
        const dashboard = existingUser.role === 'jobseeker' 
            ? '/jobseeker/dashboard' 
            : '/recruiter/dashboard';
        return NextResponse.redirect(`${origin}${dashboard}`);
    }

    // ✅ FIXED: Use role from database (already set) or fall back to URL param
    const userRole = existingUser.role || role;
    const onboardingPath = roleToPath(userRole as 'jobseeker' | 'recruiter');
    return NextResponse.redirect(`${origin}/auth/${onboardingPath}/onboarding`);
}
```

---

## 🎯 New Registration & Login Flow

### Email + Password Registration Flow:

```
1. User visits /auth/jobseeker/register
    ↓
2. Fills email + password, clicks "Create Account"
    ↓
3. signUpWithEmail() called
    ↓
4. Creates auth.users record
    ↓
5. Trigger creates public.users (status='pending', role=NULL)
    ↓
6. Code immediately updates role to 'jobseeker' ✅
    ↓
7. Sends verification email with callback URL:
   ${SITE_URL}/auth/callback?role=jobseeker
    ↓
8. User clicks verification link in email
    ↓
9. Callback route exchanges code for session
    ↓
10. Checks public.users → finds role='jobseeker', status='pending'
    ↓
11. Redirects to /auth/jobseeker/onboarding ✅
    ↓
12. User completes profile
    ↓
13. Status updated to 'active'
    ↓
14. Redirects to /jobseeker/dashboard ✅
```

### Login Before Onboarding Complete:

```
Scenario: User registered, verified email, but didn't complete onboarding

1. User visits /auth/jobseeker/login
    ↓
2. Enters email + password
    ↓
3. signIn() authenticates user
    ↓
4. Queries public.users → role='jobseeker', status='pending'
    ↓
5. Role matches expected ✅
    ↓
6. Status is 'pending' → Redirect to /auth/jobseeker/onboarding ✅
    ↓
7. User completes onboarding
    ↓
8. Next login goes straight to dashboard
```

### Login After Onboarding Complete:

```
1. User visits /auth/jobseeker/login
    ↓
2. Enters email + password
    ↓
3. signIn() authenticates user
    ↓
4. Queries public.users → role='jobseeker', status='active'
    ↓
5. Role matches ✅, Status is active ✅
    ↓
6. Redirect to /jobseeker/dashboard ✅
```

---

## 🗄️ Database State at Each Step

### After Registration:
```sql
-- auth.users
id: uuid-123
email: user@example.com
email_confirmed_at: NULL  (not verified yet)

-- public.users
id: uuid-123
role: 'jobseeker'  ✅ SET IMMEDIATELY
status: 'pending'
first_name: NULL
last_name: NULL
```

### After Email Verification:
```sql
-- auth.users
id: uuid-123
email: user@example.com
email_confirmed_at: 2025-10-28 12:00:00  ✅ Verified

-- public.users (unchanged)
id: uuid-123
role: 'jobseeker'
status: 'pending'
first_name: NULL
last_name: NULL
```

### After Onboarding:
```sql
-- public.users
id: uuid-123
role: 'jobseeker'
status: 'active'      ✅ Changed
first_name: 'John'    ✅ Added
last_name: 'Doe'      ✅ Added

-- job_seeker
user_id: uuid-123     ✅ Created
location: 'New York'
about_me: '...'
```

---

## ✅ Benefits of Setting Role Early

### 1. **Flexible Login**
Users can login at any time, even before completing onboarding.

### 2. **Better UX**
No confusing "wrong role" errors when trying to login.

### 3. **Simpler Logic**
One source of truth for role (database), not dependent on URL params.

### 4. **Persistent Role**
Role is set based on user's original registration choice, not session data.

### 5. **Resume Onboarding**
If user abandons onboarding, they can login later and resume from onboarding page.

---

## 🧪 Testing Checklist

### Test Email Registration:
- [ ] Register with email on `/auth/jobseeker/register`
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Should redirect to `/auth/jobseeker/onboarding` ✅
- [ ] Complete onboarding
- [ ] Should redirect to `/jobseeker/dashboard` ✅

### Test Login Before Onboarding:
- [ ] Register with email (don't complete onboarding)
- [ ] Try to login on `/auth/jobseeker/login`
- [ ] Should redirect to `/auth/jobseeker/onboarding` ✅
- [ ] NOT show "Please use jobseeker login" error ✅

### Test Login After Onboarding:
- [ ] Complete full registration + onboarding
- [ ] Logout
- [ ] Login on `/auth/jobseeker/login`
- [ ] Should redirect to `/jobseeker/dashboard` ✅

### Test Wrong Role:
- [ ] Register as jobseeker
- [ ] Try to login on `/auth/recruiter/login`
- [ ] Should show "Please use the recruiter login" error ✅

---

## 📊 Status & Role Matrix

| Scenario | Role | Status | Login Result |
|----------|------|--------|--------------|
| Just registered | jobseeker | pending | → onboarding |
| Email verified | jobseeker | pending | → onboarding |
| Onboarding done | jobseeker | active | → dashboard |
| Wrong login page | jobseeker | * | Error message |
| No role set | NULL | pending | Error (should not happen now) |

---

## 🎉 Summary

**Problems Fixed:**
1. ✅ Email verification now redirects to onboarding
2. ✅ Login works before onboarding is complete
3. ✅ No more "Please use jobseeker login" errors
4. ✅ Role is set immediately during registration

**Files Changed:**
1. `src/app/actions/auth.actions.ts` - signUpWithEmail() and signIn()
2. `src/app/auth/callback/route.ts` - Better role handling

**Key Improvement:**
Role is now assigned **immediately during registration** (even in pending state), making the entire flow more robust and user-friendly! 🚀
