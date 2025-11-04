"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthListener() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            // Any auth change: force an RSC re-render of Header
            // Covers: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY, etc.
            router.refresh();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return null;
}
