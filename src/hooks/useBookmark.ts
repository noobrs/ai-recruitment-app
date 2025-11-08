"use client";

import { useState } from "react";
import { toggleBookmark } from "@/app/jobseeker/jobs/actions";

export function useBookmark() {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  /**
   * Toggles a bookmark for a given job & job seeker.
   */
  const toggle = async (jobSeekerId: number, jobId: number) => {
    setLoadingId(jobId);
    try {
      const result = await toggleBookmark(jobSeekerId, jobId);

      if (!result.success) {
        console.error("Bookmark toggle failed:", result.error);
        return { success: false, error: result.error };
      }

      return { success: true, is_bookmark: result.is_bookmark };
    } catch (err) {
      console.error("Bookmark error:", err);
      return { success: false, error: (err as Error).message };
    } finally {
      setLoadingId(null);
    }
  };

  return { toggle, loadingId };
}
