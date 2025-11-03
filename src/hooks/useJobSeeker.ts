"use client";

import { JobSeekerProfile } from "@/types";
import { useEffect, useState, useCallback } from "react";

export interface UseJobSeekerReturn {
    jobSeeker: JobSeekerProfile | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch current job seeker profile from client-side
 * 
 * Retrieves the authenticated user with their job seeker profile data.
 * Returns null if user is not authenticated or not a job seeker.
 * 
 * @example
 * ```tsx
 * function JobSeekerDashboard() {
 *   const { jobSeeker, loading, error } = useJobSeeker();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!jobSeeker) return <div>Not authenticated</div>;
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {jobSeeker.first_name}!</h1>
 *       <p>Location: {jobSeeker.job_seeker?.location}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useJobSeeker(): UseJobSeekerReturn {
    const [jobSeeker, setJobSeeker] = useState<JobSeekerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchJobSeeker = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch("/api/auth/jobseeker");

            if (!res.ok) {
                if (res.status === 401) {
                    // Not authenticated or not a job seeker - this is expected
                    setJobSeeker(null);
                    return;
                }
                throw new Error("Failed to fetch job seeker profile");
            }

            const data = await res.json();
            setJobSeeker(data.jobSeeker);
        } catch (err: unknown) {
            console.error("Error fetching job seeker:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
            setJobSeeker(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobSeeker();
    }, [fetchJobSeeker]);

    return {
        jobSeeker,
        loading,
        error,
        isAuthenticated: !!jobSeeker,
        refresh: fetchJobSeeker,
    };
}
