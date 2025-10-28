# Visual Registration Flow Diagram

## 🎯 Job Seeker Registration - Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REGISTRATION ENTRY POINTS                            │
└─────────────────────────────────────────────────────────────────────────────┘

    /auth/jobseeker/login                    /auth/jobseeker/register
    ┌──────────────────────┐                ┌──────────────────────┐
    │   Login Page         │                │   Register Page      │
    │                      │                │                      │
    │  [Email]             │                │  [Email]             │
    │  [Password]          │                │  [Password]          │
    │                      │     ┌──────────│  [Confirm Password]  │
    │  [Sign in]           │     │          │  [✓] Terms           │
    │                      │     │          │                      │
    │  "Don't have an      │─────┘          │  [Create Account]    │
    │   account? Sign up"  │                │                      │
    │                      │                │  "Already have an    │
    │  [Continue with      │◄───────────────│   account? Sign in"  │
    │   Google]            │                │                      │
    │                      │                │  [Continue with      │
    │                      │                │   Google]            │
    └──────────────────────┘                └──────────────────────┘
              │                                       │
              │                                       │
              └───────────────┬───────────────────────┘
                              │
                              ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION METHODS                               │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐              ┌─────────────────────┐
    │  Email + Password   │              │   Google OAuth      │
    │                     │              │                     │
    │  signUpWithEmail()  │              │  signInWithGoogle() │
    │        ↓            │              │        ↓            │
    │  Creates auth.users │              │  Google popup       │
    │        ↓            │              │        ↓            │
    │  Trigger creates    │              │  Creates auth.users │
    │  public.users       │              │        ↓            │
    │  (status: pending)  │              │  Trigger creates    │
    │        ↓            │              │  public.users       │
    │  Send verification  │              │  (status: pending)  │
    │  email              │              │        ↓            │
    │        ↓            │              │  Auto-authenticated │
    └─────────────────────┘              └─────────────────────┘
              │                                       │
              │                                       │
              │   ┌────────────────────┐             │
              └───│  Email Verified?   │◄────────────┘
                  │  (Click link)      │
                  └────────────────────┘
                              │
                              ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                    ONBOARDING PAGE (Step 2 of 3)                             │
└─────────────────────────────────────────────────────────────────────────────┘

    /auth/jobseeker/onboarding
    ┌────────────────────────────────────────────────────────────┐
    │                                                            │
    │  ○══●══○  Step 2 of 3                                     │
    │  Register → Complete Profile → Dashboard                  │
    │                                                            │
    │  ┌─────────────────────────────────────────────────────┐  │
    │  │  Complete Your Profile                              │  │
    │  │  Signed in as: user@example.com                     │  │
    │  └─────────────────────────────────────────────────────┘  │
    │                                                            │
    │  Profile Picture (Optional)                                │
    │  ┌────┐  ┌────────────────────────────────┐              │
    │  │ 👤 │  │  [Upload a photo] or drag/drop  │              │
    │  └────┘  └────────────────────────────────────┘              │
    │                                                            │
    │  First Name*        Last Name*                             │
    │  [John        ]     [Doe      ]                            │
    │                                                            │
    │  Location                                                  │
    │  [New York, NY                    ]                        │
    │                                                            │
    │  About Me                                                  │
    │  ┌──────────────────────────────────────────────┐         │
    │  │ I'm a software developer...                  │         │
    │  │                                              │         │
    │  └──────────────────────────────────────────────┘         │
    │                                                            │
    │  [← Back]              [Complete Setup →]                 │
    │                                                            │
    │  * Required fields                                         │
    └────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  completeJobSeekerOnboarding()
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Update public.users:         │
              │  - first_name, last_name      │
              │  - role: 'jobseeker'          │
              │  - status: 'pending'          │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Insert into job_seeker:      │
              │  - user_id                    │
              │  - location                   │
              │  - about_me                   │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Update public.users:         │
              │  - status: 'active'           │
              └───────────────────────────────┘
                              │
                              ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DASHBOARD (Complete!)                               │
└─────────────────────────────────────────────────────────────────────────────┘

    /jobseeker/dashboard
    ┌────────────────────────────────────────────────────────────┐
    │                                                            │
    │  Welcome, John Doe! 🎉                                     │
    │                                                            │
    │  [Browse Jobs] [My Applications] [Profile]                 │
    │                                                            │
    │  ✅ Registration Complete                                  │
    │  ✅ Profile Set Up                                         │
    │  ✅ Ready to Apply                                         │
    │                                                            │
    └────────────────────────────────────────────────────────────┘

