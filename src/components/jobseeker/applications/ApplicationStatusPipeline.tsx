"use client";

import { ApplicationStatus } from "@/types";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

interface ApplicationStatusPipelineProps {
    currentStatus: ApplicationStatus;
}

// Define the pipeline steps
const PIPELINE_STEPS: { status: ApplicationStatus; label: string }[] = [
    { status: "received", label: "Received" },
    { status: "shortlisted", label: "Shortlisted" },
    { status: "rejected", label: "Rejected" }
];

export default function ApplicationStatusPipeline({ currentStatus }: ApplicationStatusPipelineProps) {
    // Determine if the application was rejected or withdrawn
    const isRejected = currentStatus === "rejected";
    const isWithdrawn = currentStatus === "withdrawn";

    // If withdrawn, show only withdrawn status
    if (isWithdrawn) {
        return (
            <div className="w-full py-8">
                <h3 className="text-lg font-semibold mb-6 text-gray-800">Application Status</h3>
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-500 text-white">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <span className="mt-3 text-sm font-medium text-gray-700 capitalize">
                        Withdrawn
                    </span>
                    <div className="mt-8">
                        <div className="px-6 py-3 rounded-full text-sm font-semibold uppercase bg-gray-100 text-gray-700">
                            Current Status: Withdrawn
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Find the current step index
    const currentStepIndex = PIPELINE_STEPS.findIndex(step => step.status === currentStatus);

    const getStepStatus = (index: number, stepStatus: ApplicationStatus | "under_review") => {
        // Special handling for rejected status
        if (isRejected && stepStatus === "rejected") {
            return "rejected";
        }

        if (isRejected) {
            // If rejected, show all steps before rejection as completed
            if (index < PIPELINE_STEPS.length - 1) {
                return index < currentStepIndex ? "completed" : "inactive";
            }
            return "rejected";
        }

        if (index < currentStepIndex) return "completed";
        if (index === currentStepIndex) return "current";
        return "upcoming";
    };

    return (
        <div className="w-full py-8">

            <div className="relative">
                {/* Pipeline Steps */}
                <div className="flex items-center justify-between relative">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-10">
                        <div
                            className={`h-full transition-all duration-500 ${isRejected ? "bg-red-500" : "bg-green-500"
                                }`}
                            style={{
                                width: `${(currentStepIndex / (PIPELINE_STEPS.length - 1)) * 100}%`,
                            }}
                        />
                    </div>

                    {/* Steps */}
                    {PIPELINE_STEPS.map((step, index) => {
                        const status = getStepStatus(index, step.status);
                        return (
                            <div key={step.status} className="flex flex-col items-center relative z-10">
                                {/* Circle */}
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${status === "completed"
                                        ? "bg-green-500 text-white"
                                        : status === "current"
                                            ? "bg-blue-500 text-white ring-4 ring-blue-200"
                                            : status === "rejected"
                                                ? "bg-red-500 text-white"
                                                : "bg-gray-200 text-gray-400"
                                        }`}
                                >
                                    {status === "completed" ? (
                                        <CheckCircle2 className="w-6 h-6" />
                                    ) : status === "rejected" ? (
                                        <XCircle className="w-6 h-6" />
                                    ) : (
                                        <Circle className="w-6 h-6" />
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={`mt-3 text-sm font-medium text-center ${status === "completed" || status === "current"
                                        ? "text-gray-900"
                                        : status === "rejected"
                                            ? "text-red-700"
                                            : "text-gray-400"
                                        }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
