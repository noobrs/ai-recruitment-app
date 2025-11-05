import { redirect } from 'next/navigation';

// Redirect old role-based verify to new unified verify
export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ email?: string }>;
}) {
    const { email } = await searchParams;

    if (email) {
        redirect(`/auth/verify?email=${encodeURIComponent(email)}`);
    }

    redirect('/auth/verify');
}
