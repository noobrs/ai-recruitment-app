import { useRouter } from "next/navigation";
import Image from "next/image";

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
  navigateOnClick?: boolean;
  routerPath?: string;
};

export default function JobCard(props: JobCardProps) {
  const router = useRouter();
  const readMoreHref =
    props.readMoreUrl || `/jobseeker/jobs/view/${props.jobId ?? ""}`;

  const handleCardClick = () => {
    if (props.navigateOnClick && props.jobId) {
      router.push(props.routerPath || readMoreHref);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-md p-4 text-black border border-gray-200 
        ${props.navigateOnClick ? "cursor-pointer hover:shadow-lg hover:scale-[1.01]" : ""}
        transition-all duration-200`}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <Image
            src={props.compLogo || "/default-company.png"}
            alt={`${props.compName} Logo`}
            width={32}
            height={32}
            className="w-8 h-8 mr-2"
          />
          <p className="text-lg text-gray-600 grow">{props.compName}</p>
        </div>

        {/* Bookmark icon */}
        <div
          className={`relative w-7 h-7 flex items-center justify-center ${props.loading ? "opacity-70" : ""
            }`}
          onClick={(e) => e.stopPropagation()} // prevent navigating when toggling bookmark
        >
          {props.loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          ) : (
            <Image
              src={props.bookmark ? "/bookmark-solid.svg" : "/bookmark.svg"}
              alt="Bookmark"
              width={28}
              height={28}
              className="w-7 h-7 cursor-pointer hover:scale-110 transition-transform"
              onClick={() => {
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
