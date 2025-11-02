import { getCurrentUser } from "@/services";

export async function GET() {
    // Get current authenticated user with profile data
    const user = await getCurrentUser();

    if (!user) {
        return Response.json({ user: null, error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({ user });
}
