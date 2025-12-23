"use client";

import { useEffect, useState } from "react";
import { updateJobAction } from "./actions";
import { useRouter } from "next/navigation";
import EditJobLoading from "./loading";

type JobRequirementInput = {
  job_requirement_id?: number;
  type: string;
  requirement: string;
  weightage: number;
};

export default function EditJobClient({ jobId }: { jobId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [job, setJob] = useState<any>(null);
  const [requirements, setRequirements] = useState<JobRequirementInput[]>([]);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/recruiter/posts/${jobId}/edit`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        setJob(data.job);

        // Map requirements to the format we need
        const mappedRequirements = (data.requirements || []).map((req: any) => ({
          job_requirement_id: req.job_requirement_id,
          type: req.type || "skill",
          requirement: req.requirement || "",
          weightage: req.weightage || 5,
        }));
        setRequirements(mappedRequirements);

        setForm({
          job_title: data.job.job_title,
          job_description: data.job.job_description,
          job_location: data.job.job_location,
          job_type: data.job.job_type,
          job_mode: data.job.job_mode,
          job_industry: data.job.job_industry,
          salary_range: data.job.salary_range,
          job_status: data.job.job_status,
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [jobId]);

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

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
    setSaving(true);

    // Validate requirements
    const validRequirements = requirements.filter(req => req.requirement.trim() !== "");

    const res = await updateJobAction(Number(jobId), form, validRequirements);
    setSaving(false);

    if (!res.success) {
      setError(res.error ?? "An unknown error occurred.");
      return;
    }

    router.push("/recruiter/posts");
  }

  if (error) return <div className="text-center p-10 text-red-600">{error}</div>;
  if (loading) return <EditJobLoading />;

  return (
    <div className="bg-white p-8 border border-gray-200 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Edit Job Details</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium">Job Title</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.job_title}
            onChange={(e) => handleChange("job_title", e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Job Description</label>
          <textarea
            rows={5}
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.job_description}
            onChange={(e) => handleChange("job_description", e.target.value)}
          />
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
                    value={req.weightage * 10}
                    onChange={(e) => handleUpdateRequirement(index, "weightage", parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold text-gray-700 w-6 text-center">
                    {req.weightage * 10}
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

        {/* Location */}
        <div>
          <label className="block text-sm font-medium">Location</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.job_location}
            onChange={(e) => handleChange("job_location", e.target.value)}
          />
        </div>

        {/* Type + Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Job Type</label>
            <select
              value={form.job_type}
              onChange={(e) => handleChange("job_type", e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            >
              <option>Full-Time</option>
              <option>Part-Time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Work Mode</label>
            <select
              value={form.job_mode}
              onChange={(e) => handleChange("job_mode", e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            >
              <option>On-site</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>
          </div>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium">Industry</label>
          <input
            value={form.job_industry}
            onChange={(e) => handleChange("job_industry", e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        {/* Salary */}
        <div>
          <label className="block text-sm font-medium">Salary Range</label>
          <input
            value={form.salary_range}
            onChange={(e) => handleChange("salary_range", e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        {/* Job Status */}
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            value={form.job_status}
            onChange={(e) => handleChange("job_status", e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          >
            <option value="open">Open</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        {/* Error */}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-secondary text-white py-3 rounded-lg font-medium hover:bg-secondary-dark disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
