"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBookmark } from "@/hooks/useBookmark";
import type { JobWithApplicationStatus, JobRequirement } from "@/types";

import JobCard from "@/components/jobseeker/jobs/JobCard";
import ButtonFilledPrimary from "@/components/shared/buttons/ButtonFilledPrimary";
import SearchBar from "@/components/jobseeker/shared/SearchBar";

export default function JobPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<JobWithApplicationStatus[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobWithApplicationStatus[]>([]);
  const [jobSeekerId, setJobSeekerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toggle, loadingId } = useBookmark();
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  // =============================
  // Fetch jobs and jobSeekerId
  // =============================
  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/jobseeker/jobs");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const data = await res.json();
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
        setJobSeekerId(data.jobSeekerId);
        if (data.jobs.length > 0) setSelectedJobId(data.jobs[0].job_id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error("Error fetching jobs:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  // =============================
  // Search functionality
  // =============================
  const handleSearch = (query: string, location: string) => {
    let filtered = jobs;

    if (query) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.job_title.toLowerCase().includes(queryLower) ||
          job.company?.comp_name?.toLowerCase().includes(queryLower)
      );
    }

    if (location) {
      const locationLower = location.toLowerCase();
      filtered = filtered.filter((job) =>
        job.job_location?.toLowerCase().includes(locationLower)
      );
    }

    setFilteredJobs(filtered);
    setCurrentPage(1);
    if (filtered.length > 0) {
      setSelectedJobId(filtered[0].job_id);
    } else {
      setSelectedJobId(null);
    }
  };

  // =============================
  // Escape key closes expanded mode
  // =============================
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) setIsExpanded(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isExpanded]);

  // =============================
  // Bookmark toggle handler
  // =============================
  const handleToggleBookmark = async (jobId: number) => {
    if (!jobSeekerId) return;

    const result = await toggle(jobSeekerId, jobId);

    if (result.success) {
      setJobs((prev) =>
        prev.map((job) =>
          job.job_id === jobId
            ? { ...job, is_bookmark: !!result.is_bookmark }
            : job
        )
      );
    } else {
      alert("Failed to update bookmark.");
    }
  };

  // =============================
  // Pagination logic
  // =============================
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);
  const selectedJob = filteredJobs.find((job) => job.job_id === selectedJobId);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  // =============================
  // Loading and Error Handling
  // =============================
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

  // =============================
  // UI Layout
  // =============================
  return (
    <div className="max-w-8/10 mx-auto my-8">
      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        queryPlaceholder="Job title or company name"
        locationPlaceholder="Location"
      />

      {/* No Results Message */}
      {filteredJobs.length === 0 && jobs.length > 0 && (
        <div className="flex items-center justify-center py-20 text-gray-600">
          No jobs found matching your search criteria.
        </div>
      )}

      {/* No Jobs Available */}
      {jobs.length === 0 && (
        <div className="flex items-center justify-center py-20 text-gray-600">
          No jobs available at the moment.
        </div>
      )}

      {/* Jobs Layout */}
      {filteredJobs.length > 0 && (
        <div
          className={`flex transition-all duration-500 ease-in-out ${isExpanded ? "flex-col" : "flex-row"
            }`}
        >
          {/* =================== LEFT: Job List =================== */}
          {!isExpanded && (
            <div className="basis-1/4">
              {currentJobs.map((job) => (
                <div
                  key={job.job_id}
                  onClick={() => setSelectedJobId(job.job_id)}
                  className={`mb-5 border rounded-lg cursor-pointer transition-all duration-200 ${job.job_id === selectedJobId
                    ? "border-primary shadow-md bg-primary/5"
                    : "border-gray-300 hover:border-gray-400"
                    }`}
                >
                  <JobCard
                    jobId={job.job_id}
                    jobTitle={job.job_title}
                    jobLocation={job.job_location || "Unknown Location"}
                    jobType={job.job_type || "N/A"}
                    compName={job.company?.comp_name || "Unknown Company"}
                    compLogo={job.company?.comp_logo || "/default-company.png"}
                    createdAt={new Date(job.created_at).toLocaleDateString()}
                    bookmark={job.is_bookmark}
                    onToggleBookmark={handleToggleBookmark}
                    loading={loadingId === job.job_id}
                  />
                </div>
              ))}

              {/* Pagination */}
              <div className="flex flex-col items-center pt-5 pb-10 text-sm text-gray-700">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(startIndex + jobsPerPage, filteredJobs.length)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-900">{filteredJobs.length}</span> jobs
                </span>

                <div className="inline-flex mt-3 gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`px-4 h-9 text-sm font-medium rounded-md border transition-all duration-200 ${currentPage === 1
                      ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                      : "bg-white text-gray-800 border-gray-400 hover:bg-gray-200 hover:text-black"
                      }`}
                  >
                    Prev
                  </button>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 h-9 text-sm font-medium rounded-md border transition-all duration-200 ${currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                      : "bg-white text-gray-800 border-gray-400 hover:bg-gray-200 hover:text-black"
                      }`}
                  >
                    Next
                  </button>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>
          )}

          {/* =================== RIGHT: Job Details =================== */}
          <div
            className={`transition-all duration-500 ease-in-out ${isExpanded ? "basis-full" : "basis-3/4 ms-10"
              } rounded-lg shadow-md border border-gray-300 p-6 bg-white`}
          >
            {selectedJob ? (
              <>
                {/* Header */}
                <div className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center">
                    <Image
                      src={selectedJob.company?.comp_logo || "/default-company.png"}
                      alt="Company Logo"
                      width={40}
                      height={40}
                      className="mr-3 object-contain"
                    />
                    <p className="text-lg font-semibold text-gray-700">
                      {selectedJob.company?.comp_name || "Unknown Company"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Image
                      src={
                        selectedJob.is_bookmark
                          ? "/bookmark-solid.svg"
                          : "/bookmark.svg"
                      }
                      alt="Bookmark"
                      width={28}
                      height={28}
                      className={`cursor-pointer hover:scale-110 transition-transform ${loadingId === selectedJob.job_id ? "opacity-50" : ""
                        }`}
                      onClick={() => handleToggleBookmark(selectedJob.job_id)}
                    />
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="transition-transform hover:scale-110"
                    >
                      <Image
                        src={isExpanded ? "/collapse.svg" : "/expand.svg"}
                        alt="Toggle View"
                        width={24}
                        height={24}
                      />
                    </button>
                  </div>
                </div>

                {/* Job Title & Meta */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-3 mb-4 mt-1">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-700 mb-4">
                      {selectedJob.job_title}
                    </h2>
                    <p className="text-gray-600">
                      {selectedJob.job_location} ({selectedJob.job_type})
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Posted on {new Date(selectedJob.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ButtonFilledPrimary
                    text={selectedJob.is_applied ? "Applied" : "Apply Now"}
                    onClick={() =>
                      !selectedJob.is_applied && router.push(`/jobseeker/jobs/apply/${selectedJob.job_id}`)
                    }
                    className={`mt-4 sm:mt-0 w-36 h-10 ${selectedJob.is_applied
                      ? "bg-gray-400 cursor-not-allowed opacity-70"
                      : "bg-primary"
                      }`}
                    disabled={selectedJob.is_applied}
                  />
                </div>

                {/* Job Description */}
                <section className="mb-6 fade-in">
                  <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                    Job Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {selectedJob.job_description || "No description provided."}
                  </p>
                </section>

                {/* Requirements */}
                {selectedJob.job_requirement && selectedJob.job_requirement.length > 0 && (
                  <section className="mb-6 fade-in">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                      Requirements
                    </h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {selectedJob.job_requirement.map((req: JobRequirement) => (
                        <li key={req.job_requirement_id}>{req.requirement}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Benefits */}
                {selectedJob.job_benefits && (
                  <section className="mb-6 fade-in">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                      Benefits
                    </h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {selectedJob.job_benefits}
                    </p>
                  </section>
                )}

                {/* Overview */}
                <section className="fade-in">
                  <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                    Company Overview
                  </h3>
                  <div className="flex flex-col gap-2 text-gray-600">
                    <p>
                      <span className="font-bold">Industry:</span>{" "}
                      {selectedJob.company?.comp_industry || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold">Website:</span>{" "}
                      {selectedJob.company?.comp_website ? (
                        <a
                          href={selectedJob.company.comp_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline hover:text-blue-600"
                        >
                          {selectedJob.company.comp_website}
                        </a>
                      ) : (
                        <span>N/A</span>
                      )}
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <p className="text-gray-500 text-center py-20">
                Select a job to view details.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
