import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentJobSeeker } from '@/services/auth.service';
import { getProfileResume, getResumesByJobSeekerId } from '@/services/resume.service';
import ProfileClient from './client';
import ProfileLoading from './loading';
import { UserWithJobSeeker } from '@/types';

// Separate component for data fetching to enable streaming
async function ProfileData() {
    const jobSeeker = await getCurrentJobSeeker();

    if (!jobSeeker || !jobSeeker.job_seeker) {
        redirect('/auth/jobseeker/login');
    }

    const userWithJobSeeker: UserWithJobSeeker = {
        ...jobSeeker,
        job_seeker: jobSeeker.job_seeker,
    };

    // Fetch profile resume and all resumes
    const [profileResume, allResumes] = await Promise.all([
        getProfileResume(jobSeeker.job_seeker.job_seeker_id),
        getResumesByJobSeekerId(jobSeeker.job_seeker.job_seeker_id),
    ]);

    return (
        <ProfileClient
            user={userWithJobSeeker}
            profileResume={profileResume}
            allResumes={allResumes}
        />
    );
}

// Main page component with Suspense boundary
// This shows loading state immediately while data is being fetched
export default function JobSeekerProfilePage() {
    return (
        <Suspense fallback={<ProfileLoading />}>
            <ProfileData />
        </Suspense>
    );
}
