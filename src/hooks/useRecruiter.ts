"use client";

import { User, Recruiter } from "@/types";
import { useEffect, useState, useCallback } from "react";

export interface RecruiterProfile extends User {
    recruiter: Recruiter | null;
}

export interface UseRecruiterReturn {
    recruiter: RecruiterProfile | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch current recruiter profile from client-side
 * 
 * Retrieves the authenticated user with their recruiter profile data (including company).
 * Returns null if user is not authenticated or not a recruiter.
 * 
 * @example
 * ```tsx
 * function RecruiterDashboard() {
 *   const { recruiter, loading, error } = useRecruiter();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!recruiter) return <div>Not authenticated</div>;
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {recruiter.first_name}!</h1>
 *       <p>Company: {recruiter.recruiter?.company?.name}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRecruiter(): UseRecruiterReturn {
    const [recruiter, setRecruiter] = useState<RecruiterProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRecruiter = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch("/api/auth/recruiter");

            if (!res.ok) {
                if (res.status === 401) {
                    // Not authenticated or not a recruiter - this is expected
                    setRecruiter(null);
                    return;
                }
                throw new Error("Failed to fetch recruiter profile");
            }

            const data = await res.json();
            setRecruiter(data.recruiter);
        } catch (err: unknown) {
            console.error("Error fetching recruiter:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
            setRecruiter(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecruiter();
    }, [fetchRecruiter]);

    return {
        recruiter,
        loading,
        error,
        isAuthenticated: !!recruiter,
        refresh: fetchRecruiter,
    };
}
