"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { registerAction } from "@/app/actions/user.actions";
import PasswordInput from "@/components/shared/PasswordInput";
import PasswordRequirements, { validatePasswordStrength, isPasswordStrong } from "@/components/shared/PasswordRequirements";

export default function RegisterForm() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const passwordChecks = validatePasswordStrength(password);
    const passwordStrong = isPasswordStrong(passwordChecks);

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!passwordChecks.length) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        if (!passwordStrong) {
            toast.error("Password must meet at least 4 of the security requirements");
            return;
        }

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const response = await registerAction(formData);

            if (response?.redirectTo) router.push(response.redirectTo);

            if (response.errorMessage) {
                toast.error(response.errorMessage);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
            }
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                </div>
            </label>

            <div>
                <PasswordInput
                    label="Password"
                    name="password"
                    required
                    placeholder="••••••••"
                    disabled={isPending}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordRequirements password={password} checks={passwordChecks} />
            </div>

            <PasswordInput
                label="Confirm Password"
                name="confirmPassword"
                required
                placeholder="••••••••"
                disabled={isPending}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : undefined}
                success={confirmPassword && password === confirmPassword ? "Passwords match" : undefined}
            />

            <button
                type="submit"
                disabled={isPending || !email || !password || !confirmPassword || !passwordStrong || password !== confirmPassword}
                className="w-full rounded-lg bg-neutral-900 text-white py-2.5 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
            </button>

            <div className="text-center text-sm text-neutral-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-neutral-900 hover:underline font-medium">
                    Login
                </Link>
            </div>
        </form>
    );
}
