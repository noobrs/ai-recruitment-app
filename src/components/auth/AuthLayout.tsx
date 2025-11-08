"use client";

import { PropsWithChildren, useMemo } from "react";
import type { UserRole } from "@/types";
import { Briefcase, UserRound, LogIn } from "lucide-react";

export default function AuthLayout({
    children,
    role,
}: PropsWithChildren<{ role?: UserRole }>) {
    const label = role === "recruiter" ? "Recruiter" : role === "jobseeker" ? "Job Seeker" : "Welcome";
    const Icon = useMemo(() => {
        if (role === "recruiter") return Briefcase;
        if (role === "jobseeker") return UserRound;
        return LogIn;
    }, [role]);
    const accentText = role === "jobseeker" ? "text-primary" : role === "recruiter" ? "text-secondary" : "text-neutral-900";

    return (
        <div data-role={role || "auth"} className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {role && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Icon className={`h-6 w-6 ${accentText}`} aria-hidden />
                        <span className={`text-sm uppercase tracking-widest font-semibold ${accentText}`}>
                            {label} Portal
                        </span>
                    </div>
                )}
                {children}
                <p className="text-center text-xs text-neutral-500 mt-6">
                    By continuing you agree to our Terms & Privacy.
                </p>
            </div>
        </div>
    );
}
