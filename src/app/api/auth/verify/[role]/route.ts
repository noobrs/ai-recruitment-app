import { NextResponse } from 'next/server';
import { isValidRole } from '@/utils/utils';
import type { UserRole } from '@/types';

/**
 * GET /api/auth/verify/[role]?email=user@example.com
 * 
 * Redirects to the verification page with validated role and email
 * This API route serves as a cleaner entry point for the verification flow
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ role: string }> }
) {
    try {
        const { role: rawRole } = await params;
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        // Validate role
        const role: UserRole = isValidRole(rawRole) ? (rawRole as UserRole) : 'jobseeker';

        // Require email parameter
        if (!email) {
            return NextResponse.redirect(
                new URL(`/auth/${role}/register`, request.url)
            );
        }

        // Redirect to the verification page with validated parameters
        return NextResponse.redirect(
            new URL(`/auth/verify/${role}?email=${encodeURIComponent(email)}`, request.url)
        );
    } catch (error) {
        console.error('Verification route error:', error);
        return NextResponse.redirect(
            new URL('/auth/jobseeker/register', request.url)
        );
    }
}
