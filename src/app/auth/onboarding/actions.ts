'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

type OnboardingData = {
    role: 'jobseeker' | 'recruiter';
    firstName: string;
    lastName: string;
    location?: string;
    aboutMe?: string;
    position?: string;
    companyId?: number;
    companyName?: string;
    companyWebsite?: string;
    companyIndustry?: string;
    companyLocation?: string;
    companyDescription?: string;
    companySize?: string;
    companyFounded?: number;
};

/**
 * Complete user onboarding
 * Updates user profile and creates role-specific profiles (jobseeker or recruiter)
 */
export async function completeOnboarding(data: OnboardingData) {
    try {
        const supabase = await createClient();

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const supabaseAdmin = createAdminClient();
        const { 
            role, 
            firstName, 
            lastName, 
            location, 
            aboutMe, 
            position,
            companyId,
            companyName, 
            companyWebsite, 
            companyIndustry,
            companyLocation,
            companyDescription,
            companySize,
            companyFounded
        } = data;

        // Validate role
        if (!role || (role !== 'jobseeker' && role !== 'recruiter')) {
            return {
                success: false,
                error: 'Invalid role',
            };
        }

        // Validate required fields
        if (!firstName || !lastName) {
            return {
                success: false,
                error: 'First name and last name are required',
            };
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
            return {
                success: false,
                error: 'Failed to update user profile',
            };
        }

        // Handle role-specific setup
        if (role === 'jobseeker') {
            // Create or update job seeker profile
            const { error: jobSeekerError } = await supabaseAdmin
                .from('job_seeker')
                .upsert(
                    {
                        user_id: user.id,
                        location: location || null,
                        about_me: aboutMe || null,
                    },
                    {
                        onConflict: 'user_id',
                    }
                );

            if (jobSeekerError) {
                console.error('Error creating job seeker profile:', jobSeekerError);
                return {
                    success: false,
                    error: 'Failed to create job seeker profile',
                };
            }
        } else if (role === 'recruiter') {
            // Validate required fields for recruiters
            if (!companyName) {
                return {
                    success: false,
                    error: 'Company name is required for recruiters',
                };
            }
            
            if (!position) {
                return {
                    success: false,
                    error: 'Position is required for recruiters',
                };
            }

            let finalCompanyId: number;

            // Check if joining an existing company
            if (companyId) {
                // Verify the company exists
                const { data: existingCompany, error: verifyError } = await supabaseAdmin
                    .from('company')
                    .select('company_id')
                    .eq('company_id', companyId)
                    .maybeSingle();

                if (verifyError || !existingCompany) {
                    console.error('Error verifying company:', verifyError);
                    return {
                        success: false,
                        error: 'Selected company not found',
                    };
                }

                finalCompanyId = existingCompany.company_id;
            } else {
                // Create new company with all provided details
                const companyData: {
                    comp_name: string;
                    comp_website?: string | null;
                    comp_industry?: string | null;
                    comp_location?: string | null;
                    comp_description?: string | null;
                    comp_size?: string | null;
                    comp_founded?: number;
                } = {
                    comp_name: companyName,
                };

                // Only add fields if they have values
                if (companyWebsite) companyData.comp_website = companyWebsite;
                if (companyIndustry) companyData.comp_industry = companyIndustry;
                if (companyLocation) companyData.comp_location = companyLocation;
                if (companyDescription) companyData.comp_description = companyDescription;
                if (companySize) companyData.comp_size = companySize;
                if (companyFounded) companyData.comp_founded = companyFounded;

                const { data: newCompany, error: companyError } = await supabaseAdmin
                    .from('company')
                    .insert(companyData)
                    .select('company_id')
                    .single();

                if (companyError || !newCompany) {
                    console.error('Error creating company:', companyError);
                    return {
                        success: false,
                        error: 'Failed to create company',
                    };
                }

                finalCompanyId = newCompany.company_id;
            }

            // Create or update recruiter profile with position
            const { error: recruiterError } = await supabaseAdmin
                .from('recruiter')
                .upsert(
                    {
                        user_id: user.id,
                        company_id: finalCompanyId,
                        position: position,
                    },
                    {
                        onConflict: 'user_id',
                    }
                );

            if (recruiterError) {
                console.error('Error creating recruiter profile:', recruiterError);
                return {
                    success: false,
                    error: 'Failed to create recruiter profile',
                };
            }
        }

        revalidatePath('/auth/onboarding');
        return { success: true };
    } catch (error) {
        console.error('Onboarding error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred',
        };
    }
}
