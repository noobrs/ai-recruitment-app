'use client';

import { useRouter } from 'next/navigation';

export default function BrowseJobsAction() {
    const router = useRouter();

    const handleBrowse = () => {
        router.push('/jobseeker/job'); // or your actual browse jobs route
    };

    return (
        <button
            onClick={handleBrowse}
            className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
        >
            <span className="text-sm font-medium">Browse Jobs</span>
        </button>
    );
}
