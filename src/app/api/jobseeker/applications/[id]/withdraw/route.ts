import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { withdrawApplication } from '@/services/application.service';
import { revalidatePath } from 'next/cache';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        // 3️⃣ Withdraw the application
        const applicationId = parseInt(id);
        const result = await withdrawApplication(applicationId, jobSeeker.job_seeker_id);

        if (!result) {
            return NextResponse.json({
                error: 'Failed to withdraw application. Application may not exist or has already been withdrawn/rejected.'
            }, { status: 400 });
        }

        // 4️⃣ Revalidate paths
        revalidatePath('/jobseeker/applications');
        revalidatePath('/jobseeker/jobs');

        return NextResponse.json({
            success: true,
            message: 'Application withdrawn successfully',
            application: result
        }, { status: 200 });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error withdrawing application:', message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
