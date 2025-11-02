"use client";

import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export function useGetUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/getuser");
                if (!res.ok) throw new Error("Unauthorized or server error");
                const data = await res.json();
                setUser(data.user);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, []);

    return { user, loading, error };
}
