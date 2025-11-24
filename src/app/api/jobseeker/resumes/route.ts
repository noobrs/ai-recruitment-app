import { NextResponse } from 'next/server';
import { getAuthenticatedJobSeeker } from '@/services/auth.service';
import { getResumesByJobSeekerId } from '@/services/resume.service';

/**
 * GET /api/jobseeker/resumes
 * Fetch all resumes for the authenticated jobseeker
 */
export async function GET() {
    try {
        const jobSeekerId = await getAuthenticatedJobSeeker();

        // Fetch all resumes for this jobseeker
        const resumes = await getResumesByJobSeekerId(jobSeekerId);
        if (!resumes) {
            console.error('Error fetching resumes');
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
