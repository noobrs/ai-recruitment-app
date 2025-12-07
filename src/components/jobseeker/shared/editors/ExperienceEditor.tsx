import { ExperienceOut } from '@/types/fastapi.types';

interface ExperienceEditorProps {
    experiences: ExperienceOut[];
    onChange: (experiences: ExperienceOut[]) => void;
    disabled?: boolean;
    showTitle?: boolean;
}

/**
 * ExperienceEditor - Editable list of work experiences
 */
export default function ExperienceEditor({
    experiences,
    onChange,
    disabled = false,
    showTitle = true
}: ExperienceEditorProps) {
    const handleExperienceChange = (
        index: number,
        field: keyof typeof experiences[0],
        value: string
    ) => {
        const updated = [...experiences];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const handleAddExperience = () => {
        onChange([
            ...experiences,
            {
                job_title: null,
                company: null,
                location: null,
                start_date: null,
                end_date: null,
                description: null,
            },
        ]);
    };

    const handleRemoveExperience = (index: number) => {
        const updated = [...experiences];
        updated.splice(index, 1);
        onChange(updated);
    };

    return (
        <div>
            {showTitle && <h3 className="font-bold text-lg mb-2">Experience</h3>}
            {experiences.map((exp, index) => (
                <div key={index} className="border p-4 rounded-md mb-3">
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={() => handleRemoveExperience(index)}
                            disabled={disabled}
                            className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ✕ Remove
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            placeholder="Job Title"
                            value={exp.job_title || ''}
                            onChange={(e) =>
                                handleExperienceChange(index, 'job_title', e.target.value)
                            }
                            disabled={disabled}
                            className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <input
                            type="text"
                            placeholder="Company"
                            value={exp.company || ''}
                            onChange={(e) =>
                                handleExperienceChange(index, 'company', e.target.value)
                            }
                            disabled={disabled}
                            className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            value={exp.location || ''}
                            onChange={(e) =>
                                handleExperienceChange(index, 'location', e.target.value)
                            }
                            disabled={disabled}
                            className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                placeholder="Start Date"
                                value={exp.start_date || ''}
                                onChange={(e) =>
                                    handleExperienceChange(index, 'start_date', e.target.value)
                                }
                                disabled={disabled}
                                className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <input
                                type="text"
                                placeholder="End Date"
                                value={exp.end_date || ''}
                                onChange={(e) =>
                                    handleExperienceChange(index, 'end_date', e.target.value)
                                }
                                disabled={disabled}
                                className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <textarea
                            placeholder="Description / Responsibilities"
                            value={exp.description || ''}
                            onChange={(e) =>
                                handleExperienceChange(index, 'description', e.target.value)
                            }
                            disabled={disabled}
                            className="border border-gray-300 rounded-md px-3 py-1 h-20 resize-none focus:ring focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>
            ))}
            <button
                onClick={handleAddExperience}
                disabled={disabled}
                className="text-blue-600 hover:text-blue-800 text-sm mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                + Add Experience
            </button>
        </div>
    );
}
