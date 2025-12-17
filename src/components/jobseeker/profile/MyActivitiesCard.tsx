'use client';

import { useRouter } from 'next/navigation';
import JobCard, { JobCardProps } from '@/components/jobseeker/jobs/JobCard';

interface AppliedJobProps extends JobCardProps {
  applicationId?: number;
}

interface MyActivitiesProps {
  bookmarkedJobs: JobCardProps[];
  appliedJobs: AppliedJobProps[];
  loading?: boolean;
  bookmarkLoadingId?: number | null;
  onToggleBookmark?: (jobId: number) => void;

  visibleBookmarkedCount: number;
  setVisibleBookmarkedCount: React.Dispatch<React.SetStateAction<number>>;

  visibleAppliedCount: number;
  setVisibleAppliedCount: React.Dispatch<React.SetStateAction<number>>;
}

export default function MyActivities({
  bookmarkedJobs,
  appliedJobs,
  loading = false,
  bookmarkLoadingId = null,
  onToggleBookmark,
  visibleBookmarkedCount,
  setVisibleBookmarkedCount,
  visibleAppliedCount,
  setVisibleAppliedCount,
}: MyActivitiesProps) {
  const router = useRouter();

  // Overall Skeleton Loader
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">My Activities</h2>

      {/* === Bookmarked Jobs === */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-700">
          Bookmarked Jobs
        </h3>

        {bookmarkedJobs.length > 0 ? (
          <>
            {/* Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarkedJobs
                .slice(0, visibleBookmarkedCount)
                .map((job) => (
                  <div
                    key={`bookmark-${job.jobId}`}
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

            {/* Show More / Less */}
            <div className="flex justify-center mt-4">
              {visibleBookmarkedCount < bookmarkedJobs.length ? (
                <button
                  onClick={() =>
                    setVisibleBookmarkedCount((prev) => prev + 4)
                  }
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show more bookmarked jobs →
                </button>
              ) : visibleBookmarkedCount > 4 ? (
                <button
                  onClick={() => setVisibleBookmarkedCount(4)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Show less
                </button>
              ) : null}
            </div>
          </>
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
          <>
            {/* Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appliedJobs
                .slice(0, visibleAppliedCount)
                .map((job) => (
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

            {/* Show More / Less */}
            <div className="flex justify-center mt-4">
              {visibleAppliedCount < appliedJobs.length ? (
                <button
                  onClick={() => setVisibleAppliedCount((prev) => prev + 4)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show more applied jobs →
                </button>
              ) : visibleAppliedCount > 4 ? (
                <button
                  onClick={() => setVisibleAppliedCount(4)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Show less
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No job applications yet.
          </p>
        )}
      </div>
    </div>
  );
}
