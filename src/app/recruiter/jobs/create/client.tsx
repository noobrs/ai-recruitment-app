"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJobAction } from "./actions";

export default function PostJobClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.target as HTMLFormElement);
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

        {/* Error Box */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

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
