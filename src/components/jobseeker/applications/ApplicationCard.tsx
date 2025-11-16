"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface ApplicationCardProps {
    applicationId: number;
    jobId: number;
    jobTitle: string;
    companyName: string;
    companyLogo: string;
    jobLocation: string;
    jobType: string;
    status: string;
    appliedDate: string;
    matchScore?: number;
}

const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
    received: { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100" },
    reviewed: { bg: "bg-purple-50", text: "text-purple-700", badge: "bg-purple-100" },
    shortlisted: { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" },
    interview: { bg: "bg-indigo-50", text: "text-indigo-700", badge: "bg-indigo-100" },
    offered: { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100" },
    hired: { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100" },
    rejected: { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100" },
    withdrawn: { bg: "bg-gray-50", text: "text-gray-700", badge: "bg-gray-100" },
};

export default function ApplicationCard({
    jobId,
    jobTitle,
    companyName,
    companyLogo,
    jobLocation,
    jobType,
    status,
    appliedDate,
}: ApplicationCardProps) {
    const router = useRouter();
    const colors = statusColors[status] || statusColors.received;

    return (
        <div
            className={`${colors.bg} border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all cursor-pointer`}
            onClick={() => router.push(`/jobseeker/jobs/${jobId}`)}
        >
            {/* Header with company logo and name */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Image
                        src={companyLogo}
                        alt={companyName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">{jobTitle}</h3>
                        <p className="text-sm text-gray-600">{companyName}</p>
                    </div>
                </div>

                {/* Status Badge */}
                <span
                    className={`${colors.badge} ${colors.text} px-3 py-1 rounded-full text-xs font-semibold uppercase`}
                >
                    {status}
                </span>
            </div>

            {/* Job Details */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    <span>{jobLocation}</span>
                </div>
                <div className="flex items-center gap-1">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                    <span>{jobType}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <span>Applied on {appliedDate}</span>
                </div>
            </div>
        </div>
    );
}
