import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getBookmarkedJobs, getAppliedJobs } from '@/services/application.service';

export async function GET() {
  const supabase = await createClient();

  try {
    // 1️⃣ Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2️⃣ Get job seeker ID
    const { data: jobSeeker, error: seekerError } = await supabase
      .from('job_seeker')
      .select('job_seeker_id')
      .eq('user_id', user.id)
      .single();

    if (seekerError || !jobSeeker) {
      return NextResponse.json({ error: 'Jobseeker profile not found' }, { status: 404 });
    }

    // 3️⃣ Fetch data
    const [bookmarkedJobs, appliedJobs] = await Promise.all([
      getBookmarkedJobs(jobSeeker.job_seeker_id),
      getAppliedJobs(jobSeeker.job_seeker_id),
    ]);

    return NextResponse.json({ bookmarkedJobs, appliedJobs }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching jobseeker activities:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
