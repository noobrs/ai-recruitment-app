export type JobCardProps = {
  jobId?: number;
  compLogo?: string;
  compName: string;
  jobTitle: string;
  jobLocation: string;
  jobType: string;
  createdAt: string;
  bookmark?: boolean;
  readMoreUrl?: string;
  onToggleBookmark?: (jobId: number) => void;
  loading?: boolean;
};

export default function JobCard(props: JobCardProps) {
  const readMoreHref =
    props.readMoreUrl || `/jobseeker/job/view/${props.jobId ?? ""}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 text-black border border-gray-200">
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <img
            src={props.compLogo}
            alt={`${props.compName} Logo`}
            className="w-8 h-8 mr-2"
          />
          <p className="text-lg text-gray-600 grow-1">{props.compName}</p>
        </div>

        {/* Bookmark icon */}
        <div
          className={`relative w-7 h-7 flex items-center justify-center ${
            props.loading ? "opacity-70" : ""
          }`}
        >
          {props.loading ? (
            // 🔄 Small loading spinner overlay when toggling
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          ) : (
            <img
              src={props.bookmark ? "/bookmark-solid.svg" : "/bookmark.svg"}
              alt="Bookmark"
              className="w-7 h-7 cursor-pointer hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation(); // Prevent selecting job card
                if (props.jobId && props.onToggleBookmark) {
                  props.onToggleBookmark(props.jobId);
                }
              }}
            />
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold pt-2 pb-1">{props.jobTitle}</h2>
      <p className="text-gray-600 text-sm pb-2">
        {props.jobLocation} ({props.jobType})
      </p>
      <p className="text-black">{props.createdAt}</p>
    </div>
  );
}
