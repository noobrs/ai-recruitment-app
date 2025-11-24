import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
    request: Request,
    // 1. Update the type definition to Promise
    { params }: { params: Promise<{ id: string }> }
) {
    // 2. Await the params to get the ID
    const { id } = await params;

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

        // 3️⃣ Fetch application with all related details
        const { data: application, error: appError } = await supabase
            .from('application')
            .select(`
                application_id,
                job_id,
                status,
                created_at,
                match_score,
                job:job_id!inner (
                    job_id,
                    job_title,
                    job_description,
                    job_location,
                    job_type,
                    salary_range,
                    created_at,
                    recruiter:recruiter_id!inner (
                        recruiter_id,
                        company:company_id!inner (
                            company_id,
                            comp_name,
                            comp_logo_path,
                            comp_location,
                            comp_website,
                            comp_industry
                        )
                    )
                ),
                resume:resume_id (
                    resume_id,
                    original_file_path,
                    extracted_skills,
                    extracted_experiences,
                    extracted_education,
                    created_at
                )
            `)
            .eq('application_id', id) // 3. Use the awaited 'id' variable here
            .eq('job_seeker_id', jobSeeker.job_seeker_id)
            .single();

        if (appError) {
            console.error('Error fetching application:', appError);
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // 4️⃣ Format the response
        // Note: Supabase single() returns an object, not an array, so these Array.isArray checks 
        // might be redundant if your relationship is strictly one-to-one or Many-to-One, 
        // but keeping them is safe.
        const job = Array.isArray(application.job) ? application.job[0] : application.job;
        const recruiter = job?.recruiter && Array.isArray(job.recruiter) ? job.recruiter[0] : job?.recruiter;
        const companyData = recruiter && !Array.isArray(recruiter) ? recruiter.company : null;
        const company = companyData && Array.isArray(companyData) ? companyData[0] : companyData;
        const resume = Array.isArray(application.resume) ? application.resume[0] : application.resume;

        const formattedApplication = {
            applicationId: application.application_id,
            status: application.status,
            appliedDate: new Date(application.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            matchScore: application.match_score,
            job: {
                jobId: job?.job_id,
                title: job?.job_title || 'Untitled Job',
                description: job?.job_description || '',
                location: job?.job_location || 'N/A',
                type: job?.job_type || 'N/A',
                salaryRange: job?.salary_range,
                postedDate: job?.created_at ? new Date(job.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'N/A',
            },
            company: {
                companyId: company?.company_id,
                name: company?.comp_name || 'Unknown Company',
                logo: company?.comp_logo_path || '/default-company.png',
                location: company?.comp_location || 'N/A',
                website: company?.comp_website,
                industry: company?.comp_industry || 'N/A',
            },
            resume: resume ? {
                resumeId: resume.resume_id,
                filePath: resume.original_file_path,
                skills: resume.extracted_skills,
                experiences: resume.extracted_experiences,
                education: resume.extracted_education,
                uploadedDate: resume.created_at ? new Date(resume.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'N/A',
            } : null,
        };

        return NextResponse.json({ application: formattedApplication }, { status: 200 });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error in application detail API:', message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}