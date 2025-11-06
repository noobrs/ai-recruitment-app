'use client';

interface ProfileAboutSectionProps {
    position?: string | null;
    isEditing: boolean;
    value: string;
    onChange: (value: string) => void;
}

/**
 * ProfileAboutSection Component
 * 
 * Responsible for displaying/editing the recruiter's position/title.
 */
export default function ProfileAboutSection({
    position,
    isEditing,
    value,
    onChange,
}: ProfileAboutSectionProps) {
    return (
        <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Position</h2>
            {!isEditing ? (
                <p className="text-gray-700">
                    {position || 'No position title added yet. Click "Edit Profile" to add one.'}
                </p>
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="e.g., Senior Talent Acquisition Specialist, HR Manager, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
            )}
        </div>
    );
}
