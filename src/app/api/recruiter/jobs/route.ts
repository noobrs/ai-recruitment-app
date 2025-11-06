import { NextResponse } from 'next/server';
import { getCurrentRecruiter } from '@/services/auth.service';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/recruiter/jobs
 * Get all jobs posted by the current recruiter
 */
export async function GET() {
    try {
        const recruiter = await getCurrentRecruiter();

        if (!recruiter || !recruiter.recruiter) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = await createClient();
        const { data: jobs, error } = await supabase
            .from('job')
            .select('*')
            .eq('recruiter_id', recruiter.recruiter.recruiter_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching recruiter jobs:', error);
            return NextResponse.json(
                { error: 'Failed to fetch jobs' },
                { status: 500 }
            );
        }

        return NextResponse.json({ jobs: jobs || [] });
    } catch (error) {
        console.error('Error in recruiter jobs endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
