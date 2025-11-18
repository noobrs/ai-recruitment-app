import { ExperienceOut } from '@/types/fastapi.types';

interface ExperienceEditorProps {
    experiences: ExperienceOut[];
    onChange: (experiences: ExperienceOut[]) => void;
}

/**
 * ExperienceEditor - Editable list of work experiences
 */
export default function ExperienceEditor({
    experiences,
    onChange
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
            <h3 className="font-bold text-lg mb-2">Experience</h3>
            {experiences.map((exp, index) => (
                <div key={index} className="border p-4 rounded-md mb-3">
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={() => handleRemoveExperience(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
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
                            className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                        />
                        <input
                            type="text"
                            placeholder="Company"
                            value={exp.company || ''}
                            onChange={(e) =>
                                handleExperienceChange(index, 'company', e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            value={exp.location || ''}
                            onChange={(e) =>
                                handleExperienceChange(index, 'location', e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                placeholder="Start Date"
                                value={exp.start_date || ''}
                                onChange={(e) =>
                                    handleExperienceChange(index, 'start_date', e.target.value)
                                }
                                className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                            />
                            <input
                                type="text"
                                placeholder="End Date"
                                value={exp.end_date || ''}
                                onChange={(e) =>
                                    handleExperienceChange(index, 'end_date', e.target.value)
                                }
                                className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                            />
                        </div>
                        <textarea
                            placeholder="Description / Responsibilities"
                            value={exp.description || ''}
                            onChange={(e) =>
                                handleExperienceChange(index, 'description', e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-3 py-1 h-20 resize-none focus:ring focus:ring-blue-100"
                        />
                    </div>
                </div>
            ))}
            <button
                onClick={handleAddExperience}
                className="text-blue-600 hover:text-blue-800 text-sm mt-1"
            >
                + Add Experience
            </button>
        </div>
    );
}
