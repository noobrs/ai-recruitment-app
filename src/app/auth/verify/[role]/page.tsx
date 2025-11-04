import { redirect } from 'next/navigation';
import { isValidRole } from '@/utils/utils';
import type { UserRole } from '@/types';
import VerifyEmailContent from '@/components/auth/VerifyEmailContent';

export default async function VerifyEmailPage({
    params,
    searchParams,
}: {
    params: Promise<{ role: string }>;
    searchParams: Promise<{ email?: string, userId: string }>;
}) {
    const { role: rawRole } = await params;
    const { email, userId } = await searchParams;

    // Validate role
    const role: UserRole = isValidRole(rawRole) ? rawRole : 'jobseeker';

    // Require email parameter
    if (!email) {
        redirect(`/auth/${role}/register`);
    }

    return <VerifyEmailContent email={email} role={role} userId={userId} />;
}
