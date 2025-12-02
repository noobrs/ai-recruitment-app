'use client';

import { useRouter } from 'next/navigation';
import JobCard, { JobCardProps } from '@/components/jobseeker/jobs/JobCard';

interface AppliedJobProps extends JobCardProps {
  applicationId?: number;
}

interface MyActivitiesProps {
  bookmarkedJobs: JobCardProps[];
  appliedJobs: AppliedJobProps[];
  loading?: boolean; // overall profile activities loading
  bookmarkLoadingId?: number | null; // 👈 NEW: which job's bookmark is toggling
  onToggleBookmark?: (jobId: number) => void;
}

export default function MyActivities({
  bookmarkedJobs,
  appliedJobs,
  loading = false,
  bookmarkLoadingId = null,
  onToggleBookmark,
}: MyActivitiesProps) {
  const router = useRouter();

  // 🩶 Overall Skeleton Loader
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 animate-pulse">
        <h2 className="text-2xl font-semibold mb-4">My Activities</h2>
        <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 border border-gray-200 rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ Actual content
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">My Activities</h2>

      {/* === Bookmarked Jobs === */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-700">
          Bookmarked Jobs
        </h3>
        {bookmarkedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarkedJobs.map((job) => (
              <div
                key={`bookmark-${job.jobId}`}
                className="cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <JobCard
                  {...job}
                  bookmark={job.bookmark}
                  loading={bookmarkLoadingId === job.jobId} // ✅ spinner only for active one
                  onToggleBookmark={onToggleBookmark}
                  navigateOnClick={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No bookmarked jobs yet.
          </p>
        )}
      </div>

      {/* === Applied Jobs === */}
      <div>
        <h3 className="text-lg font-medium mb-3 text-gray-700">
          Applied Jobs
        </h3>
        {appliedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appliedJobs.map((job) => (
              <div
                key={`applied-${job.applicationId || job.jobId}`}
                className="cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <JobCard
                  {...job}
                  bookmark={job.bookmark}
                  loading={bookmarkLoadingId === job.jobId}
                  onToggleBookmark={onToggleBookmark}
                  navigateOnClick={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No job applications yet.
          </p>
        )}
      </div>
    </div>
  );
}
