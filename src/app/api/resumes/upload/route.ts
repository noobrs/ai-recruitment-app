import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
// import {
//     RESUME_IMAGE_MAX_BYTES,
//     RESUME_PDF_MAX_BYTES,
//     getExtensionForMime,
//     isAllowedResumeMime,
// } from '@/constants/resume';
import { createHmacSignature } from '@/utils/security/hmac';

const RESUMES_BUCKET = 'resumes-original';
const FASTAPI_ENDPOINT = process.env.RESUME_PIPELINE_URL;

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!FASTAPI_ENDPOINT) {
            console.error('Missing RESUME_PIPELINE_URL environment variable.');
            return NextResponse.json({ error: 'Pipeline not configured' }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'Missing resume file' }, { status: 400 });
        }

        const mimeType = file.type;
        // if (!isAllowedResumeMime(mimeType)) {
        //     return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        // }

        const size = file.size;
        // if (mimeType === 'application/pdf' && size > RESUME_PDF_MAX_BYTES) {
        //     return NextResponse.json({ error: 'PDF exceeds 20MB limit' }, { status: 400 });
        // }

        // if (mimeType !== 'application/pdf' && size > RESUME_IMAGE_MAX_BYTES) {
        //     return NextResponse.json({ error: 'Image exceeds size limit' }, { status: 400 });
        // }

        const fileBuffer = Buffer.from(await file.arrayBuffer());

        const adminSupabase = createAdminClient();

        const { data: jobSeeker, error: jobSeekerError } = await adminSupabase
            .from('job_seeker')
            .select('job_seeker_id')
            .eq('user_id', user.id)
            .single();

        if (jobSeekerError || !jobSeeker) {
            console.error('Could not resolve job seeker for user', user.id, jobSeekerError);
            return NextResponse.json({ error: 'Job seeker profile not found' }, { status: 404 });
        }

        // const extension = getExtensionForMime(mimeType) || `.${file.name.split('.').pop() || 'pdf'}`;
        const extension = ".pdf"; // Simplified for this example
        const storageObjectPath = `${user.id}/${randomUUID()}${extension}`;
        const storagePathWithBucket = `${RESUMES_BUCKET}/${storageObjectPath}`;

        const insertResult = await adminSupabase
            .from('resume')
            .insert({
                job_seeker_id: jobSeeker.job_seeker_id,
                original_file_path: storagePathWithBucket,
                status: 'uploaded',
                redacted_file_path: null,
            })
            .select('resume_id')
            .single();

        if (insertResult.error || !insertResult.data) {
            console.error('Failed to insert resume row', insertResult.error);
            return NextResponse.json({ error: 'Unable to save resume metadata' }, { status: 500 });
        }

        const resumeId = insertResult.data.resume_id;

        try {
            const uploadResponse = await adminSupabase.storage
                .from(RESUMES_BUCKET)
                .upload(storageObjectPath, fileBuffer, {
                    contentType: mimeType,
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadResponse.error) {
                throw uploadResponse.error;
            }
        } catch (storageError) {
            console.error('Failed to upload resume to storage', storageError);
            await adminSupabase.from('resume').delete().eq('resume_id', resumeId);
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }

        const signedUrlResult = await adminSupabase.storage
            .from(RESUMES_BUCKET)
            .createSignedUrl(storageObjectPath, 60 * 10); // 10 minutes

        if (signedUrlResult.error || !signedUrlResult.data) {
            console.error('Failed to create signed download URL', signedUrlResult.error);
            return NextResponse.json({ error: 'Unable to prepare processing' }, { status: 500 });
        }

        const payload = {
            resume_id: resumeId,
            job_seeker_id: jobSeeker.job_seeker_id,
            original_file_path: storagePathWithBucket,
            download_url: signedUrlResult.data.signedUrl,
            original_filename: file.name,
            mime_type: mimeType,
            size,
        };

        const body = JSON.stringify(payload);
        const timestamp = new Date().toISOString();
        const signature = createHmacSignature(body, timestamp);

        const pipelineResponse = await fetch(FASTAPI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-resume-timestamp': timestamp,
                'x-resume-signature': signature,
            },
            body,
        });

        if (!pipelineResponse.ok) {
            console.error('Pipeline returned non-200 response', pipelineResponse.status, await pipelineResponse.text());
            return NextResponse.json(
                { resumeId, warning: 'Resume upload succeeded but processing failed to start' },
                { status: 202 },
            );
        }

        return NextResponse.json({ resumeId }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error during resume upload', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
