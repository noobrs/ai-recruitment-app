"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { User } from "@/types";

export interface AuthUser extends User {
    email?: string;
}

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
 * Authentication Context Provider
 * 
 * Provides global authentication state management across the application.
 * Wraps the app and makes auth state available to all child components.
 * 
 * Features:
 * - Automatic auth state loading on mount
 * - Refreshes auth state on route changes (fixes header not updating after login)
 * - Global user state management
 * - Role-based helpers (isJobSeeker, isRecruiter)
 * - Manual refresh capability
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
    const pathname = usePathname(); // Track route changes

    const fetchUser = useCallback(async (isRefresh = false) => {
        try {
            // Only show loading state on initial load, not on refreshes
            if (isInitialLoad || isRefresh) {
                setLoading(true);
            }
            setError(null);

            const res = await fetch("/api/auth/getuser", {
                // Disable cache to ensure fresh data on route changes
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

    // Initial fetch on mount
    useEffect(() => {
        fetchUser(false);
    }, [fetchUser]);

    // Refresh auth state when route changes (e.g., after login redirect)
    // This fixes the bug where Header doesn't update after login
    useEffect(() => {
        if (!isInitialLoad) {
            // Only refresh after initial load to avoid double-fetching
            fetchUser(false);
        }
    }, [pathname, isInitialLoad, fetchUser]);

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
