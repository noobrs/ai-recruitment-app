import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/jobseeker/resumes
 * Fetch all resumes for the authenticated jobseeker
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get jobseeker profile
        const { data: jobSeeker, error: seekerError } = await supabase
            .from('job_seeker')
            .select('job_seeker_id')
            .eq('user_id', user.id)
            .single();

        if (seekerError || !jobSeeker) {
            return NextResponse.json({ error: 'Jobseeker profile not found' }, { status: 404 });
        }

        // Fetch all resumes for this jobseeker
        const { data: resumes, error: resumesError } = await supabase
            .from('resume')
            .select('*')
            .eq('job_seeker_id', jobSeeker.job_seeker_id)
            .order('created_at', { ascending: false });

        if (resumesError) {
            console.error('Error fetching resumes:', resumesError);
            return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
        }

        return NextResponse.json({ resumes: resumes || [] });
    } catch (error) {
        console.error('Error in /api/jobseeker/resumes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
