"use client";

import { AuthUser } from "@/types";
import { useEffect, useState, useCallback } from "react";

export interface UseAuthReturn {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    isJobSeeker: boolean;
    isRecruiter: boolean;
    refresh: () => Promise<void>;
}

/**
 * Enhanced authentication hook for client-side components
 * 
 * Provides comprehensive auth state management with:
 * - User data from database (role, status, profile info)
 * - Authentication status
 * - Role checks (jobseeker/recruiter)
 * - Manual refresh capability
 * - Error handling
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, isJobSeeker, loading } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please log in</div>;
 *   
 *   return <div>Welcome, {user.first_name}!</div>;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch("/api/auth/getuser");

            if (!res.ok) {
                if (res.status === 401) {
                    // User is not authenticated - this is normal, not an error
                    setUser(null);
                    return;
                }
                throw new Error("Failed to fetch user");
            }

            const data = await res.json();
            setUser(data.user);
        } catch (err: unknown) {
            console.error("Error fetching user:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isJobSeeker: user?.role === 'jobseeker',
        isRecruiter: user?.role === 'recruiter',
        refresh: fetchUser,
    };
}
