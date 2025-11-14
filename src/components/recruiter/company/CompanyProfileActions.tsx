"use client";

interface CompanyProfileActionsProps {
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
}

/**
 * CompanyProfileActions Component
 *
 * Handles edit/save/cancel actions for the company profile page.
 * Independent from recruiter user profile version.
 */
export default function CompanyProfileActions({
    isEditing,
    isSaving,
    onEdit,
    onCancel,
    onSave,
}: CompanyProfileActionsProps) {
    return (
        <div className="flex gap-3">
            {!isEditing ? (
                <button
                    onClick={onEdit}
                    className="px-5 py-2.5 bg-secondary text-white rounded-md font-medium shadow-sm hover:bg-secondary-dark transition-colors"
                >
                    Edit Company
                </button>
            ) : (
                <>
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-secondary text-white rounded-md font-medium shadow-sm hover:bg-secondary-dark transition-colors disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </>
            )}
        </div>
    );
}
