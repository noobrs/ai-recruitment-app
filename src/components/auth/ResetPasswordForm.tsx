"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { resetPasswordAction } from "@/app/actions/user.actions";
import PasswordInput from "@/components/shared/PasswordInput";
import PasswordRequirements, { validatePasswordStrength, isPasswordStrong } from "@/components/shared/PasswordRequirements";

export default function ResetPasswordForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
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

        const formData = new FormData();
        formData.set("password", password);

        startTransition(async () => {
            const { errorMessage } = await resetPasswordAction(formData);
            if (errorMessage) {
                if (errorMessage.includes("same")) {
                    toast.error("New password must be different from your previous password");
                } else {
                    toast.error(errorMessage);
                }
            } else {
                toast.success("Password reset successful! Redirecting to login...");
                // Small delay to show success message
                setTimeout(() => {
                    router.push("/auth/login?message=password_reset_success");
                    router.refresh(); // Refresh to clear cookies
                }, 1500);
            }
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <PasswordInput
                    label="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    disabled={isPending}
                />
                <PasswordRequirements password={password} checks={passwordChecks} />
            </div>

            <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isPending}
                error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : undefined}
                success={confirmPassword && password === confirmPassword ? "Passwords match" : undefined}
            />

            <button
                type="submit"
                disabled={isPending || !passwordStrong || password !== confirmPassword}
                className="w-full rounded-lg bg-neutral-900 text-white py-2.5 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
            </button>
            
            <p className="text-xs text-neutral-500 text-center">
                After resetting your password, you will be signed out and must log in with your new password.
            </p>
        </form>
    );
}
