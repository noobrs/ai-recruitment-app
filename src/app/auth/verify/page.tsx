import { redirect } from 'next/navigation';
import VerifyEmailContent from '@/components/auth/VerifyEmailContent';
import { createClient } from '@/utils/supabase/server';

export default async function VerifyPage({
    searchParams
}: {
    searchParams: Promise<{ email?: string }>
}) {
    const params = await searchParams;
    const email = params.email ?? '';

    // Require email parameter
    if (!email) {
        redirect('/auth/register');
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // If user is signed in and email is already confirmed, redirect to onboarding
    if (user?.confirmed_at) {
        redirect('/auth/onboarding');
    }

    return <VerifyEmailContent email={email} />;
}
