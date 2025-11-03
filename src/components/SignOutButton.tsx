"use client";

import { signOutAction } from "@/app/actions/user.actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import toast from "react-hot-toast";

function SignOutButton() {
    const router = useRouter();

    const [isPending, startTransition] = useTransition();

    const handleClickSignOutButton = () => {
        startTransition(async () => {
            const { errorMessage } = await signOutAction();
            if (errorMessage) {
                toast.error(errorMessage);
            } else {
                toast.success("Successfully signed out");
                // Force a router refresh to update all client components
                router.refresh();
                router.push("/");
            }
        });
    };

    return (
        <button onClick={handleClickSignOutButton} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isPending ? <Loader2 className="animate-spin" /> : "Sign Out"}
        </button>
    );
}

export default SignOutButton;
