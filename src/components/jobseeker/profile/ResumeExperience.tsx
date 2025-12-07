'use client';

import { useState } from 'react';
import { updateResumeExperience } from '@/app/actions/resume.actions';
import { toast } from 'react-hot-toast';
import { ExperienceEditor } from '../shared/editors';
import { ExperienceOut } from '@/types/fastapi.types';
import { EditButton, SaveCancelButtons } from '@/components/shared/buttons';

interface ResumeExperienceProps {
    experiences: ExperienceOut[];
    resumeId: number;
    onUpdate?: () => void;
}

/**
 * ResumeExperience Component
 */
export default function ResumeExperience({ experiences, resumeId, onUpdate }: ResumeExperienceProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedExperiences, setEditedExperiences] = useState<ExperienceOut[]>(
        experiences || []
    );
    const [isLoading, setIsLoading] = useState(false);

    const isEmpty = !experiences || experiences.length === 0;

    const handleEdit = () => {
        setEditedExperiences(experiences);
        setIsEditing(true);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateResumeExperience(resumeId, editedExperiences);
            toast.success('Experience updated successfully');
            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            toast.error('Failed to update experience');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setEditedExperiences(experiences);
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    Experience
                </h3>
                {!isEditing ? (
                    <EditButton onClick={handleEdit} variant="primary" />
                ) : (
                    <SaveCancelButtons
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                        variant="primary"
                    />
                )}
            </div>

            {isEditing ? (
                <ExperienceEditor
                    experiences={editedExperiences}
                    onChange={setEditedExperiences}
                    disabled={isLoading}
                />
            ) : isEmpty ? (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="mt-4 text-sm text-gray-600">
                        No work experience found in your resume.
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        Click the edit button to add your work experience manually.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {experiences.map((exp, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                            <h4 className="font-semibold text-gray-900 text-base">{exp.job_title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{exp.company}</p>
                            {exp.location && (
                                <p className="text-sm text-gray-500 mt-1">{exp.location}</p>
                            )}
                            {(exp.start_date || exp.end_date) && (
                                <p className="text-sm text-gray-500 mt-1">{[exp.start_date, exp.end_date].filter(Boolean).join(' - ')}</p>
                            )}
                            {exp.description && (
                                <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
