"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { resetPasswordAction } from "@/app/actions/user.actions";

// Password strength validation
const validatePasswordStrength = (password: string) => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return checks;
};

export default function ResetPasswordForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showStrength, setShowStrength] = useState(false);

    const passwordChecks = validatePasswordStrength(password);
    const isPasswordStrong = Object.values(passwordChecks).filter(Boolean).length >= 4;

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

        if (!isPasswordStrong) {
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
            <label className="block">
                <span className="mb-1 block text-sm text-neutral-700">New Password</span>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setShowStrength(e.target.value.length > 0);
                        }}
                        required
                        placeholder="••••••••"
                        disabled={isPending}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                </div>
                
                {/* Password strength indicator */}
                {showStrength && password.length > 0 && (
                    <div className="mt-2 p-3 bg-neutral-50 rounded-lg text-xs space-y-1">
                        <p className="font-medium text-neutral-700 mb-2">Password requirements:</p>
                        <PasswordRequirement met={passwordChecks.length} text="At least 8 characters" />
                        <PasswordRequirement met={passwordChecks.uppercase} text="Contains uppercase letter" />
                        <PasswordRequirement met={passwordChecks.lowercase} text="Contains lowercase letter" />
                        <PasswordRequirement met={passwordChecks.number} text="Contains number" />
                        <PasswordRequirement met={passwordChecks.special} text="Contains special character" />
                        <p className="text-neutral-500 mt-2 pt-2 border-t border-neutral-200">
                            {isPasswordStrong ? "✓ Strong password" : "Meet at least 4 requirements"}
                        </p>
                    </div>
                )}
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
                {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Passwords do not match
                    </p>
                )}
                {confirmPassword && password === confirmPassword && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Passwords match
                    </p>
                )}
            </label>

            <button
                type="submit"
                disabled={isPending || !isPasswordStrong || password !== confirmPassword}
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

// Helper component for password requirements
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-2 ${met ? 'text-green-600' : 'text-neutral-400'}`}>
            {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            <span>{text}</span>
        </div>
    );
}
