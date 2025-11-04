import { redirect } from 'next/navigation';

export default async function VerifyPage({
    searchParams
}: {
    searchParams: Promise<{ email?: string; role?: string }>
}) {
    const params = await searchParams;
    const email = params.email ?? '';
    const role = params.role ?? 'jobseeker';

    // Redirect to new role-based verification page
    if (email) {
        redirect(`/auth/verify/${role}?email=${encodeURIComponent(email)}`);
    }

    // No email provided, redirect to register
    redirect(`/auth/${role}/register`);
}
