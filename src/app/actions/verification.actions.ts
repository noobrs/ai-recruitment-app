"use server";

import { createClient } from "@/utils/supabase/server";
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
                emailRedirectTo: `${origin}/auth/callback?role=${role}&next=/${role}/dashboard`,
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
        const supabase = await createClient();

        // Check user status in public.users database
        const { data: userData } = await supabase
            .from('users')
            .select('id, status')
            .eq('id', userId)
            .maybeSingle();

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
