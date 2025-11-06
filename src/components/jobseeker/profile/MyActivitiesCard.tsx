'use client';

import JobCard, { JobCardProps } from '@/components/jobseeker/jobs/JobCard';

interface MyActivitiesProps {
  bookmarkedJobs: JobCardProps[];
  appliedJobs: JobCardProps[];
}

export default function MyActivities({ bookmarkedJobs, appliedJobs }: MyActivitiesProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4">My Activities</h2>

      {/* Bookmarked Jobs */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-700">Bookmarked Jobs</h3>
        {bookmarkedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarkedJobs.map((job) => (
              <JobCard key={`bookmark-${job.jobId}`} {...job} bookmark />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No bookmarked jobs yet.</p>
        )}
      </div>

      {/* Applied Jobs */}
      <div>
        <h3 className="text-lg font-medium mb-3 text-gray-700">Applied Jobs</h3>
        {appliedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appliedJobs.map((job) => (
              <JobCard key={`applied-${job.jobId}`} {...job} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No job applications yet.</p>
        )}
      </div>
    </div>
  );
}
