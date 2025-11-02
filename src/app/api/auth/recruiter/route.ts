import { getCurrentRecruiter } from "@/services";

export async function GET() {
    // Get current recruiter with profile
    const recruiter = await getCurrentRecruiter();

    if (!recruiter) {
        return Response.json(
            { recruiter: null, error: "Not authenticated or not a recruiter" },
            { status: 401 }
        );
    }

    return Response.json({ recruiter });
}
