"use client";

import Image from "next/image";

export type RecruiterCardProps = {
  name: string;
  position?: string | null;
  email?: string | null;
  profilePicturePath?: string | null;
};

export default function RecruiterCard({
  name,
  position,
  email,
  profilePicturePath,
}: RecruiterCardProps) {
  const initials =
    name?.[0]?.toUpperCase() || "U";

  return (
    <div
      className="
        bg-white rounded-lg shadow-md p-4 border border-gray-200
        flex items-center gap-4
        transition-all duration-200 hover:shadow-lg hover:scale-[1.01]
      "
    >
      {/* Avatar */}
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
        {profilePicturePath ? (
          <Image
            src={profilePicturePath}
            alt={name}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg font-semibold text-gray-600">
            {initials}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <p className="font-semibold text-gray-800">{name}</p>

        <p className="text-gray-600 text-sm">
          {position || "Recruiter"}
        </p>

        {email && (
          <p className="text-blue-600 text-sm mt-1">
            {email}
          </p>
        )}
      </div>
    </div>
  );
}
