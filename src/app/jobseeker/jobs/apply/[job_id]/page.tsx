"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import InputForm from "@/components/shared/inputs/InputForm";
import InputUploadFile from "@/components/shared/inputs/InputUploadFile";
import ButtonFilledBlack from "@/components/shared/buttons/ButtonFilledBlack";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { submitApplication } from './actions';

export default function ApplyJobPage() {
  const router = useRouter();
  const { job_id } = useParams();
  const [job, setJob] = useState<any>(null);

  // fetch the job info for display
  useEffect(() => {
    async function fetchJobDetails() {
      try {
        const res = await fetch("/api/jobseeker/jobs");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const data = await res.json();
        setJob(data.jobs.find((j: any) => j.job_id.toString() === job_id) || null);
      } catch (err) {
        console.error("Error fetching job:", err);
      }
    }
    fetchJobDetails();
  }, [job_id]);

  // form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [extraFile, setExtraFile] = useState<File | null>(null);
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [allowContact, setAllowContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !phoneNumber || !cvFile || !agreePolicy) {
      setErrorMessage(
        "Please fill in all required fields, upload your CV, and agree to the Privacy Policy."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("job_id", String(job_id ?? ""));
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("phoneNumber", phoneNumber);
      formData.append("coverLetter", coverLetter);
      formData.append("allowContact", allowContact ? "true" : "false");

      if (cvFile) formData.append("cvFile", cvFile);
      if (extraFile) formData.append("extraFile", extraFile);

      const result = await submitApplication(formData);

      if (result.success) setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-10">
        <h1 className="text-3xl font-bold text-green-600 mb-3">
          🎉 Application Submitted!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for applying for {job?.job_title || "this position"}.
        </p>
        <ButtonFilledBlack
          text="Back to Job Listings"
          className="px-6 py-3"
          onClick={() => router.push("/jobseeker/job")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-10">
      <div className="bg-white shadow-md rounded-2xl p-10 w-full max-w-3xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-black transition mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
          Back
        </button>

        {/* Job Info */}
        {job ? (
          <div className="flex flex-col mb-8">
            <div className="flex items-center mb-2">
              <img
                src={job.company?.comp_logo || "/default-company.png"}
                alt=""
                className="w-8 h-8 mr-2"
              />
              <p className="text-lg text-gray-500 font-medium">
                {job.company?.comp_name || "Unknown Company"}
              </p>
            </div>
            <h1 className="text-3xl font-bold mb-1">{job.job_title}</h1>
            <p className="text-gray-500 font-semibold text-sm">
              {job.job_location} ({job.job_type})
            </p>
          </div>
        ) : (
          <p className="text-gray-400 mb-8 italic">Loading job details...</p>
        )}

        <hr className="border-gray-200 mb-8" />

        <h2 className="text-2xl font-bold mb-6">Personal Information</h2>

        {errorMessage && (
          <div className="text-red-500 bg-red-50 border border-red-200 px-4 py-2 rounded-md mb-6">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Personal Info */}
          <div className="flex flex-col sm:flex-row gap-6">
            <InputForm
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your First Name"
              label="First Name "
            />
            <InputForm
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your Last Name"
              label="Last Name "
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <InputForm
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email"
              label="Email "
            />
            <InputForm
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your Phone Number"
              label="Phone Number "
            />
          </div>

          {/* ================= FILE + COVER LETTER ================= */}
          <InputUploadFile
            label="Upload CV "
            className="w-full"
            onChange={(file) => setCvFile(file)}
          />

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-800">Cover Letter</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Write a letter"
              className="border border-gray-300 rounded-md p-3 h-32 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* ================= CONSENT CHECKBOXES ================= */}
          <div className="flex flex-col gap-4 text-sm text-gray-600 mt-2">
            <label className="flex items-start gap-3">
              <div className="flex-shrink-0 flex items-center justify-center mt-[2px]">
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>
              <span className="text-gray-600 leading-relaxed">
                By submitting this application, I agree that I have read the{" "}
                <a href="/privacy-policy" className="text-blue-600 underline">
                  Privacy Policy
                </a>{" "}
                and confirm that Jobior may store my personal details to process my
                application.
              </span>
            </label>

            <label className="flex items-start gap-3">
              <div className="flex-shrink-0 flex items-center justify-center mt-[2px]">
                <input
                  type="checkbox"
                  checked={allowContact}
                  onChange={(e) => setAllowContact(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>
              <span className="text-gray-600 leading-relaxed">
                Yes, Jobior can contact me directly about specific future job
                opportunities.
              </span>
            </label>
          </div>

          {/* ================= SUBMIT BUTTON ================= */}
          <ButtonFilledBlack
            text={isSubmitting ? "Submitting..." : "Submit Application"}
            className="w-full py-3 mt-4"
            disabled={isSubmitting}
          />
        </form>
      </div>
    </div>
  );
}
