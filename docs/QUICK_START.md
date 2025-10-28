# Quick Start - Testing the Login System

## Prerequisites
- ✅ Next.js development server running
- ✅ Supabase project set up
- ✅ Environment variables in `.env.local`

## Test the Login System in 5 Minutes

### Step 1: Create a Test User in Supabase

Go to your Supabase Dashboard → Authentication → Users → Add User

**Job Seeker Test Account:**
```
Email: jobseeker@test.com
Password: password123
```

After creating, add to database:
```sql
-- In Supabase SQL Editor
INSERT INTO users (id, email, first_name, last_name, role)
VALUES (
  '<user-id-from-auth>',
  'jobseeker@test.com',
  'Test',
  'JobSeeker',
  'job_seeker'
);

INSERT INTO job_seeker (user_id)
VALUES ('<user-id-from-auth>');
```

**Recruiter Test Account:**
```
Email: recruiter@test.com
Password: password123
```

After creating, add to database:
```sql
-- First, create a test company
INSERT INTO company (comp_name)
VALUES ('Test Company')
RETURNING company_id; -- Note this ID

-- Then create user and recruiter
INSERT INTO users (id, email, first_name, last_name, role)
VALUES (
  '<user-id-from-auth>',
  'recruiter@test.com',
  'Test',
  'Recruiter',
  'recruiter'
);

INSERT INTO recruiter (user_id, company_id)
VALUES ('<user-id-from-auth>', <company-id-from-above>);
```

### Step 2: Start the Server

```bash
npm run dev
```

### Step 3: Test Login Flow

#### Test 1: Job Seeker Email Login
1. Open: http://localhost:3000/auth/jobseeker/login
2. Enter:
   - Email: `jobseeker@test.com`
   - Password: `password123`
3. Click "Sign in"
4. ✅ Should redirect to `/jobseeker/dashboard`
5. ✅ Should see "Welcome back, Test!"

#### Test 2: Recruiter Email Login
1. Open: http://localhost:3000/auth/recruiter/login
2. Enter:
   - Email: `recruiter@test.com`
   - Password: `password123`
3. Click "Sign in"
4. ✅ Should redirect to `/recruiter/dashboard`
5. ✅ Should see "Welcome back, Test!"

#### Test 3: Google OAuth (Job Seeker)
1. Open: http://localhost:3000/auth/jobseeker/login
2. Click "Continue with Google"
3. Select Google account
4. ✅ Should redirect to `/jobseeker/dashboard`
5. ✅ New user record created automatically

#### Test 4: Google OAuth (Recruiter)
1. Open: http://localhost:3000/auth/recruiter/login
2. Click "Continue with Google"
3. Select Google account
4. ✅ Should redirect to `/recruiter/onboarding`
5. ✅ Needs company setup (expected behavior)

#### Test 5: Route Protection
1. Sign out from dashboard
2. Try to access: http://localhost:3000/jobseeker/dashboard
3. ✅ Should redirect to `/auth/jobseeker/login`
4. Try to access: http://localhost:3000/recruiter/dashboard
5. ✅ Should redirect to `/auth/recruiter/login`

#### Test 6: Role Verification
1. Log in as job seeker
2. Try to access: http://localhost:3000/recruiter/dashboard
3. ✅ Should redirect to `/auth/jobseeker/login` with error

#### Test 7: Landing Page
1. Open: http://localhost:3000
2. ✅ Should see modern landing page
3. ✅ "I'm Looking for a Job" button → `/auth/jobseeker/login`
4. ✅ "I'm Hiring Talent" button → `/auth/recruiter/login`

### Step 4: Google OAuth Setup (Optional)

If you want to test Google SSO:

1. **Create OAuth Credentials:**
   - Go to: https://console.cloud.google.com
   - Create new project or select existing
   - Enable "Google+ API"
   - Credentials → Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     http://localhost:3000/auth/callback
     https://<your-project>.supabase.co/auth/v1/callback
     ```

2. **Configure in Supabase:**
   - Dashboard → Authentication → Providers
   - Enable Google
   - Paste Client ID and Client Secret
   - Save

3. **Test:**
   - Click "Continue with Google" on login page
   - Should work seamlessly

## Common Issues & Solutions

### Issue: "Invalid credentials"
**Solution:** Verify the email/password are correct in Supabase Auth

### Issue: "Failed to create user profile"
**Solution:** Check that the user record exists in the `users` table

### Issue: OAuth not working
**Solution:** 
1. Verify `NEXT_PUBLIC_SITE_URL` in `.env.local`
2. Check redirect URIs in Google Cloud Console
3. Ensure Google provider is enabled in Supabase

### Issue: Redirect loop
**Solution:** Clear cookies and try again. Check middleware logs.

### Issue: Role mismatch
**Solution:** Verify the `role` field in `users` table matches the login portal

## What to Check

✅ Environment variables loaded:
```bash
# Check in browser console (dev tools)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

✅ Supabase connection working:
```
Visit: http://localhost:3000/api/test-supabase
Should show: {"message":"Supabase connected successfully"}
```

✅ Middleware active:
```
Check browser Network tab for Set-Cookie headers
```

## Success Indicators

When everything works:
- ✅ Login redirects to correct dashboard
- ✅ Dashboard shows user's first name
- ✅ Protected routes redirect unauthorized users
- ✅ Sign out works and redirects to home
- ✅ Google OAuth creates new user profiles
- ✅ Role switching links work
- ✅ Error messages are user-friendly

## Next Steps After Testing

1. **Add More Test Data:**
   - Create sample jobs
   - Create sample applications
   - Test the full workflow

2. **Customize the UI:**
   - Update colors in Tailwind config
   - Add your logo
   - Customize text and messaging

3. **Implement Features:**
   - Build job browsing page
   - Create application submission flow
   - Add resume upload
   - Build recruiter job posting

4. **Security Hardening:**
   - Enable email verification
   - Add rate limiting
   - Implement password complexity rules
   - Add session timeout

## Support

If you run into issues:
1. Check browser console for errors
2. Check terminal for server errors
3. Review `docs/AUTHENTICATION.md` for details
4. Check Supabase logs in dashboard

Happy testing! 🚀
