"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { resetPasswordAction } from "@/app/actions/user.actions";

export default function ResetPasswordForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        const formData = new FormData();
        formData.set("password", password);

        startTransition(async () => {
            const { errorMessage } = await resetPasswordAction(formData);
            if (errorMessage) {
                toast.error(errorMessage);
            } else {
                toast.success("Password reset successful!");
                router.push("/auth/login");
            }
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
                <span className="mb-1 block text-sm text-neutral-700">New Password</span>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        disabled={isPending}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                </div>
            </label>

            <label className="block">
                <span className="mb-1 block text-sm text-neutral-700">Confirm New Password</span>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        disabled={isPending}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                </div>
            </label>

            <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-neutral-900 text-white py-2.5 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
            </button>
        </form>
    );
}
