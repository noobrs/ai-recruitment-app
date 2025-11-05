"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import InputForm from "@/components/shared/inputs/InputForm";
import InputUploadFile from "@/components/shared/inputs/InputUploadFile";
import ButtonFilledBlack from "@/components/shared/buttons/ButtonFilledBlack";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function ApplyJobPage() {
  const router = useRouter();
  const { job_id } = useParams(); // 👈 get job id from URL
  const [job, setJob] = useState<any>(null);

  // fetch the job info for display
  useEffect(() => {
    async function fetchJobDetails() {
      try {
        const res = await fetch(`/api/auth/jobseeker/jobs`);
        const data = await res.json();
        const found = data.find((j: any) => j.job_id.toString() === job_id);
        setJob(found || null);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phoneNumber || !cvFile) {
      setErrorMessage("Please fill in all required fields and upload your CV.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("job_id", String(job_id ?? ""));
      formData.append("firstName", firstName || "");
      formData.append("lastName", lastName || "");
      formData.append("email", email || "");
      formData.append("phoneNumber", phoneNumber || "");
      formData.append("coverLetter", coverLetter || "");
      if (cvFile) formData.append("cvFile", cvFile);
      if (extraFile) formData.append("extraFile", extraFile);


      // Placeholder: connect to API later
      // await fetch("/api/auth/jobseeker/apply", { method: "POST", body: formData });

      await new Promise((r) => setTimeout(r, 1000));
      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-black transition mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
          Back
        </button>

        {/* Job Details */}
        {job ? (
          <div className="flex flex-col mb-8">
            <div className="flex items-center mb-2">
              <img src={job.company?.logo || "/default-company.png"} alt="" className="w-8 h-8 mr-2" />
              <p className="text-lg text-gray-500 font-medium">
                {job.company?.comp_name || "Unknown Company"}
              </p>
            </div>
            <h1 className="text-4xl font-bold mb-1">{job.job_title}</h1>
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
          <div className="flex flex-col sm:flex-row gap-6">
            <InputForm
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your First Name"
              label="First Name"
            />
            <InputForm
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your Last Name"
              label="Last Name"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <InputForm
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email"
              label="Email"
            />
            <InputForm
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your Phone Number"
              label="Phone Number"
            />
          </div>

          <InputUploadFile
            label="Upload CV"
            className="w-full"
            onChange={(file) => setCvFile(file)}
          />
          <InputUploadFile
            label="Additional File (optional)"
            className="w-full"
            onChange={(file) => setExtraFile(file)}
            nullable
          />
          <InputForm
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Enter your Cover Letter"
            label="Cover Letter"
            nullable
          />

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
