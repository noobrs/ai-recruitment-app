import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { verifyHmacSignature } from '@/utils/security/hmac';

type ProcessedResumePayload = {
    resume_id: number;
    job_seeker_id: number;
    redacted_file_path: string;
    extracted_skills?: string[];
    extracted_education?: string[];
    extracted_experiences?: string[];
    feedback?: string | null;
};

function toJsonString(value?: string[] | null) {
    if (!value || value.length === 0) {
        return null;
    }
    return JSON.stringify(value);
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    const timestamp = request.headers.get('x-resume-timestamp');
    const signature = request.headers.get('x-resume-signature');

    if (!verifyHmacSignature(rawBody, timestamp, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let parsed: ProcessedResumePayload;

    try {
        parsed = JSON.parse(rawBody) as ProcessedResumePayload;
    } catch {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { resume_id, job_seeker_id } = parsed;

    if (!resume_id || !job_seeker_id) {
        return NextResponse.json({ error: 'Missing identifiers' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    try {
        const { data: resume, error: resumeError } = await adminSupabase
            .from('resume')
            .select('resume_id, job_seeker_id')
            .eq('resume_id', resume_id)
            .single();

        if (resumeError || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        if (resume.job_seeker_id !== job_seeker_id) {
            return NextResponse.json({ error: 'Job seeker mismatch' }, { status: 403 });
        }

        const updateResult = await adminSupabase
            .from('resume')
            .update({
                redacted_file_path: parsed.redacted_file_path,
                extracted_skills: toJsonString(parsed.extracted_skills ?? []),
                extracted_education: toJsonString(parsed.extracted_education ?? []),
                extracted_experiences: toJsonString(parsed.extracted_experiences ?? []),
                feedback: parsed.feedback ?? null,
                updated_at: new Date().toISOString(),
            })
            .eq('resume_id', resume_id)
            .select('job_seeker_id')
            .single();

        if (updateResult.error) {
            console.error('Failed to update resume after processing', updateResult.error);
            return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
        }

        const { data: jobSeeker, error: jobSeekerError } = await adminSupabase
            .from('job_seeker')
            .select('user_id')
            .eq('job_seeker_id', job_seeker_id)
            .single();

        if (!jobSeekerError && jobSeeker) {
            await adminSupabase.from('notification').insert({
                user_id: jobSeeker.user_id,
                type: 'resume',
                message: 'Your resume has been processed and redacted version is ready.',
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to handle resume processed webhook', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
