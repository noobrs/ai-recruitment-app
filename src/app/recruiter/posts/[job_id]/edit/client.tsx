"use client";

import { useEffect, useState } from "react";
import { updateJobAction } from "./actions";
import { useRouter } from "next/navigation";
import EditJobLoading from "./loading";

export default function EditJobClient({ jobId }: { jobId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [job, setJob] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/recruiter/posts/${jobId}/edit`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        setJob(data.job);
        setRequirements(data.requirements);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateJobAction(Number(jobId), form);
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
