import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAllJobsWithRelations } from '@/services/job.service';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // optional: check if user role = jobseeker
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'jobseeker') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const jobs = await getAllJobsWithRelations();
  return NextResponse.json(jobs);
}
