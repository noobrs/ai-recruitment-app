import { redirect } from 'next/navigation';

// Redirect old role-based register to new unified register
export default async function Page() {
    redirect('/auth/register');
}