```

---

## 🔄 Data Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│  auth.users  │────▶│ public.users │────▶│ job_seeker   │
│              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
      Step 1              Step 1              Step 2
   (Auto-trigger)      (Auto-trigger)     (Onboarding)

  id: uuid            id: uuid            user_id: uuid
  email: string       first_name: null    location: string
  created_at          last_name: null     about_me: text
                      role: null          created_at
                      status: 'pending'   
                      ↓
                      (After onboarding)
                      first_name: 'John'
                      last_name: 'Doe'
                      role: 'jobseeker'
                      status: 'active'
```

---

## 🎨 Component Hierarchy

```
RegisterPage (Server Component)
│
└── RegisterPageClient (Client Component)
    │
    ├── FormContainer
    │   └── [title, subtitle, children]
    │
    ├── SocialButton
    │   └── [Google OAuth]
    │
    └── FormInput (x3)
        ├── Email
        ├── Password
        └── Confirm Password

OnboardingPage (Server Component)
│
└── OnboardingClient (Client Component)
    │
    ├── FormContainer
    │   └── [maxWidth: '2xl']
    │
    ├── ProgressStepper
    │   └── [3 steps: Register, Profile, Dashboard]
    │
    ├── ProfilePictureUpload
    │   └── [Drag & drop, preview]
    │
    └── FormInput (x4)
        ├── First Name
        ├── Last Name
        ├── Location
        └── About Me (textarea)
```

---

## 📊 State Management Flow

```
RegisterPageClient State:
┌─────────────────────────────┐
│ isLoading: false → true     │
│ error: null → "Error msg"   │
│ successMessage: null → msg  │
│ fieldErrors: {}             │
└─────────────────────────────┘

OnboardingClient State:
┌─────────────────────────────┐
│ isLoading: false → true     │
│ error: null → "Error msg"   │
│ profilePicture: null → File │
└─────────────────────────────┘
```

---

## 🔐 Middleware Protection Flow

```
User visits URL
    ↓
Middleware checks session
    ↓
┌────────────────────┐
│ Has auth session?  │
└────────────────────┘
    ↓           ↓
   NO          YES
    ↓           ↓
Allow       Check user record
access       in public.users
             ↓
         ┌────────────────────┐
         │ status: 'pending'? │
         └────────────────────┘
             ↓           ↓
           YES          NO
             ↓           ↓
         Redirect to  Redirect to
         onboarding   dashboard
```

---

## 🚦 Error Handling Flow

```
Form Submission
    ↓
Client-side validation
    ↓
┌─────────────────────┐
│ Validation passes?  │
└─────────────────────┘
    ↓           ↓
   NO          YES
    ↓           ↓
Show error   Call server action
in form       ↓
         ┌─────────────────────┐
         │ Server action OK?   │
         └─────────────────────┘
             ↓           ↓
            NO          YES
             ↓           ↓
         Show error   Update DB
         message       ↓
                  ┌─────────────────────┐
                  │ DB update success?  │
                  └─────────────────────┘
                      ↓           ↓
                     NO          YES
                      ↓           ↓
                  Rollback    Redirect
                  Show error  to next step
```

---

## 🎯 Success Criteria Checklist

Registration is complete when:
- ✅ auth.users record exists
- ✅ public.users record exists
- ✅ public.users.status = 'active'
- ✅ public.users.role = 'jobseeker'
- ✅ public.users.first_name is set
- ✅ public.users.last_name is set
- ✅ job_seeker record exists
- ✅ User redirected to /jobseeker/dashboard

---

## 📱 Responsive Breakpoints

```
Mobile (< 640px):
- Stack all fields vertically
- Compact progress stepper
- Full-width buttons
- Hide detailed step labels

Tablet (640px - 1024px):
- 2-column name fields
- Full progress stepper
- Side-by-side buttons

Desktop (> 1024px):
- Same as tablet
- Larger form container
- More padding/spacing
```

---

## 🔄 Reusability for Recruiter Flow

To create recruiter registration, simply:

1. Copy `/auth/jobseeker/register` → `/auth/recruiter/register`
2. Change `'jobseeker'` → `'recruiter'` in server actions
3. Copy onboarding structure
4. Add company selection/creation fields
5. Update server action to `completeRecruiterOnboarding()`

All components are role-agnostic and fully reusable! 🎉
