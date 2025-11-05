"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { forgotPasswordAction } from "@/app/actions/user.actions";

export default function ForgotPasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [emailSent, setEmailSent] = useState(false);
    const [email, setEmail] = useState("");

    const onSubmit = (formData: FormData) => {
        const emailValue = String(formData.get("email") ?? "");
        setEmail(emailValue);

        startTransition(async () => {
            const { errorMessage } = await forgotPasswordAction(formData);
            if (errorMessage) {
                toast.error(errorMessage);
            } else {
                setEmailSent(true);
                toast.success("Password reset email sent!");
            }
        });
    };

    if (emailSent) {
        return (
            <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">
                        We&apos;ve sent a password reset link to <strong>{email}</strong>
                    </p>
                    <p className="text-green-700 text-xs mt-2">
                        Please check your inbox and follow the instructions to reset your password.
                    </p>
                </div>

                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>
            </div>
        );
    }

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

            <button
                disabled={isPending}
                className="w-full rounded-lg bg-neutral-900 text-white py-2.5 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </button>

            <div className="text-center">
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>
            </div>
        </form>
    );
}
