import { redirect } from 'next/navigation';
import { isValidRole } from '@/utils/utils';
import type { UserRole } from '@/types';
import VerifyEmailContent from '@/components/auth/VerifyEmailContent';
import { createClient } from '@/utils/supabase/server';

export default async function VerifyEmailPage({
    params,
    searchParams,
}: {
    params: Promise<{ role: string }>;
    searchParams: Promise<{ email?: string, userId: string }>;
}) {
    const { role: rawRole } = await params;
    const { email } = await searchParams;

    // Validate role
    const role: UserRole = isValidRole(rawRole) ? rawRole : 'jobseeker';

    // Require email parameter first
    if (!email) {
        redirect(`/auth/${role}/register`);
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    console.log("Current user in VerifyEmailPage:", user);

    // If user is signed in and email is already confirmed, redirect to dashboard
    if (user?.confirmed_at) {
        redirect(`/${role}/dashboard`);
    }

    return <VerifyEmailContent email={email} role={role} />;
}
