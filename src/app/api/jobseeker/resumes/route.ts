import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAuthenticatedJobSeeker } from '@/services/auth.service';

/**
 * GET /api/jobseeker/resumes
 * Fetch all resumes for the authenticated jobseeker
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const jobSeekerId = await getAuthenticatedJobSeeker();

        // Fetch all resumes for this jobseeker
        const { data: resumes, error: resumesError } = await supabase
            .from('resume')
            .select('*')
            .eq('job_seeker_id', jobSeekerId)
            .order('created_at', { ascending: false });

        if (resumesError) {
            console.error('Error fetching resumes:', resumesError);
            return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
        }

        return NextResponse.json({ resumes: resumes || [] });
    } catch (error) {
        console.error('Error in /api/jobseeker/resumes:', error);

        // Handle specific authentication errors
        if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Jobseeker profile not found')) {
            const status = error.message === 'Unauthorized' ? 401 : 404;
            return NextResponse.json({ error: error.message }, { status });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
