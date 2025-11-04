import Link from "next/link";

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
};


export default function JobCard(props: JobCardProps) {
  // fallback URL if none provided
  const readMoreHref =
    props.readMoreUrl || `/jobseeker/job/view/${props.jobId ?? ""}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 text-black">
      <div className="flex flex-row items-center">
        <img src={props.compLogo} alt="" className="w-8 h-8 mr-2" />
        <p className="text-lg text-gray-600 grow-1">{props.compName}</p>
        <img
          src={props.bookmark ? "/bookmark-solid.svg" : "/bookmark.svg"}
          alt=""
          className="w-7 h-7"
        />
      </div>

      <h2 className="text-2xl font-bold pt-2 pb-1">{props.jobTitle}</h2>

      <p className="text-gray-600 text-sm pb-2">
        {props.jobLocation} ({props.jobType})
      </p>

      <div className="flex flex-row">
        {/* <Link href={readMoreHref} className="text-blue-500 grow-1">
          Read More
        </Link> */}
        <p className="text-black">{props.createdAt}</p>
      </div>
    </div>
  );
}
