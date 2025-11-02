import { redirect } from 'next/navigation';
import { getCurrentJobSeeker } from '@/services/auth.service';
import { getProfileResume, getResumesByJobSeekerId } from '@/services/resume.service';
import ProfileClient from './ProfileClient';
import { User, JobSeeker } from '@/types';

type UserWithJobSeeker = User & {
    job_seeker: JobSeeker;
};

export default async function JobSeekerProfilePage() {
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
