"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RecruiterJobViewPage() {
  const router = useRouter();
  const { job_id } = useParams();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch job
  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/recruiter/jobs/${job_id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load job");

        setJob(data.job);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [job_id]);

  // Loading
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading job details...
      </div>
    );

  // Error
  if (error || !job)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error || "Job not found."}
      </div>
    );

  // UI
  return (
    <div className="max-w-7xl mx-auto my-10 bg-white rounded-lg shadow-md border border-gray-300 p-8">

      {/* Header */}
      <div className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center">
          <img
            src={job.company?.comp_logo || "/default-company.png"}
            alt="Company Logo"
            className="w-10 h-10 mr-3"
          />
          <p className="text-lg font-semibold text-gray-700">
            {job.company?.comp_name || "Unknown Company"}
          </p>
        </div>

        <button
          onClick={() => router.push("/recruiter/jobs")}
          className="px-4 py-2 border rounded-full hover:bg-gray-100"
        >
          ← Back to Jobs
        </button>
      </div>

      {/* Title */}
      <div className="border-b border-gray-200 pb-3 mb-4 mt-1">
        <h2 className="text-3xl font-bold text-gray-700 mb-4">
          {job.job_title}
        </h2>
        <p className="text-gray-600">
          {job.job_location} ({job.job_type})
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Posted on {new Date(job.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Job Description */}
      <section className="mb-6">
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">
          Job Description
        </h3>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
          {job.job_description || "No description provided."}
        </p>
      </section>

      {/* Requirements */}
      {job.job_requirement?.length > 0 && (
        <section className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">
            Requirements
          </h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            {job.job_requirement.map((req: any) => (
              <li key={req.job_requirement_id}>{req.requirement}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Benefits */}
      {job.job_benefits && (
        <section className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">
            Benefits
          </h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {job.job_benefits}
          </p>
        </section>
      )}

      {/* Company Overview */}
      <section>
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">
          Company Overview
        </h3>
        <div className="flex flex-col gap-2 text-gray-600">
          <p>
            <span className="font-bold">Industry:</span>{" "}
            {job.company?.comp_industry || "N/A"}
          </p>
          <p>
            <span className="font-bold">Website:</span>{" "}
            <a
              href={job.company?.comp_website}
              target="_blank"
              className="text-blue-500 underline hover:text-blue-600"
            >
              {job.company?.comp_website || "N/A"}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}