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
import ApplyJobLoading from './loading';
import { checkActiveApplication } from './actions';
import toast from 'react-hot-toast';

export type ApplicationStep = 1 | 2 | 3;

export default function ApplyJobPage() {
  const router = useRouter();
  const { job_id } = useParams<{ job_id: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [step, setStep] = useState<ApplicationStep>(1);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [existingResumeId, setExistingResumeId] = useState<number | undefined>(undefined);
  const [redactedFileUrl, setRedactedFileUrl] = useState<string | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);

  // Check if user already has an active application
  useEffect(() => {
    async function checkExistingApplication() {
      try {
        const result = await checkActiveApplication(job_id);
        if (result.hasActive) {
          toast.error('You already have an active application for this job.');
          router.push('/jobseeker/jobs');
          return;
        }
        setIsCheckingApplication(false);
      } catch (err) {
        console.error('Error checking active application:', err);
        setIsCheckingApplication(false);
      }
    }
    checkExistingApplication();
  }, [job_id, router]);

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

  const handleUploadSuccess = (data: ResumeData, file: File | null, resumeId?: number, redactedUrl?: string | null) => {
    setResumeData(data);
    setCvFile(file);
    setExistingResumeId(resumeId);
    setRedactedFileUrl(redactedUrl || null);
    setStep(2);
  };

  const handleReviewSuccess = () => {
    setStep(3);
  };

  const handleApplicationSuccess = () => {
    setStep(3);
  };

  // Loading while checking for active application or job details
  if (isCheckingApplication || !job) {
    return (
      <ApplyJobLoading />
    );
  }

  // Step 1: Upload resume (or directly submit with existing resume)
  if (step === 1) {
    return (
      <ResumeUploadStep
        job={job}
        jobId={job_id}
        onUploadSuccess={handleUploadSuccess}
        onBack={() => router.back()}
        onApplicationSuccess={handleApplicationSuccess}
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
        redactedFileUrl={redactedFileUrl}
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
