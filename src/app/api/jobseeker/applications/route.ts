import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
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

        // 3️⃣ Get filter from query params
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');

        // 4️⃣ Fetch applications with job and company details
        let query = supabase
            .from('application')
            .select(`
        application_id,
        job_id,
        status,
        created_at,
        job:job_id!inner (
          job_id,
          job_title,
          job_location,
          job_type,
          created_at,
          recruiter:recruiter_id!inner (
            recruiter_id,
            company:company_id!inner (
              comp_name,
              comp_logo_path
            )
          )
        )
      `)
            .eq('job_seeker_id', jobSeeker.job_seeker_id)
            .neq('status', 'unknown')
            .order('created_at', { ascending: false });

        // Apply status filter if provided (supports comma-separated values)
        if (statusFilter) {
            const statuses = statusFilter.split(',').filter(s => s.trim());
            if (statuses.length > 0) {
                query = query.in('status', statuses);
            }
        }

        const { data: applications, error: appsError } = await query;

        if (appsError) {
            console.error('Error fetching applications:', appsError);
            return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
        }

        // 5️⃣ Format the response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedApplications = applications?.map((app: any) => {
            const job = Array.isArray(app.job) ? app.job[0] : app.job;
            const recruiter = job?.recruiter && Array.isArray(job.recruiter) ? job.recruiter[0] : job?.recruiter;
            const company = recruiter?.company && Array.isArray(recruiter.company) ? recruiter.company[0] : recruiter?.company;

            return {
                applicationId: app.application_id,
                jobId: job?.job_id,
                jobTitle: job?.job_title || 'Untitled Job',
                companyName: company?.comp_name || 'Unknown Company',
                companyLogo: company?.comp_logo || '/default-company.png',
                jobLocation: job?.job_location || 'N/A',
                jobType: job?.job_type || 'N/A',
                status: app.status || 'received',
                appliedDate: new Date(app.created_at).toLocaleDateString(),
            };
        }) || [];

        // 6️⃣ Get status counts for filter badges
        const { data: statusCounts } = await supabase
            .from('application')
            .select('status')
            .eq('job_seeker_id', jobSeeker.job_seeker_id)
            .neq('status', 'unknown');

        const counts = statusCounts?.reduce((acc: Record<string, number>, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {}) || {};

        return NextResponse.json({
            applications: formattedApplications,
            counts: {
                all: formattedApplications.length,
                ...counts,
            },
            jobSeekerId: jobSeeker.job_seeker_id,
        }, { status: 200 });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error in applications API:', message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
