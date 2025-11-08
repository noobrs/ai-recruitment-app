"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { changePasswordAction } from "@/app/actions/user.actions";
import PasswordInput from "@/components/shared/PasswordInput";
import PasswordRequirements, { validatePasswordStrength, isPasswordStrong } from "@/components/shared/PasswordRequirements";

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

    const passwordChecks = validatePasswordStrength(newPassword);
    const passwordStrong = isPasswordStrong(passwordChecks);

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

        if (!passwordStrong) {
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
            <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isPending}
            />

            <div>
                <PasswordInput
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    disabled={isPending}
                />
                <PasswordRequirements password={newPassword} checks={passwordChecks} />
            </div>

            <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isPending}
                error={confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : undefined}
                success={confirmPassword && newPassword === confirmPassword ? "Passwords match" : undefined}
            />

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
                    disabled={isPending || !passwordStrong || newPassword !== confirmPassword || !currentPassword}
                    className="flex-1 rounded-lg bg-neutral-900 text-white py-2.5 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Password"}
                </button>
            </div>
        </form>
    );
}
