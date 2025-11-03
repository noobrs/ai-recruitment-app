"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { BaseUser } from "@/types";

export function useGetUser() {
    const supabase = useMemo(() => createClient(), []);
    const [user, setUser] = useState<BaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMergedUser = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/getuser", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch user");
            const data = await res.json();
            setUser(data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const { data } = await supabase.auth.getSession();
            if (cancelled) return;
            if (data.session?.user) {
                await fetchMergedUser();
            } else {
                setUser(null);
                setLoading(false);
            }
        })();

        // Auth state change subscription
        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // When session changes, refresh merged user or clear
            if (session?.user) {
                await fetchMergedUser();
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
            sub.subscription?.unsubscribe();
        };
    }, [supabase, fetchMergedUser]);

    const isAuthenticated = !!user;
    const role = user?.role as "jobseeker" | "recruiter" | undefined;
    const isJobSeeker = role === "jobseeker";
    const isRecruiter = role === "recruiter";

    return { user, loading, isAuthenticated, isJobSeeker, isRecruiter };
}
