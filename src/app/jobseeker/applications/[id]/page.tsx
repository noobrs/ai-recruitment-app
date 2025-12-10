"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Briefcase, Building2, ExternalLink } from "lucide-react";
import ApplicationStatusPipeline from "@/components/jobseeker/applications/ApplicationStatusPipeline";
import { ApplicationStatus } from "@/types";
import { withdrawApplication } from "./actions";
import Image from "next/image";
import ApplicationDetailLoading from "./loading";

interface ApplicationDetail {
    applicationId: number;
    status: ApplicationStatus;
    appliedDate: string;
    job: {
        jobId: number;
        title: string;
    };
    company: {
        companyId: number;
        name: string;
        logo: string;
    };
    resume: {
        resumeId: number;
        filePath: string;
    } | null;
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [application, setApplication] = useState<ApplicationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

    useEffect(() => {
        async function fetchApplicationDetail() {
            try {
                setLoading(true);
                const res = await fetch(`/api/jobseeker/applications/${id}`);

                if (!res.ok) {
                    throw new Error(`Failed to fetch application: ${res.status}`);
                }

                const data = await res.json();
                setApplication(data.application);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setError(message);
            } finally {
                setLoading(false);
            }
        }

        fetchApplicationDetail();
    }, [id]);

    // 1. ADD THIS NEW EFFECT TO FREEZE SCROLLING
    useEffect(() => {
        if (showWithdrawConfirm) {
            // Prevent scrolling on the body
            document.body.style.overflow = "hidden";
        } else {
            // Restore scrolling
            document.body.style.overflow = "unset";
        }

        // Cleanup in case component unmounts
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showWithdrawConfirm]);

    const handleWithdraw = async () => {
        if (!application) return;

        try {
            setIsWithdrawing(true);
            const result = await withdrawApplication(application.applicationId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to withdraw application');
            }

            // Refresh application data
            const refreshRes = await fetch(`/api/jobseeker/applications/${id}`);
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setApplication(data.application);
            }

            setShowWithdrawConfirm(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert(`Error: ${message}`);
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (loading) {
        return <ApplicationDetailLoading />;
    }

    if (error || !application) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
                    <p className="text-gray-600 mb-6">
                        {error || "The application you're looking for doesn't exist."}
                    </p>
                    <button
                        onClick={() => router.push("/jobseeker/applications")}
                        className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition"
                    >
                        Back to Applications
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push("/jobseeker/applications")}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Applications
                    </button>
                </div>

                {/* Row 1: Status Pipeline */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <ApplicationStatusPipeline currentStatus={application.status} />
                </div>

                {/* Row 2: Application Info */}
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                    {/* Job + Company summary */}
                    <div className="flex items-start gap-4">
                        {application.company.logo && (
                            <Image
                                src={application.company.logo}
                                alt={application.company.name}
                                width={56}
                                height={56}
                                className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                            />
                        )}
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-gray-400" />
                                {application.job.title}
                            </h2>
                            <p className="mt-1 flex items-center gap-2 text-gray-700">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>{application.company.name}</span>
                            </p>
                        </div>

                        {/* View job (optional, but still useful) */}
                        <button
                            onClick={() =>
                                router.push(`/jobseeker/jobs/view/${application.job.jobId}`)
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                        >
                            View Job
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="border-t border-gray-300 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Applied date */}
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Applied Date</p>
                                <p className="font-medium text-gray-900">
                                    {application.appliedDate}
                                </p>
                            </div>
                        </div>

                        {/* View applied resume only */}
                        {application.resume && (
                            <a
                                href={application.resume.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
                            >
                                View Applied Resume
                            </a>
                        )}
                    </div>

                    {/* Withdraw button - only show if status allows */}
                    {application.status !== 'withdrawn' && application.status !== 'rejected' && (
                        <div className="border-t border-gray-300 pt-4">
                            <button
                                onClick={() => setShowWithdrawConfirm(true)}
                                className="w-full sm:w-auto px-6 py-2 rounded-full border border-red-500 text-red-500 text-sm font-medium hover:bg-red-50 transition"
                            >
                                Withdraw Application
                            </button>
                        </div>
                    )}
                </div>

                {/* Withdraw Confirmation Modal */}
                {showWithdrawConfirm && (
                    // 2. UPDATED CLASSES HERE: changed bg-opacity-50 to bg-black/70
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Withdraw Application?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to withdraw your application for <strong>{application.job.title}</strong> at <strong>{application.company.name}</strong>?
                                You can reapply later if you change your mind.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowWithdrawConfirm(false)}
                                    disabled={isWithdrawing}
                                    className="flex-1 px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={isWithdrawing}
                                    className="flex-1 px-6 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition disabled:opacity-50"
                                >
                                    {isWithdrawing ? 'Withdrawing...' : 'Yes, Withdraw'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
