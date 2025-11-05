"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { googleSignInAction } from "@/app/actions/user.actions";

export default function OAuthButtons() {
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();

    const signInGoogle = () => {
        startTransition(async () => {
            const result = await googleSignInAction();
            if (result?.url) window.location.href = result.url;
            else if (result?.error) console.error("Google sign-in error:", result.error);
        });
    };

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={signInGoogle}
                disabled={isPending}
                className="w-full rounded-lg border border-neutral-200 bg-white/80 py-2.5 font-medium flex items-center justify-center gap-2 hover:bg-white disabled:opacity-70"
            >
                <FcGoogle className="h-5 w-5" />
                Continue with Google
            </button>
        </div>
    );
}
