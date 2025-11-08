"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ButtonFilledPrimary from "@/components/shared/buttons/ButtonFilledPrimary";
import { toggleBookmark } from "../../actions";

export default function JobViewPage() {
  const router = useRouter();
  const { job_id } = useParams(); // ✅ dynamic segment
  const [job, setJob] = useState<any>(null);
  const [jobSeekerId, setJobSeekerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // =============================
  // Fetch specific job
  // =============================
  useEffect(() => {
    async function fetchJobDetails() {
      try {
        const res = await fetch(`/api/jobseeker/jobs/${job_id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const data = await res.json();
        setJob(data.job);
        setJobSeekerId(data.jobSeekerId);
      } catch (err: any) {
        console.error("Error fetching job details:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (job_id) fetchJobDetails();
  }, [job_id]);

  // =============================
  // Bookmark toggle handler
  // =============================
  const handleToggleBookmark = async () => {
    if (!job || !jobSeekerId) return;

    setBookmarkLoading(true);
    try {
      const result = await toggleBookmark(jobSeekerId, job.job_id);
      if (result.success) {
        setJob((prev: any) => ({
          ...prev,
          is_bookmark: result.is_bookmark,
        }));
      } else {
        alert("Failed to update bookmark.");
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // =============================
  // Loading & Error states
  // =============================
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading job details...
      </div>
    );

  if (error || !job)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error || "Job not found."}
      </div>
    );

  // =============================
  // Main UI
  // =============================
  return (
    <div className="max-w-8/10 mx-auto my-10 bg-white rounded-lg shadow-md border border-gray-300 p-8">
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

        <div className="flex items-center gap-4">
          <img
            src={job.is_bookmark ? "/bookmark-solid.svg" : "/bookmark.svg"}
            alt="Bookmark"
            className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${
              bookmarkLoading ? "opacity-50" : ""
            }`}
            onClick={handleToggleBookmark}
          />
        </div>
      </div>

      {/* Job Title & Meta */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-3 mb-4 mt-1">
        <div>
          <h2 className="text-3xl font-bold text-gray-700 mb-4">
            {job.job_title}
          </h2>
          <p className="text-gray-600">
            {job.job_location || "Unknown Location"} ({job.job_type || "N/A"})
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Posted on {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
        <ButtonFilledPrimary
          text="Apply Now"
          onClick={() => router.push(`/jobseeker/jobs/apply/${job.job_id}`)}
          className="mt-4 sm:mt-0 w-36 h-10 bg-primary"
        />
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
