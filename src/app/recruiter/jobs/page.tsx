"use client";

import { useEffect, useState } from "react";
import JobCard from "@/components/jobseeker/jobs/JobCard"; // reuse card
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { RecruiterJobItem } from "@/types/job.types";

const STATUS_OPTIONS = ["open", "closed", "draft", "deleted"];

export default function RecruiterJobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<RecruiterJobItem[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<RecruiterJobItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["open"]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);

  // Fetch
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const res = await fetch("/api/recruiter/jobs");
        const data = await res.json();

        if (res.ok) {
          setJobs(data.jobs || []);
          setFilteredJobs(data.jobs || []);
        }
      } catch (err) {
        console.error("Error fetching recruiter jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  // Search + Filter + Sort
  useEffect(() => {
    let list = [...jobs];

    // search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(term) ||
          j.location.toLowerCase().includes(term)
      );
    }

    // status filter
    if (selectedStatuses.length > 0) {
      list = list.filter((job) =>
        selectedStatuses.includes(job.status.toLowerCase())
      );
    }

    // sort
    list.sort((a, b) => {
      const d1 = new Date(a.date).getTime();
      const d2 = new Date(b.date).getTime();
      return sortOrder === "newest" ? d2 - d1 : d1 - d2;
    });

    setFilteredJobs(list);
  }, [jobs, searchTerm, selectedStatuses, sortOrder]);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-10 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">All Job Listings</h1>

      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center flex-1 border rounded-full px-4 py-3 bg-white shadow-sm">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by job title or location"
            className="flex-1 outline-none text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sort Button */}
        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))
          }
          className="flex items-center justify-center gap-2 px-4 py-3 
             border rounded-full bg-white shadow-sm hover:bg-gray-50
             min-w-[160px]"
        >
          <ArrowUpDown className="w-5 h-5" />
          <span className="whitespace-nowrap">
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </span>
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {STATUS_OPTIONS.map((status) => {
          const active = selectedStatuses.includes(status);
          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-4 py-2 capitalize rounded-full border text-sm font-medium ${active
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Job List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {!loading && filteredJobs.length === 0 && (
          <p className="text-gray-500 col-span-full text-center mt-10">
            No jobs match your filters.
          </p>
        )}

        {loading ? (
          <p className="text-center col-span-full">Loading...</p>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.job_id}
              onClick={() =>
                router.push(`/recruiter/jobs/view/${job.job_id}`)
              }
              className="cursor-pointer"
            >
              <JobCard
                jobId={job.job_id}
                jobTitle={job.title}
                jobLocation={job.location}
                jobType={job.type}
                compName={job.company.name}
                compLogo={job.company.logo}
                createdAt={job.date}
                navigateOnClick={true}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
