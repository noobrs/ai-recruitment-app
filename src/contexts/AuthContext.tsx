"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AuthUser } from "@/types";

export interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    isJobSeeker: boolean;
    isRecruiter: boolean;
    refresh: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * Authentication Context Provider - Server-First Architecture with Smart Refresh
 * 
 * Provides cached authentication state for client components across the application.
 * Wraps the app and makes auth state available to all child components.
 * 
 * Architecture:
 * - Server Components: Use getCurrentJobSeeker() / getCurrentRecruiter() for auth
 * - Client Components: Use this AuthContext for cached user state
 * - Fetches auth state ONCE on mount, then caches for the session
 * - Smart refresh: Auto-refreshes when navigating FROM auth pages TO protected pages
 * - Server components handle fresh auth checks on each page navigation
 * 
 * Smart Refresh Logic:
 * - Refreshes when: coming from /auth/* → going to /dashboard or /profile
 * - Does NOT refresh: on regular page navigation (dashboard → profile)
 * - Result: Header updates immediately after login, no redundant fetches during normal navigation
 * 
 * Features:
 * - Automatic auth state loading on mount (once per session)
 * - Smart refresh after login/register/onboarding
 * - Global user state cache for client components
 * - Role-based helpers (isJobSeeker, isRecruiter)
 * - Manual refresh capability when needed
 * - Sign out functionality
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx or similar root component
 * import { AuthProvider } from '@/contexts/AuthContext';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const pathname = usePathname();
    const [previousPath, setPreviousPath] = useState<string | null>(null);

    const fetchUser = useCallback(async (isRefresh = false) => {
        try {
            // Only show loading state on initial load, not on refreshes
            if (isInitialLoad || isRefresh) {
                setLoading(true);
            }
            setError(null);

            const res = await fetch("/api/auth/getuser", {
                // Disable cache for manual refreshes to ensure fresh data
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 401) {
                    // User is not authenticated - this is normal
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
            setIsInitialLoad(false);
        }
    }, [isInitialLoad]);

    const handleSignOut = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/signout", { method: "POST" });

            if (res.ok) {
                setUser(null);
                // Redirect to home or login page
                window.location.href = "/";
            }
        } catch (err) {
            console.error("Error signing out:", err);
        }
    }, []);

    // Initial fetch on mount only
    // Server components handle auth for protected pages
    // This context serves as a cache for client components (Header, etc.)
    useEffect(() => {
        fetchUser(false);
    }, [fetchUser]);

    // Smart refresh: Only refresh when navigating AWAY FROM auth pages
    // This ensures Header updates after login/register/onboarding
    useEffect(() => {
        if (!isInitialLoad && previousPath && pathname !== previousPath) {
            // Check if we're coming from an auth page (login, register, onboarding, callback)
            const isComingFromAuth = previousPath.includes('/auth/');
            const isGoingToDashboard = pathname.includes('/dashboard') || pathname.includes('/profile');

            // Refresh auth state when leaving auth pages and going to protected pages
            if (isComingFromAuth && isGoingToDashboard) {
                fetchUser(false);
            }
        }

        setPreviousPath(pathname);
    }, [pathname, previousPath, isInitialLoad, fetchUser]);

    const value: AuthContextValue = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isJobSeeker: user?.role === 'jobseeker',
        isRecruiter: user?.role === 'recruiter',
        refresh: () => fetchUser(true),
        signOut: handleSignOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 * 
 * Must be used within an AuthProvider component.
 * Provides access to global auth state and methods.
 * 
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, isJobSeeker, signOut } = useAuthContext();
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {user.first_name}!</h1>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthContext(): AuthContextValue {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }

    return context;
}
