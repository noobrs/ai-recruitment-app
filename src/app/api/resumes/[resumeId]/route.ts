import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

type RouteContext = {
    params: {
        resumeId: string;
    };
};

function parseJsonArray(value: string | null) {
    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function GET(_request: NextRequest, context: RouteContext) {
    const params = await context.params;
    const resumeIdParam = params.resumeId;
    const resumeId = Number(resumeIdParam);

    if (Number.isNaN(resumeId)) {
        return NextResponse.json({ error: 'Invalid resume id' }, { status: 400 });
    }

    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        const { data: jobSeeker, error: jobSeekerError } = await adminSupabase
            .from('job_seeker')
            .select('job_seeker_id')
            .eq('user_id', user.id)
            .single();

        if (jobSeekerError || !jobSeeker) {
            return NextResponse.json({ error: 'Job seeker profile not found' }, { status: 404 });
        }

        const { data: resume, error: resumeError } = await adminSupabase
            .from('resume')
            .select(
                'resume_id, status, redacted_file_path, original_file_path, extracted_skills, extracted_education, extracted_experiences, feedback, job_seeker_id, created_at, updated_at',
            )
            .eq('resume_id', resumeId)
            .single();

        if (resumeError || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        if (resume.job_seeker_id !== jobSeeker.job_seeker_id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
            resumeId: resume.resume_id,
            status: resume.status,
            createdAt: resume.created_at,
            updatedAt: resume.updated_at,
            originalFilePath: resume.original_file_path,
            redactedFilePath: resume.redacted_file_path,
            extractedSkills: parseJsonArray(resume.extracted_skills),
            extractedEducation: parseJsonArray(resume.extracted_education),
            extractedExperiences: parseJsonArray(resume.extracted_experiences),
            feedback: resume.feedback,
            processingComplete: Boolean(resume.redacted_file_path),
        });
    } catch (error) {
        console.error('Failed to fetch resume record', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
