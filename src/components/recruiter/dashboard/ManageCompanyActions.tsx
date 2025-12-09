'use client';

import { useRouter } from 'next/navigation';

export default function ManagePostActions() {
    const router = useRouter();

    const handleBrowse = () => {
        router.push('/recruiter/company');
    };

    return (
        <button
            onClick={handleBrowse}
            className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
            <span className="text-sm font-medium">Manage Company</span>
        </button>
    );
}
