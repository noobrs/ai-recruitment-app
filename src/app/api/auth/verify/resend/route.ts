import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/auth/verify/resend
 * 
 * Resends verification email to the user
 * Accepts: { email: string, role: string } as JSON or FormData
 * Returns: { ok: boolean, message?: string }
 */
export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type');
        let email: string;

        // Support both JSON and FormData
        if (contentType?.includes('application/json')) {
            const body = await req.json();
            email = String(body.email ?? '');
        } else {
            const form = await req.formData();
            email = String(form.get('email') ?? '');
        }

        // Validate inputs
        if (!email) {
            return NextResponse.json(
                { ok: false, message: 'Email is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${origin}/api/auth/callback?next=/auth/onboarding`,
            },
        });

        if (error) {
            console.error('Resend verification error:', error);
            return NextResponse.json(
                { ok: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            ok: true,
            message: 'Verification email sent successfully',
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json(
            { ok: false, message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
