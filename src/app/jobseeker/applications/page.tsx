"use client";

import { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { ApplicationStatus } from "@/types";
import ApplicationsLoading from "./loading";

interface Application {
    applicationId: number;
    jobId: number;
    jobTitle: string;
    companyName: string;
    status: ApplicationStatus;
    appliedDate: string;
}

// All application statuses from Supabase enum (excluding 'unknown' which is for bookmarks only)
const STATUS_OPTIONS: ApplicationStatus[] = ["received", "shortlisted", "rejected", "withdrawn"];

export default function ApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
    // Default: show all application statuses
    const [selectedStatuses, setSelectedStatuses] = useState<ApplicationStatus[]>(STATUS_OPTIONS);
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleCount, setVisibleCount] = useState(10);
    const [loading, setLoading] = useState(true);

    // Fetch applications
    useEffect(() => {
        async function fetchApplications() {
            try {
                setLoading(true);
                const query = selectedStatuses.length > 0 ? `?status=${selectedStatuses.join(",")}` : "";
                const res = await fetch(`/api/jobseeker/applications${query}`);

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
                }

                const data = await res.json();
                setApplications(data.applications || []);
                setFilteredApplications(data.applications || []);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                console.error("Error fetching applications:", message);
            } finally {
                setLoading(false);
            }
        }

        fetchApplications();
    }, [selectedStatuses]);

    // Handle search
    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = applications.filter(
            (a) =>
                a.jobTitle.toLowerCase().includes(term) ||
                a.companyName.toLowerCase().includes(term)
        );
        setFilteredApplications(filtered);
        setVisibleCount(10); // reset pagination when search changes
    }, [searchTerm, applications]);

    // Toggle multi-select status filters
    const toggleStatus = (status: ApplicationStatus) => {
        setSelectedStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status)
                : [...prev, status]
        );
        setVisibleCount(10); // reset pagination when filter changes
    };

    // See more handler
    const handleSeeMore = () => setVisibleCount((prev) => prev + 10);

    // Slice visible applications
    const displayedApplications = filteredApplications.slice(0, visibleCount);

    if (loading) {
        return <ApplicationsLoading />;
    }

    return (
        <div className="max-w-8/10 p-10 justify-center mx-auto my-5 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Applications</h1>

                <button
                    onClick={() => router.push('/jobseeker/jobs')}
                    className="flex items-center px-5 py-2 border rounded-full font-medium hover:bg-gray-50 transition"
                >
                    Browse Jobs
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center w-full border rounded-full px-4 py-3 bg-white shadow-sm">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search by job title or company name"
                        className="w-full outline-none text-gray-700 placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Filter className="w-5 h-5 text-gray-400 ml-2" />
                </div>
            </div>

            {/* Status Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
                {STATUS_OPTIONS.map((status) => (
                    <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={`px-4 py-2 rounded-full font-medium capitalize border transition ${selectedStatuses.includes(status)
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
                {displayedApplications.length === 0 ? (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-16 w-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No Applications Found</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            {searchTerm ? "Try adjusting your search or filters." : "You haven't applied to any jobs yet. Start browsing and apply to your dream job!"}
                        </p>
                        <button
                            onClick={() => router.push('/jobseeker/jobs')}
                            className="mt-6 inline-block px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
                        >
                            Browse Jobs
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-50 text-primary text-left">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Job Title</th>
                                <th className="px-6 py-3 font-semibold">Company</th>
                                <th className="px-6 py-3 font-semibold">Application Date</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedApplications.map((app, i) => (
                                <tr
                                    key={app.applicationId}
                                    className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-gray-100 transition`}
                                >
                                    <td className="px-6 py-4 font-semibold">{app.jobTitle}</td>
                                    <td className="px-6 py-4">{app.companyName}</td>
                                    <td className="px-6 py-4">{app.appliedDate}</td>
                                    <td className="px-6 py-4 capitalize">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === 'shortlisted'
                                            ? 'bg-blue-100 text-green-700'
                                            : app.status === 'rejected'
                                                ? 'bg-red-100 text-red-700'
                                                : app.status === 'withdrawn'
                                                    ? 'bg-gray-100 text-gray-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td
                                        className="px-6 py-4 text-primary font-medium cursor-pointer hover:underline"
                                        onClick={() => router.push(`/jobseeker/applications/${app.applicationId}`)}
                                    >
                                        View Detail
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer - See More */}
            {filteredApplications.length > visibleCount && (
                <div
                    className="text-center mt-6 text-sm text-primary font-medium cursor-pointer hover:underline"
                    onClick={handleSeeMore}
                >
                    See More ↓
                </div>
            )}
        </div>
    );
}
