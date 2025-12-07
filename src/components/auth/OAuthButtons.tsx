"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
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
        <>
            {/* Overlay to freeze the page */}
            {isPending && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
                        <p className="text-sm text-neutral-600">Redirecting to Google...</p>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <button
                    type="button"
                    onClick={signInGoogle}
                    disabled={isPending}
                    className="w-full rounded-lg border border-neutral-200 bg-white/80 py-2.5 font-medium flex items-center justify-center gap-2 hover:bg-white disabled:opacity-70"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <FcGoogle className="h-5 w-5" />
                            Continue with Google
                        </>
                    )}
                </button>
            </div>
        </>
    );
}
