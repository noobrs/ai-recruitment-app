'use client';

import { Job } from '@/types';

interface MyJobsCardProps {
    loading: boolean;
    jobs: Job[];
    onViewJob: (jobId: number) => void;
}

/**
 * MyJobsCard Component
 * 
 * Displays list of jobs posted by the recruiter.
 */
export default function MyJobsCard({ loading, jobs, onViewJob }: MyJobsCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    My Posted Jobs
                </h2>
                <span className="text-sm text-gray-500">
                    {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                </span>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-md animate-pulse">
                            <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mb-4">You haven&apos;t posted any jobs yet</p>
                    <button
                        onClick={() => window.location.href = '/recruiter/jobs/create'}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Post Your First Job
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {jobs.map((job) => (
                        <div
                            key={job.job_id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:border-indigo-300 hover:shadow-sm transition-all"
                        >
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{job.job_title}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {job.job_location || 'Remote'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.job_status === 'open'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {job.job_status || 'draft'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => onViewJob(job.job_id)}
                                className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
