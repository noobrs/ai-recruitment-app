'use client';

import { useRouter } from 'next/navigation';
import ButtonFilledPrimary from '@/components/shared/buttons/ButtonFilledPrimary';

interface JobApplyActionProps {
  jobId: string | number;
}

export default function JobApplyAction({ jobId }: JobApplyActionProps) {
  const router = useRouter();

  const handleApply = () => {
    router.push(`/job/apply/${jobId}`);
  };

  return (
    <ButtonFilledPrimary
      text="Apply Now"
      onClick={handleApply}
      className="w-32 h-10 bg-primary"
    />
  );
}
