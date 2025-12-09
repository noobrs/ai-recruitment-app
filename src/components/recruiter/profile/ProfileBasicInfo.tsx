'use client';

interface ProfileBasicInfoProps {
    firstName: string;
    lastName: string;
    companyName?: string;
    memberSince: string;
    isEditing: boolean;
    isSaving?: boolean;
    formData: {
        first_name: string;
        last_name: string;
    };
    onFormChange: (field: string, value: string) => void;
}

/**
 * ProfileBasicInfo Component
 * 
 * Displays/edits recruiter name, company, and member info.
 */
export default function ProfileBasicInfo({
    firstName,
    lastName,
    companyName,
    memberSince,
    isEditing,
    isSaving = false,
    formData,
    onFormChange,
}: ProfileBasicInfoProps) {
    return (
        <div className="space-y-2">
            {!isEditing ? (
                <>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {firstName} {lastName}
                    </h1>
                    {companyName && (
                        <p className="text-lg text-gray-600 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {companyName}
                        </p>
                    )}
                    <p className="text-sm text-gray-500">Member since {memberSince}</p>
                </>
            ) : (
                <>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => onFormChange('first_name', e.target.value)}
                                placeholder="First Name"
                                required
                                disabled={isSaving}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => onFormChange('last_name', e.target.value)}
                                placeholder="Last Name"
                                required
                                disabled={isSaving}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                    {companyName && <p className="text-sm text-gray-500">Company: {companyName}</p>}
                    <p className="text-sm text-gray-500">Member since {memberSince}</p>
                </>
            )}
        </div>
    );
}
