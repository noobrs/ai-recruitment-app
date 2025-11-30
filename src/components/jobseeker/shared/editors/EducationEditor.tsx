import { EducationOut } from "@/types";

/**
 * EducationEditor - Editable list of education entries
 */
interface EducationEditorProps {
    education: EducationOut[];
    onChange: (education: EducationOut[]) => void;
}

export default function EducationEditor({
    education,
    onChange
}: EducationEditorProps) {
    const handleEducationChange = (
        index: number,
        field: keyof typeof education[0],
        value: string
    ) => {
        const updated = [...education];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const handleAddEducation = () => {
        onChange([
            ...education,
            {
                degree: null,
                institution: null,
                location: null,
                start_date: null,
                end_date: null,
                description: null,
            },
        ]);
    };

    const handleRemoveEducation = (index: number) => {
        const updated = [...education];
        updated.splice(index, 1);
        onChange(updated);
    };

    return (
        <div>
            <h3 className="font-bold text-lg mb-2">Education</h3>
            {education.map((edu, index) => (
                <div key={index} className="border p-4 rounded-md mb-3">
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={() => handleRemoveEducation(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                        >
                            ✕ Remove
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            placeholder="Degree"
                            value={edu.degree || ''}
                            onChange={(e) =>
                                handleEducationChange(index, 'degree', e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                        />
                        <input
                            type="text"
                            placeholder="Institution"
                            value={edu.institution || ''}
                            onChange={(e) =>
                                handleEducationChange(index, 'institution', e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            value={edu.location || ''}
                            onChange={(e) =>
                                handleEducationChange(index, 'location', e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                placeholder="Start Date"
                                value={edu.start_date || ''}
                                onChange={(e) =>
                                    handleEducationChange(index, 'start_date', e.target.value)
                                }
                                className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                            />
                            <input
                                type="text"
                                placeholder="End Date"
                                value={edu.end_date || ''}
                                onChange={(e) =>
                                    handleEducationChange(index, 'end_date', e.target.value)
                                }
                                className="border border-gray-300 rounded-md px-3 py-1 focus:ring focus:ring-blue-100"
                            />
                        </div>
                        <textarea
                            placeholder="Description"
                            value={edu.description || ''}
                            onChange={(e) =>
                                handleEducationChange(index, 'description', e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-3 py-1 h-20 resize-none focus:ring focus:ring-blue-100"
                        />
                    </div>
                </div>
            ))}
            <button
                onClick={handleAddEducation}
                className="text-blue-600 hover:text-blue-800 text-sm mt-1"
            >
                + Add Education
            </button>
        </div>
    );
}
