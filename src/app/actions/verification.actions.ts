"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserStatus } from "@/services/user.service";
import type { UserRole } from "@/types";

/**
 * Resend verification email action
 * Edge cases handled:
 * - Invalid email format
 * - Email not found
 * - Already verified users
 * - Rate limiting (handled by Supabase)
 */
export async function resendVerificationAction(email: string, role: UserRole) {
    try {
        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                error: "Invalid email format"
            };
        }

        const supabase = await createClient();
        const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

        // Resend verification email
        // Note: Supabase will handle checking if user exists and their verification status
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${origin}/api/auth/callback?role=${role}&next=/${role}/dashboard`,
            },
        });

        if (error) {
            // Handle rate limiting
            if (error.message.includes('rate limit') || error.message.includes('too many')) {
                return {
                    success: false,
                    error: "Please wait a moment before requesting another email"
                };
            }

            // Handle already verified
            if (error.message.includes('already confirmed') || error.message.includes('verified')) {
                return {
                    success: false,
                    error: "This email is already verified. Please login."
                };
            }

            // Handle user not found
            if (error.message.includes('not found') || error.message.includes("doesn't exist")) {
                return {
                    success: false,
                    error: "No account found with this email"
                };
            }

            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            error: null
        };

    } catch (error) {
        console.error('Resend verification error:', error);
        return {
            success: false,
            error: "An unexpected error occurred. Please try again."
        };
    }
}

/**
 * Check verification status action
 * Used by the verification page to check if user has verified their email
 * Note: Email is stored in auth.users, not public.users
 */
export async function checkVerificationStatusAction(userId: string) {
    try {
        // Check user status in public.users database using service
        const userData = await getUserStatus(userId);

        if (!userData) {
            return {
                verified: false,
                status: null
            };
        }

        return {
            verified: userData.status === 'active',
            status: userData.status
        };

    } catch (error) {
        console.error('Check verification status error:', error);
        return {
            verified: false,
            status: null
        };
    }
}
