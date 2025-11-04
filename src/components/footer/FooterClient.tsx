'use client';

import { usePathname } from 'next/navigation';

export default function FooterClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Hide footer on auth pages
    if (pathname?.startsWith('/auth')) {
        return null;
    }

    return <>{children}</>;
}
