# Authentication System

This document explains the authentication system implemented for the AI Recruitment App.

## Overview

The application uses **Supabase Auth** with support for:
- Email/Password authentication
- Google OAuth (SSO)
- Role-based access control (Job Seeker vs Recruiter)

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── actions/
│   │   └── auth.actions.ts          # Server actions for auth
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts              # OAuth callback handler
│   │   ├── jobseeker/
│   │   │   └── login/
│   │   │       ├── page.tsx          # Job seeker login page (Server Component)
│   │   │       └── LoginPageClient.tsx # Job seeker login client component
│   │   └── recruiter/
│   │       └── login/
│   │           ├── page.tsx          # Recruiter login page (Server Component)
│   │           └── LoginPageClient.tsx # Recruiter login client component
│   ├── api/
│   │   └── auth/
│   │       └── signout/
│   │           └── route.ts          # Sign out API route
│   ├── jobseeker/
│   │   └── dashboard/
│   │       └── page.tsx              # Job seeker dashboard
│   └── recruiter/
│       ├── dashboard/
│       │   └── page.tsx              # Recruiter dashboard
│       └── onboarding/
│           └── page.tsx              # Recruiter onboarding (for OAuth users)
├── components/
│   └── auth/
│       └── AuthForm.tsx              # Reusable auth form component
├── middleware.ts                     # Next.js middleware entry point
└── utils/
    └── supabase/
        └── middleware.ts             # Supabase session management
```

## Authentication Flow

### Email/Password Login

1. User visits `/auth/jobseeker/login` or `/auth/recruiter/login`
2. Enters email and password
3. `signIn()` server action authenticates via Supabase
4. Verifies user role matches expected role
5. Redirects to appropriate dashboard

### Google OAuth Login

1. User clicks "Continue with Google" on login page
2. `signInWithGoogle()` server action initiates OAuth flow
3. User is redirected to Google for authentication
4. Google redirects back to `/auth/callback?role=<role>&code=<code>`
5. Callback handler:
   - Exchanges code for session
   - Checks if user exists in database
   - If existing user: verifies role and redirects to dashboard
   - If new user: creates user record, role-specific profile, and redirects

### Role-Based Access Control

Implemented via Next.js middleware (`src/utils/supabase/middleware.ts`):

- **Public routes**: Landing page (`/`), API routes, static assets
- **Protected routes**: 
  - `/jobseeker/*` - Only accessible to job seekers
  - `/recruiter/*` - Only accessible to recruiters
- **Auth routes**: `/auth/*` - Redirect logged-in users to their dashboard

## Key Components

### Server Actions (`src/app/actions/auth.actions.ts`)

```typescript
signIn(email, password, expectedRole?)
signUpJobSeeker(data)
signUpRecruiter(data)
signInWithGoogle(role)
```

### AuthForm Component (`src/components/auth/AuthForm.tsx`)

Reusable client component that provides:
- Email/password form
- Google SSO button
- Role-specific styling
- Loading states and error handling
- Navigation between login/register and role switching

### OAuth Callback (`src/app/auth/callback/route.ts`)

Handles Google OAuth redirect:
- Exchanges authorization code for session
- Creates or updates user records
- Handles role verification
- Redirects to appropriate dashboard or onboarding

## Database Schema

### Users Table
```sql
users (
  id: uuid (references auth.users)
  email: text
  first_name: text
  last_name: text
  role: user_role_enum ('job_seeker' | 'recruiter')
  status: user_status_enum
  profile_picture_path: text
  updated_at: timestamp
)
```

### Role-Specific Tables
```sql
job_seeker (
  job_seeker_id: serial
  user_id: uuid -> users.id
  location: text
  about_me: text
  created_at: timestamp
)

recruiter (
  recruiter_id: serial
  user_id: uuid -> users.id
  company_id: integer -> company.company_id
  position: text
  created_at: timestamp
)
```

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, update `NEXT_PUBLIC_SITE_URL` to your domain.

### Supabase Configuration

1. **Enable Google OAuth** in Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add OAuth credentials from Google Cloud Console
   - Add authorized redirect URLs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)

2. **Configure email templates** (optional):
   - Go to Authentication > Email Templates
   - Customize confirmation and password reset emails

## Security Features

- **Server-side session management**: All auth state managed server-side via cookies
- **Role verification**: Middleware enforces role-based access on every request
- **CSRF protection**: Built into Supabase Auth
- **Secure cookies**: HTTP-only, Secure, SameSite attributes
- **Password requirements**: Enforced by Supabase (minimum 6 characters by default)

## Best Practices Implemented

1. **Server Components by default**: Login pages are Server Components, only client components where needed
2. **Progressive enhancement**: Forms work without JavaScript
3. **Error handling**: User-friendly error messages for common scenarios
4. **Loading states**: Visual feedback during authentication
5. **Responsive design**: Mobile-first approach with Tailwind CSS
6. **Accessibility**: Proper labels, semantic HTML, keyboard navigation

## Known Limitations & TODOs

1. **Recruiter OAuth flow**: Currently redirects to onboarding page since `company_id` is required
   - TODO: Implement company selection/creation flow in onboarding
   
2. **Password reset**: Not yet implemented
   - TODO: Add "Forgot Password" functionality
   
3. **Email verification**: Not enforced
   - TODO: Add email confirmation requirement
   
4. **Session refresh**: Handled by middleware, but could add refresh token rotation
   
5. **Rate limiting**: Not implemented
   - TODO: Add rate limiting for login attempts

## Usage Examples

### Protecting a Page

```typescript
// app/jobseeker/profile/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/jobseeker/login');
  }
  
  // Page content
}
```

### Getting Current User

```typescript
import { getCurrentUser, getCurrentUserRole } from '@/services/auth.service';

// In a Server Component
const user = await getCurrentUser();
const role = await getCurrentUserRole();
```

### Checking User Role

```typescript
import { isJobSeeker, isRecruiter } from '@/services/auth.service';

if (await isJobSeeker()) {
  // Job seeker specific logic
}

if (await isRecruiter()) {
  // Recruiter specific logic
}
```

## Troubleshooting

### "Invalid credentials" error
- Verify email and password are correct
- Check Supabase auth logs in dashboard

### OAuth redirect not working
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Check authorized redirect URLs in Google Cloud Console and Supabase
- Ensure callback route is accessible

### Role mismatch errors
- User is trying to access wrong portal
- Guide them to correct login page

### Session not persisting
- Check cookie settings in browser
- Verify middleware is configured correctly
- Check `matcher` in `middleware.ts`

## Testing

### Manual Testing Checklist

- [ ] Job seeker can log in with email/password
- [ ] Recruiter can log in with email/password
- [ ] Job seeker can log in with Google
- [ ] Recruiter can log in with Google
- [ ] Wrong role shows error message
- [ ] Invalid credentials show error
- [ ] Logged-in users redirected away from login pages
- [ ] Protected routes require authentication
- [ ] Sign out works correctly
- [ ] Session persists across page refreshes

### Test Accounts

Create test accounts in Supabase:
```sql
-- Via Supabase Auth UI or SQL
```

## Support

For issues or questions:
1. Check Supabase Auth documentation
2. Review middleware logs
3. Check browser console for client-side errors
4. Review server logs for server-side errors
