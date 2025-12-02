"use client";

import { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import StatusDropdown from "@/components/recruiter/StatusDropdown";
import { ApplicationStatus } from "@/types";
import ApplicantsTableSkeleton from "@/components/recruiter/applicants/ApplicantsTableSkeleton";

interface Applicant {
  id: number;
  applicantName: string;
  applicantEmail: string | null;
  jobTitle: string;
  date: string;
  score: number;
  status: ApplicationStatus;
  redactedResumeUrl: string | null;
}

const STATUS_OPTIONS = ["received", "shortlisted", "rejected", "withdrawn"];

export default function RecruiterApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["received", "shortlisted"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);

  // Color by score
  const getColor = (score: number) => {
    if (score >= 85) return "border-green-500 text-green-500";
    if (score >= 60) return "border-yellow-400 text-yellow-500";
    if (score >= 40) return "border-orange-400 text-orange-500";
    return "border-red-500 text-red-500";
  };

  // Fetch applicants
  useEffect(() => {
    async function fetchApplicants() {
      try {
        setLoading(true);
        const query = selectedStatuses.length > 0 ? `?status=${selectedStatuses.join(",")}` : "";
        const res = await fetch(`/api/recruiter/applicants${query}`);
        const data = await res.json();
        if (res.ok) {
          setApplicants(data.applicants || []);
          setFilteredApplicants(data.applicants || []);
        } else {
          console.error("Error fetching applicants:", data.error);
        }
      } catch (err) {
        console.error("Fetch applicants error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchApplicants();
  }, [selectedStatuses]);

  // Handle search
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = applicants.filter(
      (a) =>
        a.applicantName.toLowerCase().includes(term) ||
        a.jobTitle.toLowerCase().includes(term)
    );
    setFilteredApplicants(filtered);
    setVisibleCount(10); // reset pagination when search changes
  }, [searchTerm, applicants]);

  // Toggle multi-select status filters
  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
    setVisibleCount(10); // reset pagination when filter changes
  };

  // See more handler
  const handleSeeMore = () => setVisibleCount((prev) => prev + 10);

  // Slice visible applicants
  const displayedApplicants = filteredApplicants.slice(0, visibleCount);

  return (
    <div className="max-w-8/10 p-10 justify-center mx-auto my-5 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Applicants</h1>

        <button className="flex items-center px-5 py-2 border rounded-full font-medium hover:bg-gray-50 transition">
          Suggested Applicants
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center w-full border rounded-full px-4 py-3 bg-white shadow-sm">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search applicants or jobs"
            className="w-full outline-none text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Filter className="w-5 h-5 text-gray-400 ml-2" />
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => toggleStatus(status)}
            className={`px-4 py-2 rounded-full font-medium capitalize border transition ${selectedStatuses.includes(status)
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <ApplicantsTableSkeleton />
      ) : displayedApplicants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <p className="text-center py-6 text-gray-500">No applicants found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 text-purple-600 text-left">
              <tr>
                <th className="px-6 py-3 font-semibold">Applicant</th>
                <th className="px-6 py-3 font-semibold">Job Title</th>
                <th className="px-6 py-3 font-semibold">Application Date</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {displayedApplicants.map((a, i) => (
                <tr
                  key={a.id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition`}
                >
                  <td className="px-6 py-4 flex items-center gap-4 font-semibold capitalize">
                    <div
                      className={`w-10 h-10 flex items-center justify-center border-2 rounded-full font-semibold text-xs ${getColor(
                        a.score
                      )}`}
                    >
                      {a.score.toFixed(0)}%
                    </div>
                    {a.applicantEmail ? (
                      <a
                        href={`mailto:${a.applicantEmail}`}
                        className="hover:underline cursor-pointer"
                        title={`Email ${a.applicantName}`}
                      >
                        {a.applicantName}
                      </a>
                    ) : (
                      <span>{a.applicantName}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{a.jobTitle}</td>
                  <td className="px-6 py-4">{a.date}</td>
                  <td className="px-6 py-4">
                    <StatusDropdown
                      applicationId={a.id}
                      currentStatus={a.status}
                      onStatusChange={(newStatus) => {
                        // Update local state when status changes
                        setApplicants((prev) =>
                          prev.map((applicant) =>
                            applicant.id === a.id
                              ? { ...applicant, status: newStatus }
                              : applicant
                          )
                        );
                        setFilteredApplicants((prev) =>
                          prev.map((applicant) =>
                            applicant.id === a.id
                              ? { ...applicant, status: newStatus }
                              : applicant
                          )
                        );
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {a.redactedResumeUrl ? (
                      <a
                        href={a.redactedResumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 font-medium cursor-pointer hover:underline"
                      >
                        View Details
                      </a>
                    ) : (
                      <span className="text-gray-400 font-medium">
                        No Resume
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer - See More */}
      {!loading && filteredApplicants.length > visibleCount && (
        <div
          className="text-center mt-6 text-sm text-purple-600 font-medium cursor-pointer hover:underline"
          onClick={handleSeeMore}
        >
          See More ↓
        </div>
      )}
    </div>
  );
}
