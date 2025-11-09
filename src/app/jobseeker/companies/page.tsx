"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import CompanyCard from "@/components/jobseeker/companies/CompanyCard";
import ButtonFilledPrimary from "@/components/shared/buttons/ButtonFilledPrimary";
import JobCard from "@/components/jobseeker/jobs/JobCard";

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleJobsCount, setVisibleJobsCount] = useState(4);

  const companiesPerPage = 5;

  // =============================
  // Fetch companies
  // =============================
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/jobseeker/companies");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const data = await res.json();
        setCompanies(data.companies || []);
        if (data.companies.length > 0) {
          const firstId = data.companies[0].comp_id;
          setSelectedCompanyId(firstId);
          await handleSelectCompany(firstId);
        }

      } catch (err: any) {
        console.error("Error fetching companies:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  // =============================
  // Pagination logic
  // =============================
  const totalPages = Math.ceil(companies.length / companiesPerPage);
  const startIndex = (currentPage - 1) * companiesPerPage;
  const currentCompanies = companies.slice(startIndex, startIndex + companiesPerPage);
  const selectedCompany = companies.find((c) => c.comp_id === selectedCompanyId);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleSelectCompany = async (id: number) => {
    setSelectedCompanyId(id);
    setVisibleJobsCount(4);
    setLoading(true);
    try {
      const res = await fetch(`/api/jobseeker/companies?company_id=${id}`);
      const data = await res.json();
      if (data.company) {
        setCompanies((prev) =>
          prev.map((c) => (c.comp_id === id ? data.company : c))
        );
      }
    } catch (err) {
      console.error("Error fetching company details:", err);
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // Loading and Error Handling
  // =============================
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading companies...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {error}
      </div>
    );

  if (companies.length === 0)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        No companies available.
      </div>
    );

  // =============================
  // UI Layout
  // =============================
  return (
    <div
      className={`flex max-w-8/10 mx-auto my-8 transition-all duration-500 ease-in-out ${isExpanded ? "flex-col" : "flex-row"
        }`}
    >
      {/* =================== LEFT: Company List =================== */}
      {!isExpanded && (
        <div className="basis-1/4">
          {currentCompanies.map((company) => (
            <div
              key={company.comp_id}
              onClick={() => handleSelectCompany(company.comp_id)}
              className={`mb-5 border rounded-lg cursor-pointer transition-all duration-200 ${company.comp_id === selectedCompanyId
                ? "border-primary shadow-md bg-primary/5"
                : "border-gray-300 hover:border-gray-400"
                }`}
            >
              <CompanyCard
                compId={company.comp_id}
                compName={company.comp_name}
                compLogo={company.comp_logo || "/default-company.png"}
                industry={company.comp_industry || "Unknown Industry"}
                location={company.comp_location || "Unknown Location"}
                employeeSize={company.comp_size || "N/A"}
                rating={company.comp_rating || 0.0} // one decimal place
                totalJobs={company.total_jobs}
                benefitsTag={company.benefit_tag}
              />
            </div>
          ))}

          {/* Pagination */}
          <div className="flex flex-col items-center pt-5 pb-10 text-sm text-gray-700">
            <span>
              Showing{" "}
              <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(startIndex + companiesPerPage, companies.length)}
              </span>{" "}
              of <span className="font-semibold text-gray-900">{companies.length}</span> companies
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

      {/* =================== RIGHT: Company Details =================== */}
      <div
        className={`transition-all duration-500 ease-in-out ${isExpanded ? "basis-full" : "basis-3/4 ms-10"
          } rounded-lg shadow-md border border-gray-300 px-14 py-12 bg-white`}
      >
        {selectedCompany ? (
          <>
            {/* Header */}
            <div className="pb-6 border-b border-gray-100">
              <div className="flex flex-row items-start justify-between">
                <div className="flex items-center">
                  <img
                    src={selectedCompany.comp_logo || "/default-company.png"}
                    alt={`${selectedCompany.comp_name} Logo`}
                    className="w-32 h-32 rounded-full object-cover border border-gray-200"
                  />
                </div>

                <div className="flex gap-4 items-center">
                  <button
                    title="More Options"
                    className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition-all duration-150"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-800 cursor-pointer hover:text-gray-600" />
                  </button>

                  <button
                    title="Expand"
                    className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition-all duration-150 cursor-pointer"
                  >
                    <img src="/expand.svg" alt="Expand" className="w-4 h-4 opacity-70" />
                  </button>
                </div>
              </div>

              <div className="flex flex-row items-start justify-between mt-6">
                <div className="flex flex-col">
                  <h2 className="text-4xl font-bold text-gray-900">
                    {selectedCompany.comp_name}
                  </h2>

                  <p className="text-gray-600 text-lg capitalize mt-4">
                    {selectedCompany.comp_industry || "Unknown Industry"}
                  </p>

                  <p className="text-gray-500 text-md mt-4">
                    {selectedCompany.comp_location || "Unknown Location"}
                    {/* {selectedCompany.comp_followers
                      ? ` · ${selectedCompany.comp_followers} followers`
                      : ""} */}
                    {selectedCompany.comp_size
                      ? ` · ${selectedCompany.comp_size}`
                      : " · N/A employees"}
                  </p>
                </div>

                <ButtonFilledPrimary
                  text={selectedCompany.comp_website ? "Visit Website" : "No Website"}
                  onClick={() => {
                    if (selectedCompany.comp_website)
                      window.open(selectedCompany.comp_website, "_blank");
                  }}
                  className={`h-10 w-36 border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-all duration-200 ${!selectedCompany.comp_website &&
                    "opacity-60 cursor-not-allowed hover:bg-white"
                    }`}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 mt-5 border-b border-gray-200 text-gray-600 font-medium text-sm">
              <button className="pb-3 border-b-2 border-primary text-primary">
                About
              </button>
              <button className="pb-3 hover:text-black">Jobs</button>
              <button className="pb-3 hover:text-black">People</button>
              <button className="pb-3 hover:text-black">Life</button>
            </div>

            {/* About Section */}
            <section className="mt-5">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">About</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {selectedCompany.comp_description ||
                  "No company description provided."}
              </p>
            </section>

            {/* Jobs Section */}
            {selectedCompany.jobs && selectedCompany.jobs.length > 0 && (
              <section className="mt-8">
                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  Jobs ({selectedCompany.jobs.length} open)
                </h3>

                {/* Job Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedCompany.jobs
                    .slice(0, visibleJobsCount)
                    .map((job: any) => (
                      <JobCard
                        key={job.job_id}
                        jobId={job.job_id}
                        compLogo={selectedCompany.comp_logo}
                        compName={selectedCompany.comp_name}
                        jobTitle={job.job_title}
                        jobLocation={job.job_location || "Unknown"}
                        jobType={job.job_type || "N/A"}
                        createdAt={new Date(job.created_at).toLocaleDateString()}
                        navigateOnClick={true}
                      />
                    ))}
                </div>

                {/* Buttons at the bottom */}
                <div className="flex justify-center mt-6">
                  {selectedCompany.jobs.length > visibleJobsCount ? (
                    <button
                      onClick={() => {
                        setVisibleJobsCount(prev => prev + 4);
                        setTimeout(() => window.scrollBy({ top: 300, behavior: "smooth" }), 200);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Show more jobs →
                    </button>
                  ) : visibleJobsCount > 4 ? (
                    <button
                      onClick={() => setVisibleJobsCount(4)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Show less
                    </button>
                  ) : null}
                </div>
              </section>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-center py-20">
            Select a company to view details.
          </p>
        )}
      </div>
    </div>
  );
}
