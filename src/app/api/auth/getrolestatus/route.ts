import { getUserWithRoleStatus } from "@/services";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";

    console.log("GET /api/auth/getrolestatus called for userId:", userId);

    const userInfo = await getUserWithRoleStatus(userId);

    return NextResponse.json({ userInfo });
}
