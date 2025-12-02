"use client";

import { useEffect, useState } from "react";
import BrowseJobsAction from "@/components/jobseeker/jobs/JobsBrowseAction";
import Link from "next/link";
import { DashboardResponse } from "@/app/api/jobseeker/dashboard/route";
import JobSeekerDashboardLoading from "./loading";

interface DashboardClientProps {
    user: {
        first_name: string | null;
        last_name?: string | null;
        job_seeker_id?: number;
    };
}

export default function DashboardClient({ }: DashboardClientProps) {
    const [stats, setStats] = useState<DashboardResponse | null>(null);

    useEffect(() => {
        async function load() {
            const res = await fetch("/api/jobseeker/dashboard");
            const data = await res.json();
            setStats(data);
        }
        load();
    }, []);

    if (!stats)
        return (
            <JobSeekerDashboardLoading />
        );

    const recent = stats.recentApplications ?? [];

    return (
        <>
            {/* ======= STATS CARDS ======= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Applications */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Applications</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.totalApplications}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Total submitted</p>
                </div>

                {/* Applications this week */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">This Week</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">
                        {stats.applicationsThisWeek}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">New applications</p>
                </div>

                {/* Saved Jobs */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Saved Jobs</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        {stats.savedJobs}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Bookmarked</p>
                </div>
            </div>

            {/* ======= QUICK ACTIONS ======= */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Quick Actions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <BrowseJobsAction />

                    <Link
                        href="/jobseeker/profile"
                        className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-primary hover:text-primary transition-colors"
                    >
                        <span className="text-sm font-medium">Edit Profile</span>
                    </Link>

                    <Link
                        href="/jobseeker/applications"
                        className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-primary hover:text-primary transition-colors"
                    >
                        <span className="text-sm font-medium">View Applications</span>
                    </Link>

                    <Link
                        href="/jobseeker/companies"
                        className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-primary hover:text-primary transition-colors"
                    >
                        <span className="text-sm font-medium">Browse Companies</span>
                    </Link>
                </div>
            </div>

            {/* ======= RECENT APPLICATIONS ======= */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Recent Applications
                </h2>

                {recent.length === 0 ? (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
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
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No applications yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Start applying to jobs to see your applications here.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {recent
                            .filter((app) => app.status !== "unknown")
                            .map((app) => (
                                <li
                                    key={app.id}
                                    className="py-4 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{app.jobTitle}</p>
                                        <p className="text-sm text-gray-600">{app.companyName}</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-gray-700">{app.date}</p>

                                        <span
                                            className={`inline-block mt-1 text-xs font-semibold px-2 py-1 rounded-full
                      ${app.status === "shortlisted" ||
                                                    app.status === "received"
                                                    ? "bg-green-100 text-green-700"
                                                    : app.status === "rejected"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-blue-100 text-blue-700"
                                                }`}
                                        >
                                            {app.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                    </ul>
                )}
            </div>
        </>
    );
}
