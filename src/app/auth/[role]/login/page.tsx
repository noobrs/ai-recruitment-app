import { redirect } from 'next/navigation';

// Redirect old role-based login to new unified login
export default async function Page() {
    redirect('/auth/login');
}
