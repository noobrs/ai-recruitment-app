'use client';

import { useState } from 'react';
import { updateResumeEducation } from '@/app/actions/resume.actions';
import { toast } from 'react-hot-toast';
import { EducationEditor } from '../shared/editors';
import { EducationOut } from '@/types/fastapi.types';
import { EditButton, SaveCancelButtons } from '@/components/shared/buttons';

interface ResumeEducationProps {
    education: EducationOut[];
    resumeId: number;
    onUpdate?: () => void;
}

/**
 * ResumeEducation Component
 * 
 * Responsible for displaying the extracted education from resume in a card.
 * Single Responsibility: Education display.
 */
export default function ResumeEducation({ education, resumeId, onUpdate }: ResumeEducationProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedEducation, setEditedEducation] = useState<EducationOut[]>(
        education || []
    );
    const [isLoading, setIsLoading] = useState(false);

    const isEmpty = !education || education.length === 0;

    const handleEdit = () => {
        setEditedEducation(education);
        setIsEditing(true);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateResumeEducation(resumeId, editedEducation);
            toast.success('Education updated successfully');
            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            toast.error('Failed to update education');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setEditedEducation(education);
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    Education
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
                <EducationEditor
                    education={editedEducation}
                    onChange={setEditedEducation}
                    disabled={isLoading}
                    showTitle={false}
                />
            ) : isEmpty ? (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="mt-4 text-sm text-gray-600">
                        No education information found in your resume.
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        Click the edit button to add your education details manually.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {education.map((edu, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                            <h4 className="font-semibold text-gray-900 text-base">{edu.degree}</h4>
                            <p className="text-sm text-gray-600 mt-1">{edu.institution}</p>
                            {edu.location && (
                                <p className="text-sm text-gray-500 mt-1">{edu.location}</p>
                            )}
                            {(edu.start_date || edu.end_date) && (
                                <p className="text-sm text-gray-500 mt-1">{[edu.start_date, edu.end_date].filter(Boolean).join(' - ')}</p>
                            )}
                            {edu.description && (
                                <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">{edu.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
