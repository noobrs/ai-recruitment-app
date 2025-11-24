import Image from "next/image";

export type CompanyCardProps = {
  compId?: number;
  compLogo?: string;
  compName: string;
  industry: string;
  location: string;
  employeeSize: string;
  rating: number;
  totalJobs?: number;
  benefitsTag?: string;
  onClick?: (compId?: number) => void;
};

export default function CompanyCard(props: CompanyCardProps) {
  return (
    <div
      onClick={() => props.onClick?.(props.compId)}
      className="bg-white rounded-xl shadow-md border border-gray-200 p-5 w-full cursor-pointer hover:shadow-lg transition-all duration-200"
    >
      {/* Logo */}
      <div className="flex flex-col items-center">
        <Image
          src={props.compLogo || "/company-placeholder.png"}
          alt={`${props.compName} Logo`}
          width={56}
          height={56}
          className="w-14 h-14 object-contain mb-3"
        />

        {/* Company Name */}
        <h3 className="text-lg font-semibold text-black text-center">
          {props.compName}
        </h3>

        {/* Rating */}
        <div className="flex items-center justify-center mt-1">
          <Image src="/star.png" alt="Rating" width={16} height={16} className="w-4 h-4 mr-1" />
          <span className="text-sm text-gray-600">{props.rating.toFixed(1)}</span> {/* one decimal place */}
        </div>
      </div>

      {/* Company Info */}
      <div className="text-center mt-3">
        <p className="text-gray-600 text-sm">{props.industry}</p>
        <p className="text-gray-600 text-sm">{props.location}</p>
        <p className="text-gray-600 text-sm">{props.employeeSize}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {props.totalJobs !== undefined && (
          <span className="px-4 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
            {props.totalJobs} Jobs
          </span>
        )}
        {props.benefitsTag && (
          <span className="px-4 py-1 border border-purple-500 text-purple-600 rounded-full text-sm font-medium">
            {props.benefitsTag}
          </span>
        )}
      </div>
    </div>
  );
}
