"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { ApplicationStatus } from "@/types";
import { updateApplicantStatus } from "@/app/recruiter/applicants/actions";

interface StatusDropdownProps {
    applicationId: number;
    currentStatus: ApplicationStatus;
    onStatusChange?: (newStatus: ApplicationStatus) => void;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string; recruiterCanSet?: boolean }[] = [
    { value: "received", label: "Received", color: "text-blue-600", recruiterCanSet: true },
    { value: "shortlisted", label: "Shortlisted", color: "text-green-600", recruiterCanSet: true },
    { value: "rejected", label: "Rejected", color: "text-red-600", recruiterCanSet: true },
    { value: "withdrawn", label: "Withdrawn", color: "text-gray-600", recruiterCanSet: false },
];

export default function StatusDropdown({
    applicationId,
    currentStatus,
    onStatusChange,
}: StatusDropdownProps) {
    const [status, setStatus] = useState<ApplicationStatus>(currentStatus);
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const currentOption = STATUS_OPTIONS.find((opt) => opt.value === status) || STATUS_OPTIONS[0];

    const handleStatusChange = async (newStatus: ApplicationStatus) => {
        if (newStatus === status || isUpdating) return;

        setIsUpdating(true);
        setIsOpen(false);

        try {
            const result = await updateApplicantStatus(applicationId, newStatus);

            if (!result.success) {
                throw new Error(result.error || "Failed to update status");
            }

            setStatus(newStatus);

            // Call the callback if provided
            if (onStatusChange) {
                onStatusChange(newStatus);
            }

            // Show success toast (optional - you can add a toast library)
            console.log("Status updated successfully:", result);
        } catch (error) {
            console.error("Error updating status:", error);
            // Revert status on error
            alert("Failed to update application status. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const isWithdrawn = status === "withdrawn";

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={() => !isWithdrawn && setIsOpen(!isOpen)}
                disabled={isUpdating || isWithdrawn}
                className={`flex items-center gap-2 px-3 py-1.5 font-medium text-sm capitalize transition ${currentOption.color
                    } ${isUpdating || isWithdrawn ? "opacity-50 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}
            >
                {isUpdating ? "Updating..." : currentOption.label}
                <ChevronDown className={`text-gray-600 w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {STATUS_OPTIONS.filter(opt => opt.recruiterCanSet !== false || opt.value === status).map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleStatusChange(option.value)}
                            disabled={option.recruiterCanSet === false}
                            className={`w-full text-left px-4 py-2 text-sm capitalize transition ${option.value === status
                                ? "bg-gray-50 text-gray-800 font-semibold"
                                : option.recruiterCanSet === false
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "hover:bg-gray-50 hover:text-gray-800 text-gray-700"
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
