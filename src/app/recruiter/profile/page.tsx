import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentRecruiter } from '@/services/auth.service';
import { getCompanyById } from '@/services/company.service';
import ProfileClient from './client';
import ProfileLoading from './loading';
import { UserWithRecruiter } from '@/types';

// Separate component for data fetching to enable streaming
async function ProfileData() {
    const recruiter = await getCurrentRecruiter();

    if (!recruiter || !recruiter.recruiter) {
        redirect('/auth/login');
    }

    // Fetch company information
    const company = recruiter.recruiter.company_id
        ? await getCompanyById(recruiter.recruiter.company_id)
        : null;

    const userWithRecruiter: UserWithRecruiter = {
        ...recruiter,
        recruiter: {
            ...recruiter.recruiter,
            company: company || undefined,
        },
    };

    return <ProfileClient user={userWithRecruiter} />;
}

// Main page component with Suspense boundary
// This shows loading state immediately while data is being fetched
export default function RecruiterProfilePage() {
    return (
        <Suspense fallback={<ProfileLoading />}>
            <ProfileData />
        </Suspense>
    );
}
