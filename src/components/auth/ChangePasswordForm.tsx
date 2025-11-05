"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Check, X, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { changePasswordAction } from "@/app/actions/user.actions";

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

type Props = {
    onSuccess?: () => void;
    onCancel?: () => void;
};

export default function ChangePasswordForm({ onSuccess, onCancel }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showStrength, setShowStrength] = useState(false);

    const passwordChecks = validatePasswordStrength(newPassword);
    const isPasswordStrong = Object.values(passwordChecks).filter(Boolean).length >= 4;

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!currentPassword) {
            toast.error("Current password is required");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
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

        if (currentPassword === newPassword) {
            toast.error("New password must be different from current password");
            return;
        }

        const formData = new FormData();
        formData.set("currentPassword", currentPassword);
        formData.set("newPassword", newPassword);

        startTransition(async () => {
            const { errorMessage } = await changePasswordAction(formData);
            if (errorMessage) {
                toast.error(errorMessage);
            } else {
                toast.success("Password changed successfully! Redirecting to login...");
                // Call success callback if provided
                if (onSuccess) {
                    onSuccess();
                }
                // Small delay to show success message
                setTimeout(() => {
                    router.push("/auth/login?message=password_changed");
                    router.refresh(); // Refresh to clear auth state
                }, 1500);
            }
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
                <span className="mb-1 block text-sm text-neutral-700">Current Password</span>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        disabled={isPending}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-10 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                        tabIndex={-1}
                    >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </label>

            <label className="block">
                <span className="mb-1 block text-sm text-neutral-700">New Password</span>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            setShowStrength(e.target.value.length > 0);
                        }}
                        required
                        placeholder="••••••••"
                        disabled={isPending}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-10 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                        tabIndex={-1}
                    >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>

                {/* Password strength indicator */}
                {showStrength && newPassword.length > 0 && (
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
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        disabled={isPending}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-10 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                        tabIndex={-1}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Passwords do not match
                    </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Passwords match
                    </p>
                )}
            </label>

            <div className="flex gap-3 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isPending}
                        className="flex-1 rounded-lg bg-neutral-100 text-neutral-700 py-2.5 font-medium hover:bg-neutral-200 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isPending || !isPasswordStrong || newPassword !== confirmPassword || !currentPassword}
                    className="flex-1 rounded-lg bg-neutral-900 text-white py-2.5 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Password"}
                </button>
            </div>
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
