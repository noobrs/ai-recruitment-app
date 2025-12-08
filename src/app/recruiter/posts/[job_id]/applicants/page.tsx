"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Filter } from "lucide-react";
import LoadingPostDetailsPage from "./loading";

interface Applicant {
    id: number;
    applicantName: string;
    date: string;
    score: number;
    status: string;
}

export default function JobApplicantsPage() {
    const { job_id } = useParams();
    const router = useRouter();

    const [job, setJob] = useState<any>(null);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [visibleCount, setVisibleCount] = useState(10);
    const [loading, setLoading] = useState(true);

    // Get color by score
    const getColor = (score: number) => {
        if (score >= 85) return "border-green-500 text-green-500";
        if (score >= 60) return "border-yellow-400 text-yellow-500";
        if (score >= 40) return "border-orange-400 text-orange-500";
        return "border-red-500 text-red-500";
    };

    // Fetch job details
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const res = await fetch(`/api/recruiter/posts/${job_id}/applicants?sort=${sortOrder}`);
                const data = await res.json();

                if (res.ok) {
                    setJob(data.job);
                    setApplicants(data.applicants || []);
                    setFilteredApplicants(data.applicants || []);
                }
            } catch (err) {
                console.error("Error fetching:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [job_id, sortOrder]);


    // Fetch applicants
    useEffect(() => {
        async function fetchApplicants() {
            try {
                setLoading(true);
                const res = await fetch(
                    `/api/recruiter/posts/${job_id}/applicants?sort=${sortOrder}`
                );
                const data = await res.json();
                if (res.ok) {
                    setApplicants(data.applicants || []);
                    setFilteredApplicants(data.applicants || []);
                } else {
                    console.error("Error fetching job applicants:", data.error);
                }
            } catch (err) {
                console.error("Fetch applicants error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchApplicants();
    }, [job_id, sortOrder]);

    // Handle search
    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = applicants.filter((a) =>
            a.applicantName.toLowerCase().includes(term)
        );
        setFilteredApplicants(filtered);
        setVisibleCount(10); // reset pagination
    }, [searchTerm, applicants]);

    // See more handler
    const handleSeeMore = () => setVisibleCount((prev) => prev + 10);

    // Sort toggle
    const toggleSort = () =>
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

    const displayedApplicants = filteredApplicants.slice(0, visibleCount);

    if (loading) { return <LoadingPostDetailsPage />; }

    return (
        <div className="max-w-8/10 p-10 justify-center mx-auto my-5 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Applicants</h1>
                    <p className="text-gray-500 text-sm">
                        Job ID: <span className="font-medium">{job_id}</span>
                    </p>
                </div>

                <button
                    className="flex items-center px-4 py-2 border rounded-full font-medium hover:bg-gray-50"
                    onClick={() => router.push("/recruiter/posts")}
                >
                    ← Back to Posts
                </button>
            </div>

            {/* Job Details Header Card */}
            {job && (
                <div className="relative bg-white rounded-2xl shadow-md border border-gray-200 py-6 px-8 mb-10 overflow-hidden">

                    {/* Accent bar */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-purple-600"></div>

                    <div className="flex justify-between items-start gap-6">
                        {/* Left Side */}
                        <div>
                            <div className="flex items-center gap-4">
                                <img
                                    src={job.compLogo}
                                    alt="Company Logo"
                                    className="w-14 h-14 rounded-lg object-contain bg-gray-50 border"
                                />

                                <div>
                                    <h1 className="text-2xl font-bold">{job.title}</h1>
                                    <p className="text-gray-600 mt-1">{job.company}</p>
                                </div>
                            </div>

                            {/* Job metadata pills */}
                            <div className="flex flex-wrap gap-3 mt-5 text-sm">
                                <span className="px-4 py-1 bg-purple-50 text-purple-700 font-medium rounded-full border border-purple-200">
                                    {job.type || "Unknown Type"}
                                </span>

                                <span className="px-4 py-1 bg-gray-100 text-gray-700 font-medium rounded-full border border-gray-300">
                                    {job.location}
                                </span>

                                <span
                                    className={`
                                    px-4 py-1 rounded-full font-medium border 
                                    ${job.status === "open" && "bg-green-50 text-green-700 border-green-300"}
                                    ${job.status === "closed" && "bg-yellow-50 text-yellow-600 border-yellow-300"}
                                    ${job.status === "deleted" && "bg-red-50 text-red-600 border-red-300"}
                                    ${job.status === "draft" && "bg-gray-200 text-gray-700 border-gray-300"}
                                    `}
                                >
                                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                </span>
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Posted on</p>
                            <p className="text-lg font-semibold text-gray-800">{job.date}</p>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500">Total Applicants</p>
                                <p className="text-3xl font-bold text-purple-700">{applicants.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Search */}
            <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center w-full border rounded-full px-4 py-3 bg-white shadow-sm">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search applicants by name"
                        className="w-full outline-none text-gray-700 placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Filter className="w-5 h-5 text-gray-400 ml-2" />
                </div>
            </div>

            {/* If no applicants at all */}
            {!loading && applicants.length === 0 && (
                <div className="text-center mt-20 text-gray-500">
                    <p className="text-xl font-semibold mb-2">No Applicants Yet</p>
                    <p className="text-sm">
                        Once candidates apply for this job, they will appear here.
                    </p>
                </div>
            )}


            {/* Scroll Navigation Tabs */}
            <div className="flex gap-3 mb-8 flex-wrap">
                {["shortlisted", "received", "rejected", "withdrawn"].map((status) => {
                    const count = applicants.filter((a) => a.status === status).length;
                    if (count === 0) return null;

                    const label = status.charAt(0).toUpperCase() + status.slice(1);
                    return (
                        <a
                            key={status}
                            href={`#section-${status}`}
                            className="px-4 py-2 rounded-full border font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                        >
                            {label} ({count})
                        </a>
                    );
                })}
            </div>

            {/* Grouped Applicants */}
            <div className="mt-10 space-y-12">
                {["shortlisted", "received", "rejected", "withdrawn"].map((status) => {
                    const group = applicants.filter((a) => a.status === status);
                    if (group.length === 0) return null;

                    return (
                        <div key={status} id={`section-${status}`} className="scroll-mt-28">
                            {/* Section Title */}
                            <h2 className="text-xl font-bold mb-3 capitalize flex items-center gap-2">
                                {status}
                                <span className="text-purple-600 text-base font-semibold">
                                    ({group.length})
                                </span>
                            </h2>

                            {/* Table Container */}
                            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                                <table className="min-w-full table-fixed text-sm text-gray-700">
                                    <thead>
                                        <tr className="bg-gray-50 text-purple-600">
                                            <th className="px-6 py-4 font-semibold w-[30%] text-left">Applicant</th>
                                            <th className="px-6 py-4 font-semibold w-[10%] text-left">Score</th>
                                            <th className="px-6 py-4 font-semibold w-[20%] text-left">Application Date</th>
                                            <th className="px-6 py-4 font-semibold w-[20%] text-left">Status</th>
                                            <th className="px-6 py-4 font-semibold w-[20%] text-left"></th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {group.map((a, i) => (
                                            <tr
                                                key={a.id}
                                                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                    } hover:bg-gray-100 transition`}
                                            >
                                                {/* Applicant */}
                                                <td className="px-6 py-4 flex items-center gap-3 font-semibold">
                                                    <div
                                                        className={`w-10 h-10 flex items-center justify-center rounded-full border-2 text-xs font-bold ${getColor(
                                                            a.score
                                                        )}`}
                                                    >
                                                        {a.score}%
                                                    </div>
                                                    {a.applicantName}
                                                </td>

                                                {/* Score */}
                                                <td className="px-6 py-4">{a.score}</td>

                                                {/* Date */}
                                                <td className="px-6 py-4">{a.date}</td>

                                                {/* Status */}
                                                <td className="px-6 py-4 capitalize font-medium">
                                                    {a.status}
                                                </td>

                                                {/* View Details */}
                                                <td className="px-6 py-4 text-purple-600 font-medium cursor-pointer hover:underline text-right">
                                                    View Details
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

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
