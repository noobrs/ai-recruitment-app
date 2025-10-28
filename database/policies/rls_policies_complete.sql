-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Complete RLS setup for AI Recruitment App
-- ============================================

-- ============================================
-- 1. USERS TABLE POLICIES
-- ============================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Policy: Users can view their own record
CREATE POLICY "Users can view own record"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own record (for onboarding)
CREATE POLICY "Users can update own record"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own record (for trigger/onboarding)
CREATE POLICY "Users can insert own record"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. JOB_SEEKER TABLE POLICIES
-- ============================================

-- Enable RLS on job_seeker table
ALTER TABLE public.job_seeker ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Job seekers can view own profile" ON public.job_seeker;
DROP POLICY IF EXISTS "Job seekers can insert own profile" ON public.job_seeker;
DROP POLICY IF EXISTS "Job seekers can update own profile" ON public.job_seeker;
DROP POLICY IF EXISTS "Recruiters can view job seeker profiles" ON public.job_seeker;

-- Policy: Job seekers can view their own profile
CREATE POLICY "Job seekers can view own profile"
  ON public.job_seeker
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Job seekers can insert their own profile (during onboarding)
CREATE POLICY "Job seekers can insert own profile"
  ON public.job_seeker
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Job seekers can update their own profile
CREATE POLICY "Job seekers can update own profile"
  ON public.job_seeker
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Recruiters can view job seeker profiles (for matching/hiring)
CREATE POLICY "Recruiters can view job seeker profiles"
  ON public.job_seeker
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'recruiter'
      AND users.status = 'active'
    )
  );

-- ============================================
-- 3. RECRUITER TABLE POLICIES
-- ============================================

-- Enable RLS on recruiter table
ALTER TABLE public.recruiter ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Recruiters can view own profile" ON public.recruiter;
DROP POLICY IF EXISTS "Recruiters can insert own profile" ON public.recruiter;
DROP POLICY IF EXISTS "Recruiters can update own profile" ON public.recruiter;

-- Policy: Recruiters can view their own profile
CREATE POLICY "Recruiters can view own profile"
  ON public.recruiter
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Recruiters can insert their own profile (during onboarding)
CREATE POLICY "Recruiters can insert own profile"
  ON public.recruiter
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Recruiters can update their own profile
CREATE POLICY "Recruiters can update own profile"
  ON public.recruiter
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. RESUME TABLE POLICIES
-- ============================================

-- Enable RLS on resume table
ALTER TABLE public.resume ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Job seekers can view own resumes" ON public.resume;
DROP POLICY IF EXISTS "Job seekers can insert own resumes" ON public.resume;
DROP POLICY IF EXISTS "Job seekers can update own resumes" ON public.resume;
DROP POLICY IF EXISTS "Job seekers can delete own resumes" ON public.resume;
DROP POLICY IF EXISTS "Recruiters can view resumes for applications" ON public.resume;

-- Policy: Job seekers can view their own resumes
CREATE POLICY "Job seekers can view own resumes"
  ON public.resume
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_seeker
      WHERE job_seeker.job_seeker_id = resume.job_seeker_id
      AND job_seeker.user_id = auth.uid()
    )
  );

-- Policy: Job seekers can insert their own resumes
CREATE POLICY "Job seekers can insert own resumes"
  ON public.resume
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_seeker
      WHERE job_seeker.job_seeker_id = resume.job_seeker_id
      AND job_seeker.user_id = auth.uid()
    )
  );

-- Policy: Job seekers can update their own resumes
CREATE POLICY "Job seekers can update own resumes"
  ON public.resume
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.job_seeker
      WHERE job_seeker.job_seeker_id = resume.job_seeker_id
      AND job_seeker.user_id = auth.uid()
    )
  );

-- Policy: Job seekers can delete their own resumes
CREATE POLICY "Job seekers can delete own resumes"
  ON public.resume
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.job_seeker
      WHERE job_seeker.job_seeker_id = resume.job_seeker_id
      AND job_seeker.user_id = auth.uid()
    )
  );

-- Policy: Recruiters can view resumes for applications to their jobs
CREATE POLICY "Recruiters can view resumes for applications"
  ON public.resume
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.application app
      JOIN public.job j ON app.job_id = j.job_id
      JOIN public.recruiter r ON j.recruiter_id = r.recruiter_id
      WHERE app.resume_id = resume.resume_id
      AND r.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. COMPANY TABLE POLICIES
-- ============================================

-- Enable RLS on company table
ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view companies" ON public.company;
DROP POLICY IF EXISTS "Recruiters can insert companies" ON public.company;
DROP POLICY IF EXISTS "Recruiters can update their company" ON public.company;

-- Policy: Anyone (authenticated) can view companies
CREATE POLICY "Anyone can view companies"
  ON public.company
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Recruiters can insert new companies
CREATE POLICY "Recruiters can insert companies"
  ON public.company
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'recruiter'
    )
  );

-- Policy: Recruiters can update their own company
CREATE POLICY "Recruiters can update their company"
  ON public.company
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter
      WHERE recruiter.company_id = company.company_id
      AND recruiter.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. JOB TABLE POLICIES
-- ============================================

