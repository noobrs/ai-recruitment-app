'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResumeData } from '@/types/fastapi.types';
import { JobDetails } from '@/types/job.types';
import {
  ResumeUploadStep,
  ResumeReviewStep,
  SuccessConfirmation,
} from '@/components/jobseeker/jobs';

export type ApplicationStep = 1 | 2 | 3;

export default function ApplyJobPage() {
  const router = useRouter();
  const { job_id } = useParams<{ job_id: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [step, setStep] = useState<ApplicationStep>(1);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [existingResumeId, setExistingResumeId] = useState<number | undefined>(undefined);

  // Fetch job details for display
  useEffect(() => {
    async function fetchJobDetails() {
      try {
        const res = await fetch('/api/jobseeker/jobs');
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const data = await res.json();
        const jobs = Array.isArray(data) ? data : data.jobs;
        const jobFound = jobs?.find(
          (j: JobDetails) => j.job_id.toString() === job_id
        );
        setJob(jobFound || null);
      } catch (err) {
        console.error('Error fetching job:', err);
      }
    }
    fetchJobDetails();
  }, [job_id]);

  const handleUploadSuccess = (data: ResumeData, file: File | null, resumeId?: number) => {
    setResumeData(data);
    setCvFile(file);
    setExistingResumeId(resumeId);
    setStep(2);
  };

  const handleReviewSuccess = () => {
    setStep(3);
  };

  // Loading job details
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
        Loading job details...
      </div>
    );
  }

  // Step 1: Upload resume
  if (step === 1) {
    return (
      <ResumeUploadStep
        job={job}
        onUploadSuccess={handleUploadSuccess}
        onBack={() => router.back()}
      />
    );
  }

  // Step 2: Review and submit
  if (step === 2 && resumeData) {
    return (
      <ResumeReviewStep
        job={job}
        resumeData={resumeData}
        cvFile={cvFile}
        jobId={job_id}
        existingResumeId={existingResumeId}
        onBack={() => setStep(1)}
        onSuccess={handleReviewSuccess}
      />
    );
  }

  // Step 3: Success confirmation
  if (step === 3) {
    return (
      <SuccessConfirmation
        jobTitle={job.job_title}
        onNavigateBack={() => router.push('/jobseeker/jobs')}
      />
    );
  }

  return null;
}
