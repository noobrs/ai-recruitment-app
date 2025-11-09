"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import InputUploadFile from "@/components/shared/inputs/InputUploadFile";
import ButtonFilledBlack from "@/components/shared/buttons/ButtonFilledBlack";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { submitApplication } from "./actions";

export default function ApplyJobPage() {
  const router = useRouter();
  const { job_id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [step, setStep] = useState(1); // Step 1: Upload resume, Step 2: Review extracted info
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);

  // Fetch job details for display
  useEffect(() => {
    async function fetchJobDetails() {
      try {
        const res = await fetch("/api/jobseeker/jobs");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const data = await res.json();
        const jobs = Array.isArray(data) ? data : data.jobs;
        const jobFound = jobs?.find((j: any) => j.job_id.toString() === job_id);
        setJob(jobFound || null);
      } catch (err) {
        console.error("Error fetching job:", err);
      }
    }
    fetchJobDetails();
  }, [job_id]);

  // === Step 1: Upload Resume + Extraction ===
  const handleResumeUpload = async () => {
    if (!cvFile) {
      setErrorMessage("Please upload your resume to continue.");
      return;
    }

    setIsExtracting(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", cvFile);

      // Call Python API for extraction
      const res = await fetch("/api/webhooks/fastapi/resume-processed", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to extract resume data");

      const data = await res.json();
      setResumeData(data);
      setStep(2); // move to next step
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Resume processing failed. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  // === Step 2: Submit Application ===
  const handleSubmit = async () => {
    if (!agreePolicy) {
      setErrorMessage("Please agree to the Privacy Policy before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("job_id", String(job_id));
      formData.append("cvFile", cvFile as File);
      formData.append("extracted_skills", JSON.stringify(resumeData.skills || []));
      formData.append("extracted_experiences", JSON.stringify(resumeData.experience || []));
      formData.append("extracted_education", JSON.stringify(resumeData.education || []));

      const result = await submitApplication(formData);
      if (result.success) setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Loading job ===
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
        Loading job details...
      </div>
    );
  }

  // === Step 3: Submission Confirmation ===
  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-10">
        <h1 className="text-3xl font-bold text-green-600 mb-3">
          🎉 Application Submitted!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for applying for {job.job_title}.
        </p>
        <ButtonFilledBlack
          text="Back to Job Listings"
          className="px-6 py-3"
          onClick={() => router.push("/jobseeker/job")}
        />
      </div>
    );
  }

  // === Step 1: Upload Resume ===
  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 py-25">
        <div className="bg-white shadow-md rounded-2xl p-10 w-full max-w-2xl">
          {/* Back Button */} 
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-500 hover:text-black transition mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Back
          </button>

          {/* Job Header */}
          <div className="flex flex-row items-center mb-4">
            <img
              src={job.company?.comp_logo_path || "/default-company.png"}
              alt=""
              className="w-8 h-8 mr-2"
            />
            <p className="text-lg text-gray-500">{job.company?.comp_name}</p>
          </div>
          <h1 className="text-4xl font-bold mb-2">{job.job_title}</h1>
          <p className="text-gray-500 font-bold text-sm mb-6">
            {job.job_location} ({job.job_type})
          </p>
          <div className="w-full h-px bg-gray-200 mb-8"></div>

          {/* Upload Form */}
          <h2 className="text-2xl font-bold mb-4">Upload Your Resume</h2>
          <p className="text-gray-500 text-sm mb-6">
            Upload your resume for automatic information extraction.
          </p>

          {errorMessage && (
            <div className="text-red-500 bg-red-50 border border-red-200 px-4 py-2 rounded-md mb-6 text-center">
              {errorMessage}
            </div>
          )}

          <InputUploadFile
            label="Resume"
            className="w-full"
            onChange={(file) => setCvFile(file)}
          />

          <ButtonFilledBlack
            text={isExtracting ? "Processing..." : "Continue"}
            className="w-full py-3 mt-6"
            disabled={isExtracting}
            onClick={handleResumeUpload}
          />
        </div>
      </div>
    );
  }

  // === Step 2: Review Extracted Info ===
  if (step === 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-10">
        <div className="bg-white shadow-md rounded-2xl p-10 w-full max-w-3xl">
          <button
            onClick={() => setStep(1)}
            className="flex items-center text-gray-500 hover:text-black transition mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Back
          </button>

          {/* Job Info */}
          <div className="flex flex-row items-center mb-4">
            <img
              src={job.company?.comp_logo_path || "/default-company.png"}
              alt=""
              className="w-8 h-8 mr-2"
            />
            <p className="text-lg text-gray-500">{job.company?.comp_name}</p>
          </div>
          <h1 className="text-4xl font-bold mb-2">{job.job_title}</h1>
          <p className="text-gray-500 font-bold text-sm mb-6">
            {job.job_location} ({job.job_type})
          </p>
          <div className="w-full h-px bg-gray-200 mb-8"></div>

          <h2 className="text-2xl font-bold mb-6">Review Extracted Information</h2>

          <div className="flex flex-col gap-6 text-gray-700">
            {/* Skills */}
            <div>
              <h3 className="font-bold text-lg mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resumeData?.skills?.length ? (
                  resumeData.skills.map((s: string, i: number) => (
                    <span
                      key={i}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400">No skills detected</p>
                )}
              </div>
            </div>

            {/* Experience */}
            <div>
              <h3 className="font-bold text-lg mb-2">Experience</h3>
              {resumeData?.experience?.length ? (
                resumeData.experience.map((exp: any, i: number) => (
                  <div key={i} className="border p-3 rounded-md mb-2">
                    <p className="font-semibold">{exp.position}</p>
                    <p className="text-sm text-gray-500">{exp.company}</p>
                    <p className="text-sm">{exp.years} years</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No experiences detected</p>
              )}
            </div>

            {/* Education */}
            <div>
              <h3 className="font-bold text-lg mb-2">Education</h3>
              {resumeData?.education?.length ? (
                resumeData.education.map((edu: any, i: number) => (
                  <div key={i} className="border p-3 rounded-md mb-2">
                    <p className="font-semibold">{edu.degree}</p>
                    <p className="text-sm text-gray-500">{edu.institution}</p>
                    <p className="text-sm">Year: {edu.year}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No education details detected</p>
              )}
            </div>
          </div>

          {/* Privacy Policy Checkbox */}
          <div className="flex items-start gap-3 mt-6 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={agreePolicy}
              onChange={(e) => setAgreePolicy(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <span>
              By submitting this application, I agree to the{" "}
              <a href="/privacy-policy" className="text-blue-600 underline">
                Privacy Policy
              </a>{" "}
              and confirm that Jobior may store my resume information to process my application.
            </span>
          </div>

          {errorMessage && (
            <div className="text-red-500 mt-4 text-center">{errorMessage}</div>
          )}

          <ButtonFilledBlack
            text={isSubmitting ? "Submitting..." : "Submit Application"}
            className="w-full py-3 mt-6"
            disabled={isSubmitting}
            onClick={handleSubmit}
          />
        </div>
      </div>
    );
  }
}
