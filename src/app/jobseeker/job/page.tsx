"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JobCard from "@/components/jobseeker/job/JobCard";
import ButtonFilledPrimary from "@/components/shared/buttons/ButtonFilledPrimary";

export default function Job() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs from API
  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/auth/jobseeker/jobs");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        setJobs(data || []);
      } catch (err: any) {
        console.error("Error fetching jobs:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading jobs...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {error}
      </div>
    );

  if (jobs.length === 0)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        No jobs available at the moment.
      </div>
    );

  // 👇 Use the first job for detail preview
  const selectedJob = jobs[0];

  return (
    <div className="flex flex-row mx-50 my-5">
      {/* =================== LEFT: Job List =================== */}
      <div className="basis-1/4">
        {jobs.map((job) => (
          <div
            key={job.job_id}
            className="mb-5 border-gray-300 border rounded-lg"
          >
            <JobCard
              jobId={job.job_id}
              jobTitle={job.job_title}
              jobLocation={job.job_location}
              jobType={job.job_type}
              compName={job.company?.comp_name || "Unknown Company"}
              compLogo="/default-company.png"
              createdAt={new Date(job.created_at).toLocaleDateString()}
              bookmark={false}
              readMoreUrl={`/jobseeker/job/view/${job.job_id}`}
            />
          </div>
        ))}

        {/* Pagination */}
        <div className="flex flex-col items-center pt-5 pb-10">
          <span className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-semibold text-gray-900">1</span> to{" "}
            <span className="font-semibold text-gray-900">
              {Math.min(10, jobs.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">{jobs.length}</span>{" "}
            entries
          </span>
        </div>
      </div>

      {/* =================== RIGHT: Job Details =================== */}
      <div className="basis-3/4 rounded-lg shadow-md border-gray-300 border ms-10 p-5">
        <div className="flex flex-row items-center pb-3">
          <img
            src="/default-company.png"
            alt="Company Logo"
            className="w-10 h-10 mr-2"
          />
          <p className="text-lg text-gray-600 grow-1">
            {selectedJob.company?.comp_name || "Unknown Company"}
          </p>
          <img src="/bookmark.svg" alt="Bookmark" className="w-7 h-7" />
          <button
            onClick={() =>
              router.push(`/jobseeker/job/view/${selectedJob.job_id}`)
            }
          >
            <img src="/expand.svg" alt="Expand" className="w-7 h-7" />
          </button>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-row justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-600 pb-2">
                {selectedJob.job_title}
              </p>
              <p className="text-lg text-gray-600 pb-2">
                {selectedJob.job_location} ({selectedJob.job_type})
              </p>
            </div>
            <ButtonFilledPrimary
              text="Apply Now"
              onClick={() =>
                router.push(`/jobseeker/job/apply/${selectedJob.job_id}`)
              }
              className="w-32 h-10 bg-primary"
            />
          </div>

          <p className="text-lg text-gray-600 pb-2">
            Posted on {new Date(selectedJob.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Description */}
        <div className="pt-5">
          <h2 className="text-2xl font-bold pb-2">Job Description</h2>
          <p className="text-gray-600 whitespace-pre-line">
            {selectedJob.job_description || "No description provided."}
          </p>
        </div>

        {/* Requirements */}
        {selectedJob.job_requirement?.length > 0 && (
          <div className="pt-5">
            <h2 className="text-2xl font-bold pb-2">Requirements</h2>
            <ul className="list-disc list-inside text-gray-600">
              {selectedJob.job_requirement.map((req: any) => (
                <li key={req.job_requirement_id}>{req.requirement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {selectedJob.job_benefits && (
          <div className="pt-5">
            <h2 className="text-2xl font-bold pb-2">Benefits</h2>
            <p className="text-gray-600 whitespace-pre-line">
              {selectedJob.job_benefits}
            </p>
          </div>
        )}

        {/* Overview */}
        <div className="pt-5">
          <h2 className="text-2xl font-bold pb-2">Overview</h2>
          <div className="flex flex-col gap-2 text-gray-600">
            <p>
              <span className="font-bold">Industry:</span>{" "}
              {selectedJob.company?.comp_industry || "N/A"}
            </p>
            <p>
              <span className="font-bold">Website:</span>{" "}
              <a
                href={selectedJob.company?.comp_website}
                target="_blank"
                className="text-blue-500 underline"
              >
                {selectedJob.company?.comp_website || "N/A"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
