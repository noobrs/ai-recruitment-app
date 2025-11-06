'use client';

import { Company } from '@/types';

interface CompanyInfoCardProps {
    company: Company;
}

/**
 * CompanyInfoCard Component
 * 
 * Displays company information for the recruiter.
 */
export default function CompanyInfoCard({ company }: CompanyInfoCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Company Information
            </h2>

            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-gray-500">Company Name</label>
                    <p className="text-gray-900 font-medium">{company.comp_name}</p>
                </div>

                {company.comp_industry && (
                    <div>
                        <label className="text-sm font-medium text-gray-500">Industry</label>
                        <p className="text-gray-900">{company.comp_industry}</p>
                    </div>
                )}

                {company.comp_website && (
                    <div>
                        <label className="text-sm font-medium text-gray-500">Website</label>
                        <a
                            href={company.comp_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                        >
                            {company.comp_website}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
