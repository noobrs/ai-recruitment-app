import { getCurrentJobSeeker } from "@/services";

export async function GET() {
    // Get current job seeker with profile
    const jobSeeker = await getCurrentJobSeeker();

    if (!jobSeeker) {
        return Response.json(
            { jobSeeker: null, error: "Not authenticated or not a job seeker" },
            { status: 401 }
        );
    }

    return Response.json({ jobSeeker });
}
