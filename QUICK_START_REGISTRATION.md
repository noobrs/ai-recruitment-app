# Quick Start - Job Seeker Registration Flow

## 🚀 How to Test

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Registration Flow

#### Option A: Email Registration
1. Visit: `http://localhost:3000/auth/jobseeker/register`
2. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - ✓ Accept Terms & Conditions
3. Click "Create Account"
4. Check your email for verification link
5. Click verification link
6. You'll be redirected to onboarding
7. Fill in profile details
8. Click "Complete Setup →"

#### Option B: Google OAuth
1. Visit: `http://localhost:3000/auth/jobseeker/register`
2. Click "Continue with Google"
3. Sign in with Google
4. Auto-redirected to onboarding
5. Name pre-filled from Google
6. Fill remaining details
7. Click "Complete Setup →"

### 3. Navigate the Flow

```
Login Page:
http://localhost:3000/auth/jobseeker/login
→ Click "Sign up" link

Register Page:
http://localhost:3000/auth/jobseeker/register
→ Create account

Onboarding Page:
http://localhost:3000/auth/jobseeker/onboarding
→ Complete profile

Dashboard:
http://localhost:3000/jobseeker/dashboard
```

---

## 📁 Files Created/Modified

### New Components (5)
- ✨ `src/components/auth/FormContainer.tsx`
- ✨ `src/components/auth/FormInput.tsx`
- ✨ `src/components/auth/SocialButton.tsx`
- ✨ `src/components/auth/ProgressStepper.tsx`
- ✨ `src/components/auth/ProfilePictureUpload.tsx`

### New Pages (2)
- ✨ `src/app/auth/jobseeker/register/page.tsx`
- ✨ `src/app/auth/jobseeker/register/RegisterPageClient.tsx`

### Modified (1)
- 🔄 `src/app/auth/jobseeker/onboarding/OnboardingClient.tsx`

### Documentation (2)
- 📄 `REGISTRATION_FLOW_SUMMARY.md`
- 📄 `docs/REGISTRATION_FLOW_DIAGRAM.md`

---

## ✅ What's Working

✅ Email + password registration
✅ Google OAuth registration  
✅ Password validation (match, strength)
✅ Email verification flow
✅ Onboarding with progress stepper
✅ Profile picture UI (upload logic pending)
✅ Form validation
✅ Error handling
✅ Loading states
✅ Responsive design
✅ Navigation between login/register
✅ Role switcher (jobseeker ↔ recruiter)

---

## ⚠️ Pending Implementation

❌ **Profile Picture Upload to Supabase**
   - UI is ready
   - File selection works
   - Need to add storage bucket & upload logic

❌ **Recruiter Registration Flow**
   - Can reuse all components
   - Just need to create `/auth/recruiter/register`

---

## 🔧 Next Steps

### 1. Enable Profile Picture Upload
```typescript
// 1. Create storage bucket in Supabase
// Bucket name: 'profile-pictures'

// 2. Update OnboardingClient.tsx
const handleProfilePictureSelect = async (file: File) => {
    const supabase = createClient();
    const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file);
    
    if (data) {
        setProfilePicturePath(data.path);
    }
};

// 3. Update completeJobSeekerOnboarding in auth.actions.ts
// Add profile_picture_path parameter
```

### 2. Create Recruiter Flow
```bash
# Copy jobseeker register to recruiter
cp -r src/app/auth/jobseeker/register src/app/auth/recruiter/

# Update role from 'jobseeker' to 'recruiter'
# Add company selection in onboarding
```

---

## 🎨 Customization

### Change Colors
In all component files, replace:
- `indigo-600` → Your primary color
- `blue-50` → Your background color

### Modify Form Fields
Edit `OnboardingClient.tsx`:
- Add/remove fields using `<FormInput>` component
- Update server action with new fields

### Adjust Progress Steps
Edit `steps` array in `OnboardingClient.tsx`:
```typescript
const steps = [
    { label: 'Step 1', status: 'completed' },
    { label: 'Step 2', status: 'current' },
    { label: 'Step 3', status: 'upcoming' },
];
```

---

## 🐛 Troubleshooting

### Email not sending?
- Check Supabase Email settings
- Configure SMTP or use development mode
- Check spam folder

### OAuth not working?
- Verify Google OAuth credentials in Supabase
- Check redirect URLs match
- Ensure NEXT_PUBLIC_SITE_URL is set

### Database errors?
- Run the SQL migration from TWO_PHASE_REGISTRATION.md
- Check RLS policies are enabled
- Verify triggers are created

### Profile picture not uploading?
- This is expected - storage not implemented yet
- UI works, backend pending
- See "Next Steps" above

---

## 📞 Component API Reference

### FormContainer
```tsx
<FormContainer
    title="Page Title"
    subtitle="Subtitle text"
    maxWidth="md" // sm, md, lg, xl, 2xl
>
    {children}
</FormContainer>
```

### FormInput
```tsx
<FormInput
    label="Field Label"
    name="fieldName"
    type="text" // text, email, password, etc.
    required={true}
    placeholder="Placeholder..."
    disabled={false}
    error="Error message"
    helperText="Helper text"
    isTextarea={false}
    rows={4}
/>
```

### SocialButton
```tsx
<SocialButton
    provider="google"
    onClick={handleClick}
    disabled={false}
    isLoading={false}
/>
```

### ProgressStepper
```tsx
<ProgressStepper
    steps={[
        { label: 'Step 1', status: 'completed' },
        { label: 'Step 2', status: 'current' },
        { label: 'Step 3', status: 'upcoming' },
    ]}
/>
```

### ProfilePictureUpload
```tsx
<ProfilePictureUpload
    currentImageUrl="https://..."
    onImageSelect={(file) => console.log(file)}
    disabled={false}
/>
```

---

## 🎉 You're All Set!

The job seeker registration flow is complete and ready to use!

Test it out and enjoy! 🚀

For questions or issues, refer to:
- `REGISTRATION_FLOW_SUMMARY.md` - Detailed implementation docs
- `docs/REGISTRATION_FLOW_DIAGRAM.md` - Visual flow diagrams
- `docs/TWO_PHASE_REGISTRATION.md` - Database setup
