"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthListener() {
    const router = useRouter();
    const isRefreshing = useRef(false);

    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            // Only refresh on meaningful auth changes, not on every token refresh
            // Prevent infinite loops by tracking if we're already refreshing
            const shouldRefresh = [
                'SIGNED_IN',
                'SIGNED_OUT',
                'USER_UPDATED',
                'PASSWORD_RECOVERY'
            ].includes(event);

            if (shouldRefresh && !isRefreshing.current) {
                isRefreshing.current = true;
                router.refresh();

                // Reset the flag after a short delay
                setTimeout(() => {
                    isRefreshing.current = false;
                }, 1000);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return null;
}
