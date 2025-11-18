import Image from 'next/image';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { JobDetails } from '@/types/job.types';


interface JobHeaderProps {
    job: JobDetails;
    showBackButton?: boolean;
    onBack?: () => void;
}

/**
 * JobHeader - Displays job information header with company details
 */
export default function JobHeader({
    job,
    showBackButton = true,
    onBack
}: JobHeaderProps) {
    return (
        <>
            {showBackButton && onBack && (
                <button
                    onClick={onBack}
                    className="flex items-center text-gray-500 hover:text-black transition mb-6"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-1" />
                    Back
                </button>
            )}

            <div className="flex flex-row items-center mb-4">
                <div className="relative w-8 h-8 mr-2">
                    <Image
                        src={job.company?.comp_logo_path || '/default-company.png'}
                        alt={job.company?.comp_name || 'Company logo'}
                        fill
                        className="object-contain"
                    />
                </div>
                <p className="text-lg text-gray-500">{job.company?.comp_name}</p>
            </div>

            <h1 className="text-4xl font-bold mb-2">{job.job_title}</h1>

            <p className="text-gray-500 font-bold text-sm mb-6">
                {job.job_location} ({job.job_type})
            </p>

            <div className="w-full h-px bg-gray-200 mb-8"></div>
        </>
    );
}
