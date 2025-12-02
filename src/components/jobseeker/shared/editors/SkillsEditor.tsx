interface SkillsEditorProps {
    skills: string[];
    onChange: (skills: string[]) => void;
    disabled?: boolean;
}

/**
 * SkillsEditor - Editable list of skills
 */
export default function SkillsEditor({ skills, onChange, disabled = false }: SkillsEditorProps) {
    const handleSkillChange = (index: number, newValue: string) => {
        const updated = [...skills];
        updated[index] = newValue;
        onChange(updated);
    };

    const handleAddSkill = () => {
        onChange([...skills, '']);
    };

    const handleRemoveSkill = (index: number) => {
        const updated = [...skills];
        updated.splice(index, 1);
        onChange(updated);
    };

    return (
        <div>
            <h3 className="font-bold text-lg mb-2">Skills</h3>
            <div className="flex flex-col gap-2">
                {skills.map((skill, index) => (
                    <div key={index} className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={skill}
                            onChange={(e) => handleSkillChange(index, e.target.value)}
                            disabled={disabled}
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Enter skill"
                        />
                        <button
                            onClick={() => handleRemoveSkill(index)}
                            disabled={disabled}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Remove skill"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button
                    onClick={handleAddSkill}
                    disabled={disabled}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    + Add Skill
                </button>
            </div>
        </div>
    );
}
