"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { loginAction } from "@/app/actions/user.actions";

export default function LoginForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onSubmit = (formData: FormData) => {
        startTransition(async () => {
            const { errorMessage } = await loginAction(formData);
            if (errorMessage) {
                toast.error(errorMessage);
            } else {
                toast.success("Successfully logged in");
                router.push("/");
                router.refresh();
            }
        });
    };

    return (
        <form action={onSubmit} className="space-y-4">
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
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
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
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                </div>
            </label>

            <div className="flex items-center justify-end">
                <Link
                    href="/auth/forgot-password"
                    className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
                >
                    Forgot password?
                </Link>
            </div>

            <button
                disabled={isPending}
                className="w-full rounded-lg bg-neutral-900 text-white py-2.5 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
            </button>

            <div className="text-center text-sm text-neutral-600">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-neutral-900 hover:underline font-medium">
                    Create Account
                </Link>
            </div>
        </form>
    );
}
