"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";

import CompanyCard from "@/components/jobseeker/companies/CompanyCard";
import ButtonFilledPrimary from "@/components/shared/buttons/ButtonFilledPrimary";
import JobCard from "@/components/jobseeker/jobs/JobCard";
import SearchBar from "@/components/jobseeker/shared/SearchBar";
import CompaniesLoading from "./loading";

// Type for company data from API with additional fields
type CompanyWithJobs = {
  comp_id: number;
  comp_name: string;
  comp_logo: string | null;
  comp_industry: string | null;
  comp_location: string | null;
  comp_size: string | null;
  comp_rating: number | null;
  comp_description: string | null;
  comp_website: string | null;
  total_jobs: number;
  benefit_tag?: string;
  jobs?: Array<{
    job_id: number;
    job_title: string;
    job_location: string | null;
    job_type: string | null;
    created_at: string;
  }>;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithJobs[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyWithJobs[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleJobsCount, setVisibleJobsCount] = useState(4);
  const isExpanded = false;

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
        setFilteredCompanies(data.companies || []);
        if (data.companies.length > 0) {
          const firstId = data.companies[0].comp_id;
          setSelectedCompanyId(firstId);
          await handleSelectCompany(firstId);
        }

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch companies";
        console.error("Error fetching companies:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  // =============================
  // Search functionality
  // =============================
  const handleSearch = (query: string, location: string) => {
    let filtered = companies;

    if (query) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter((company) =>
        company.comp_name.toLowerCase().includes(queryLower)
      );
    }

    if (location) {
      const locationLower = location.toLowerCase();
      filtered = filtered.filter((company) =>
        company.comp_location?.toLowerCase().includes(locationLower)
      );
    }

    setFilteredCompanies(filtered);
    setCurrentPage(1);
    if (filtered.length > 0) {
      const firstId = filtered[0].comp_id;
      setSelectedCompanyId(firstId);
      handleSelectCompany(firstId);
    } else {
      setSelectedCompanyId(null);
    }
  };

  // =============================
  // Pagination logic
  // =============================
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);
  const startIndex = (currentPage - 1) * companiesPerPage;
  const currentCompanies = filteredCompanies.slice(startIndex, startIndex + companiesPerPage);
  const selectedCompany = filteredCompanies.find((c) => c.comp_id === selectedCompanyId);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleSelectCompany = async (id: number) => {
    setSelectedCompanyId(id);
    setVisibleJobsCount(4);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/jobseeker/companies?company_id=${id}`);
      const data = await res.json();
      if (data.company) {
        setCompanies((prev) =>
          prev.map((c) => (c.comp_id === id ? data.company : c))
        );
        setFilteredCompanies((prev) =>
          prev.map((c) => (c.comp_id === id ? data.company : c))
        );
      }
    } catch (err) {
      console.error("Error fetching company details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // =============================
  // Loading and Error Handling
  // =============================
  if (loading) return <CompaniesLoading />;

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
        queryPlaceholder="Company name"
        locationPlaceholder="Location"
      />

      {/* No Results Message */}
      {filteredCompanies.length === 0 && companies.length > 0 && (
        <div className="flex items-center justify-center py-20 text-gray-600">
          No companies found matching your search criteria.
        </div>
      )}

      {/* No Companies Available */}
      {companies.length === 0 && (
        <div className="flex items-center justify-center py-20 text-gray-600">
          No companies available.
        </div>
      )}

      {/* Companies Layout */}
      {filteredCompanies.length > 0 && (
        <div
          className={`flex transition-all duration-500 ease-in-out ${isExpanded ? "flex-col" : "flex-row"
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
                    {Math.min(startIndex + companiesPerPage, filteredCompanies.length)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-900">{filteredCompanies.length}</span> companies
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
            {detailsLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-600">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin" />
                  <span>Loading company details...</span>
                </div>
              </div>
            ) : selectedCompany ? (
              <>
                {/* Header */}
                <div className="pb-6 border-b border-gray-100">
                  <div className="flex flex-row items-start justify-between">
                    <div className="flex items-center">
                      <Image
                        src={selectedCompany.comp_logo || "/default-company.png"}
                        alt={`${selectedCompany.comp_name} Logo`}
                        width={128}
                        height={128}
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
                        <Image src="/expand.svg" alt="Expand" width={16} height={16} className="w-4 h-4 opacity-70" />
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
                        .map((job) => (
                          <JobCard
                            key={job.job_id}
                            jobId={job.job_id}
                            compLogo={selectedCompany.comp_logo || "/default-company.png"}
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
      )}
    </div>
  );
}
