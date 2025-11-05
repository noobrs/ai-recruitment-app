import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const supabaseAdmin = await createAdminClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { role, firstName, lastName, location, aboutMe, companyName, companyWebsite, companyIndustry } = body;

        // Validate role
        if (!role || (role !== 'jobseeker' && role !== 'recruiter')) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!firstName || !lastName) {
            return NextResponse.json(
                { error: 'First name and last name are required' },
                { status: 400 }
            );
        }

        // Update user table with basic info and role
        const { error: userError } = await supabaseAdmin
            .from('users')
            .update({
                role,
                first_name: firstName,
                last_name: lastName,
                status: 'active',
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (userError) {
            console.error('Error updating user:', userError);
            return NextResponse.json(
                { error: 'Failed to update user profile' },
                { status: 500 }
            );
        }

        // Handle role-specific setup
        if (role === 'jobseeker') {
            // Create or update job seeker profile
            const { error: jobSeekerError } = await supabaseAdmin
                .from('job_seeker')
                .upsert({
                    user_id: user.id,
                    js_location: location || null,
                    about_me: aboutMe || null,
                }, {
                    onConflict: 'user_id'
                });

            if (jobSeekerError) {
                console.error('Error creating job seeker profile:', jobSeekerError);
                return NextResponse.json(
                    { error: 'Failed to create job seeker profile' },
                    { status: 500 }
                );
            }
        } else if (role === 'recruiter') {
            // Validate company name for recruiters
            if (!companyName) {
                return NextResponse.json(
                    { error: 'Company name is required for recruiters' },
                    { status: 400 }
                );
            }

            // Create or get company
            const { data: existingCompany } = await supabaseAdmin
                .from('company')
                .select('company_id')
                .eq('comp_name', companyName)
                .maybeSingle();

            let companyId: number;

            if (existingCompany) {
                companyId = existingCompany.company_id;
            } else {
                // Create new company
                const { data: newCompany, error: companyError } = await supabaseAdmin
                    .from('company')
                    .insert({
                        comp_name: companyName,
                        comp_website: companyWebsite || null,
                        comp_industry: companyIndustry || null,
                    })
                    .select('company_id')
                    .single();

                if (companyError || !newCompany) {
                    console.error('Error creating company:', companyError);
                    return NextResponse.json(
                        { error: 'Failed to create company' },
                        { status: 500 }
                    );
                }

                companyId = newCompany.company_id;
            }

            // Create or update recruiter profile
            const { error: recruiterError } = await supabaseAdmin
                .from('recruiter')
                .upsert({
                    user_id: user.id,
                    company_id: companyId,
                }, {
                    onConflict: 'user_id'
                });

            if (recruiterError) {
                console.error('Error creating recruiter profile:', recruiterError);
                return NextResponse.json(
                    { error: 'Failed to create recruiter profile' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Onboarding error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
