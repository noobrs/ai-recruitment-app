import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/auth/verify/check
 * 
 * Checks if the current user's email is verified
 * Returns: { verified: boolean, user: User | null }
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                { verified: false, user: null },
                { status: 401 }
            );
        }

        // Check if email is confirmed
        const isVerified = !!user.email_confirmed_at;

        return NextResponse.json({
            verified: isVerified,
            user: {
                id: user.id,
                email: user.email,
                email_confirmed_at: user.email_confirmed_at,
            },
        });
    } catch (error) {
        console.error('Verification check error:', error);
        return NextResponse.json(
            { verified: false, user: null, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
