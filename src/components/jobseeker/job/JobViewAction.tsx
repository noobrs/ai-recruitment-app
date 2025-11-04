'use client';

import { useRouter } from 'next/navigation';

interface JobViewActionProps {
  jobId: string | number;
}

export default function JobViewAction({ jobId }: JobViewActionProps) {
  const router = useRouter();

  const handleView = () => {
    router.push(`/job/view/${jobId}`);
  };

  return (
    <button
      onClick={handleView}
      aria-label="View Job"
      className="transition hover:opacity-80"
    >
      <img src="/expand.svg" alt="Expand" className="w-7 h-7" />
    </button>
  );
}
