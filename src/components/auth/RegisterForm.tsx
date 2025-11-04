"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types";
import { registerAction } from "@/app/actions/user.actions";

export default function RegisterForm({ role }: { role: UserRole }) {
    const [isPending, startTransition] = useTransition();
    const ringClass = role === "jobseeker" ? "focus:ring-primary" : "focus:ring-secondary";
    const linkClass = role === "jobseeker" ? "text-primary" : "text-secondary";

    const onSubmit = (formData: FormData) => {
        formData.set("role", role);

        startTransition(async () => {
            const { errorMessage } = await registerAction(formData);
            if (errorMessage) {
                toast.error(errorMessage);
            }
            // Note: registerAction will redirect to verification page on success
            // No need to show success toast or manual redirect here
        });
    };

    return (
        <form action={onSubmit} className="space-y-4">
            <input type="hidden" name="role" value={role} />

            <label className="block">
                <span className="mb-1 block text-sm text-neutral-700">Email</span>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="you@example.com"
                        disabled={isPending}
                        className={`w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 ${ringClass}`}
                    />
                </div>
            </label>

            <label className="block">
                <span className="mb-1 block text-sm text-neutral-700">Password</span>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        disabled={isPending}
                        className={`w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 ${ringClass}`}
                    />
                </div>
            </label>

            <label className="block">
                <span className="mb-1 block text-sm text-neutral-700">Confirm Password</span>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                        type="password"
                        name="confirmPassword"
                        required
                        placeholder="••••••••"
                        disabled={isPending}
                        className={`w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 ${ringClass}`}
                    />
                </div>
            </label>

            <button
                disabled={isPending}
                className="w-full rounded-lg bg-neutral-900 text-white py-2.5 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
            </button>

            <div className="text-center text-sm text-neutral-600">
                Already have an account?{" "}
                <Link href={`/auth/${role}/login`} className={`${linkClass} hover:underline`}>
                    Login
                </Link>
            </div>
        </form>
    );
}
