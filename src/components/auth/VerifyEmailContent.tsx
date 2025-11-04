"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Mail, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types";

interface VerifyEmailContentProps {
    email: string;
    role: UserRole;
}

export default function VerifyEmailContent({ email, role }: VerifyEmailContentProps) {
    const router = useRouter();
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });
    const [countdown, setCountdown] = useState(0);
    const [isVerified, setIsVerified] = useState(false);

    // Handle resend verification email
    const handleResend = useCallback(async () => {
        if (countdown > 0 || isResending) return;

        setIsResending(true);
        setResendStatus({ type: null, message: "" });

        try {
            const supabase = createClient();
            const origin = window.location.origin;

            const { error } = await supabase.auth.resend({
                type: "signup",
                email,
                options: {
                    emailRedirectTo: `${origin}/auth/callback?role=${role}&next=/${role}/dashboard`,
                },
            });

            if (error) {
                setResendStatus({
                    type: "error",
                    message: error.message || "Failed to resend verification email",
                });
            } else {
                setResendStatus({
                    type: "success",
                    message: "Verification email sent! Please check your inbox.",
                });
                setCountdown(60); // 60 second cooldown
            }
        } catch {
            setResendStatus({
                type: "error",
                message: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setIsResending(false);
        }
    }, [email, role, countdown, isResending]);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Subscribe to realtime changes for email verification
    useEffect(() => {
        const supabase = createClient();
        let authCheckInterval: NodeJS.Timeout | null = null;

        const setupRealtimeSubscription = async () => {
            try {
                // Get current user to check if already verified
                const { data: { user } } = await supabase.auth.getUser();

                if (user?.email_confirmed_at) {
                    setIsVerified(true);
                    // Small delay to show success state
                    setTimeout(() => {
                        router.push(`/${role}/dashboard`);
                        router.refresh();
                    }, 1500);
                    return;
                }

                // Set up periodic auth check (fallback for missed realtime events)
                authCheckInterval = setInterval(async () => {
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    if (currentUser?.email_confirmed_at) {
                        setIsVerified(true);
                        if (authCheckInterval) clearInterval(authCheckInterval);
                        setTimeout(() => {
                            router.push(`/${role}/dashboard`);
                            router.refresh();
                        }, 1500);
                    }
                }, 3000); // Check every 3 seconds

                // Subscribe to auth state changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    async (event, session) => {
                        if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
                            setIsVerified(true);
                            if (authCheckInterval) clearInterval(authCheckInterval);
                            // Redirect to onboarding/dashboard
                            setTimeout(() => {
                                router.push(`/${role}/dashboard`);
                                router.refresh();
                            }, 1500);
                        }
                    }
                );

                return () => {
                    subscription.unsubscribe();
                    if (authCheckInterval) clearInterval(authCheckInterval);
                };
            } catch (error) {
                console.error("Error setting up verification listener:", error);
            }
        };

        setupRealtimeSubscription();

        return () => {
            if (authCheckInterval) {
                clearInterval(authCheckInterval);
            }
        };
    }, [email, role, router]);

    if (isVerified) {
        return (
            <div className="mx-auto max-w-md space-y-6 text-center p-8">
                <div className="flex justify-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-neutral-900">Email Verified!</h1>
                    <p className="text-neutral-600">Redirecting you to your dashboard...</p>
                </div>
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-md space-y-6 p-8">
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="relative">
                        <Mail className="h-16 w-16 text-neutral-400" />
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full animate-ping" />
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-neutral-900">Check your email</h1>
                    <p className="text-neutral-600">
                        We sent a verification link to{" "}
                        <span className="font-medium text-neutral-900">{email}</span>
                    </p>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-blue-900 font-medium">What&apos;s next?</p>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Check your email inbox (and spam folder)</li>
                        <li>Click the verification link</li>
                        <li>You&apos;ll be automatically redirected</li>
                    </ol>
                </div>

                {resendStatus.type && (
                    <div
                        className={`rounded-lg p-4 flex items-start gap-3 ${resendStatus.type === "success"
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                    >
                        {resendStatus.type === "success" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <p
                            className={`text-sm ${resendStatus.type === "success" ? "text-green-800" : "text-red-800"
                                }`}
                        >
                            {resendStatus.message}
                        </p>
                    </div>
                )}

                <button
                    onClick={handleResend}
                    disabled={isResending || countdown > 0}
                    className="w-full rounded-lg bg-neutral-900 text-white py-3 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    {isResending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : countdown > 0 ? (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Resend in {countdown}s
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Resend verification email
                        </>
                    )}
                </button>

                <div className="text-center text-sm space-y-2">
                    <p className="text-neutral-600">Wrong email address?</p>
                    <Link
                        href={`/auth/${role}/register`}
                        className="text-neutral-900 hover:underline font-medium"
                    >
                        Go back to registration
                    </Link>
                </div>
            </div>

            <div className="pt-4 border-t border-neutral-200">
                <details className="text-sm text-neutral-600">
                    <summary className="cursor-pointer hover:text-neutral-900 font-medium">
                        Didn&apos;t receive the email?
                    </summary>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-neutral-600">
                        <li>Check your spam or junk folder</li>
                        <li>Make sure the email address is correct</li>
                        <li>Wait a few minutes and try resending</li>
                        <li>Add our email to your contacts</li>
                    </ul>
                </details>
            </div>
        </div>
    );
}
