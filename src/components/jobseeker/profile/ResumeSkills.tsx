'use client';

import { useState } from 'react';
import { updateResumeSkills } from '@/app/actions/resume.actions';
import { toast } from 'react-hot-toast';
import { SkillsEditor } from '../shared/editors';
import { EditButton, SaveCancelButtons } from '@/components/shared/buttons';

interface ResumeSkillsProps {
    skills: string[];
    resumeId: number;
    onUpdate?: () => void;
}

/**
 * ResumeSkills Component
 * 
 * Responsible for displaying the extracted skills from resume in a card.
 * Single Responsibility: Skills display.
 */
export default function ResumeSkills({ skills, resumeId, onUpdate }: ResumeSkillsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedSkills, setEditedSkills] = useState<string[]>(skills || []);
    const [isLoading, setIsLoading] = useState(false);

    if (!skills || skills.length === 0) return null;

    const handleEdit = () => {
        setEditedSkills([...skills]);
        setIsEditing(true);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateResumeSkills(resumeId, editedSkills);
            toast.success('Skills updated successfully');
            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            toast.error('Failed to update skills');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setEditedSkills([...skills]);
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    Skills
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
                <SkillsEditor
                    skills={editedSkills}
                    onChange={setEditedSkills}
                    disabled={isLoading}
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-white border border-primary text-gray-700 rounded-full text-sm font-medium"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
