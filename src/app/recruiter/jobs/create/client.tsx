"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJobAction } from "./actions";

type JobRequirementInput = {
  type: string;
  requirement: string;
  weightage: number;
};

export default function PostJobClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requirements, setRequirements] = useState<JobRequirementInput[]>([]);

  const handleAddRequirement = () => {
    setRequirements([
      ...requirements,
      {
        type: "skill",
        requirement: "",
        weightage: 5,
      },
    ]);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleUpdateRequirement = (index: number, field: keyof JobRequirementInput, value: string | number) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements(updated);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.target as HTMLFormElement);

    // Validate requirements
    const validRequirements = requirements.filter(req => req.requirement.trim() !== "");

    // Add requirements to form data
    if (validRequirements.length > 0) {
      form.append("requirements", JSON.stringify(validRequirements));
    }

    const result = await createJobAction(form);

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Something went wrong.");
      return;
    }

    router.push("/recruiter/jobs");
  }

  return (
    <div className="bg-white rounded-lg shadow p-8 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Job Details
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Title
          </label>
          <input
            type="text"
            name="job_title"
            required
            className="mt-1 w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Description
          </label>
          <textarea
            name="job_description"
            required
            rows={5}
            className="mt-1 w-full border rounded-md px-3 py-2"
          ></textarea>
        </div>

        {/* Job Requirements */}
        <div>
          <h3 className="block text-sm font-semibold text-gray-900 mb-4">
            Job Requirements
          </h3>

          <div className="space-y-3">
            {/* Requirements List */}
            {requirements.map((req, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-md"
              >
                {/* Requirement Text Input */}
                <input
                  type="text"
                  value={req.requirement}
                  onChange={(e) => handleUpdateRequirement(index, "requirement", e.target.value)}
                  placeholder="e.g., Bachelor's in CS, React expertise, 3+ years"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Skill Type Dropdown */}
                <select
                  value={req.type}
                  onChange={(e) => handleUpdateRequirement(index, "type", e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                >
                  <option value="education">Education</option>
                  <option value="skill">Skill</option>
                  <option value="experience">Experience</option>
                </select>

                {/* Weightage Slider and Value */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={req.weightage}
                    onChange={(e) => handleUpdateRequirement(index, "weightage", parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold text-gray-700 w-6 text-center">
                    {req.weightage}
                  </span>
                </div>

                {/* Delete/Trash Icon */}
                <button
                  type="button"
                  onClick={() => handleRemoveRequirement(index)}
                  className="text-gray-400 hover:text-red-600 transition"
                  title="Remove requirement"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add Requirement Button */}
            <button
              type="button"
              onClick={handleAddRequirement}
              className="w-full text-sm border-2 border-dashed border-gray-300 rounded-md py-3 text-gray-600 font-medium hover:border-gray-400 hover:text-gray-700 transition"
            >
              + Add Requirement
            </button>
          </div>
        </div>

        {/* Error Box */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Location
          </label>
          <input
            type="text"
            name="job_location"
            required
            className="mt-1 w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* Job Type + Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Job Type
            </label>
            <select
              name="job_type"
              className="mt-1 w-full border rounded-md px-3 py-2"
            >
              <option>Full-Time</option>
              <option>Part-Time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Work Mode
            </label>
            <select
              name="job_mode"
              className="mt-1 w-full border rounded-md px-3 py-2"
            >
              <option>On-site</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>
          </div>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Industry
          </label>
          <input
            type="text"
            name="job_industry"
            required
            className="mt-1 w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* Salary */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Salary Range
          </label>
          <input
            type="text"
            name="salary_range"
            placeholder="RM4000 - RM6000"
            className="mt-1 w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-secondary text-white font-medium py-3 rounded-lg hover:bg-secondary-dark transition disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}