-- Enable RLS on job table
ALTER TABLE public.job ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.job;
DROP POLICY IF EXISTS "Recruiters can view own jobs" ON public.job;
DROP POLICY IF EXISTS "Recruiters can insert own jobs" ON public.job;
DROP POLICY IF EXISTS "Recruiters can update own jobs" ON public.job;
DROP POLICY IF EXISTS "Recruiters can delete own jobs" ON public.job;

-- Policy: Anyone can view open/active jobs
CREATE POLICY "Anyone can view active jobs"
  ON public.job
  FOR SELECT
  TO authenticated
  USING (job_status = 'open');

-- Policy: Recruiters can view all their own jobs (including drafts)
CREATE POLICY "Recruiters can view own jobs"
  ON public.job
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter
      WHERE recruiter.recruiter_id = job.recruiter_id
      AND recruiter.user_id = auth.uid()
    )
  );

-- Policy: Recruiters can insert their own jobs
CREATE POLICY "Recruiters can insert own jobs"
  ON public.job
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recruiter
      WHERE recruiter.recruiter_id = job.recruiter_id
      AND recruiter.user_id = auth.uid()
    )
  );

-- Policy: Recruiters can update their own jobs
CREATE POLICY "Recruiters can update own jobs"
  ON public.job
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter
      WHERE recruiter.recruiter_id = job.recruiter_id
      AND recruiter.user_id = auth.uid()
    )
  );

-- Policy: Recruiters can delete their own jobs
CREATE POLICY "Recruiters can delete own jobs"
  ON public.job
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter
      WHERE recruiter.recruiter_id = job.recruiter_id
      AND recruiter.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. JOB_REQUIREMENT TABLE POLICIES
-- ============================================

-- Enable RLS on job_requirement table
ALTER TABLE public.job_requirement ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view requirements for active jobs" ON public.job_requirement;
DROP POLICY IF EXISTS "Recruiters can manage own job requirements" ON public.job_requirement;

-- Policy: Anyone can view requirements for open jobs
CREATE POLICY "Anyone can view requirements for active jobs"
  ON public.job_requirement
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job
      WHERE job.job_id = job_requirement.job_id
      AND job.job_status = 'open'
    )
  );

-- Policy: Recruiters can manage requirements for their own jobs
CREATE POLICY "Recruiters can manage own job requirements"
  ON public.job_requirement
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.job j
      JOIN public.recruiter r ON j.recruiter_id = r.recruiter_id
      WHERE j.job_id = job_requirement.job_id
      AND r.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. APPLICATION TABLE POLICIES
-- ============================================

-- Enable RLS on application table
ALTER TABLE public.application ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Job seekers can view own applications" ON public.application;
DROP POLICY IF EXISTS "Job seekers can insert own applications" ON public.application;
DROP POLICY IF EXISTS "Job seekers can update own applications" ON public.application;
DROP POLICY IF EXISTS "Recruiters can view applications to their jobs" ON public.application;
DROP POLICY IF EXISTS "Recruiters can update application status" ON public.application;

-- Policy: Job seekers can view their own applications
CREATE POLICY "Job seekers can view own applications"
  ON public.application
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_seeker
      WHERE job_seeker.job_seeker_id = application.job_seeker_id
      AND job_seeker.user_id = auth.uid()
    )
  );

-- Policy: Job seekers can insert their own applications
CREATE POLICY "Job seekers can insert own applications"
  ON public.application
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_seeker
      WHERE job_seeker.job_seeker_id = application.job_seeker_id
      AND job_seeker.user_id = auth.uid()
    )
  );

-- Policy: Job seekers can update their own applications (e.g., withdraw)
CREATE POLICY "Job seekers can update own applications"
  ON public.application
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.job_seeker
      WHERE job_seeker.job_seeker_id = application.job_seeker_id
      AND job_seeker.user_id = auth.uid()
    )
  );

-- Policy: Recruiters can view applications to their jobs
CREATE POLICY "Recruiters can view applications to their jobs"
  ON public.application
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.job j
      JOIN public.recruiter r ON j.recruiter_id = r.recruiter_id
      WHERE j.job_id = application.job_id
      AND r.user_id = auth.uid()
    )
  );

-- Policy: Recruiters can update application status for their jobs
CREATE POLICY "Recruiters can update application status"
  ON public.application
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.job j
      JOIN public.recruiter r ON j.recruiter_id = r.recruiter_id
      WHERE j.job_id = application.job_id
      AND r.user_id = auth.uid()
    )
  );

-- ============================================
-- 9. NOTIFICATION TABLE POLICIES
-- ============================================

-- Enable RLS on notification table
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notification;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notification;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notification
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notification
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Any authenticated user can insert notifications (for system notifications)
-- You may want to restrict this to service role in production
CREATE POLICY "System can insert notifications"
  ON public.notification
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View all policies
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'job_seeker', 'recruiter', 'company', 
  'job', 'job_requirement', 'application', 'resume', 'notification'
)
ORDER BY tablename;

-- ============================================
-- NOTES:
-- ============================================
-- 1. All tables now have RLS enabled
-- 2. Users can only access their own data
-- 3. Recruiters can view job seeker profiles and applications
-- 4. Job seekers can view open jobs and their applications
-- 5. Anyone can view companies and open jobs
-- 6. Each role can manage only their own records
-- 7. Cross-role access is restricted to necessary business logic
