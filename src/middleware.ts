import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole, UserStatus } from "@/types";

export async function middleware(request: NextRequest) {
    return await updateSession(request);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Mirror the pattern: write back to the incoming request + to the outgoing response
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        });

    const { pathname, searchParams } = new URL(request.url);
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

    // ---- Route grouping ---------------------------------
    const isLandingPage = pathname === "/";
    const isAuthRoute = pathname.startsWith("/auth");
    const isJobSeekerRoute = pathname.startsWith("/jobseeker");
    const isRecruiterRoute = pathname.startsWith("/recruiter");
    const isPublicRoute =
        isLandingPage || pathname.startsWith("/_next") || pathname.startsWith("/api");

    // ---- 1) Auth-route early exit like the reference snippet -------------------
    if (isAuthRoute) {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user) {
            // Try to resolve role/status to decide destination; if unknown, fall back to "/"
            const roleStatus = await getRoleStatus(BASE_URL, user.id);
            const role = (roleStatus?.role as UserRole) ?? null;
            const status = (roleStatus?.status as UserStatus) ?? null;

            console.log("Middleware auth route check - user:", user.id, "roleStatus from DB:", roleStatus, "metadata:", user.user_metadata);
            if (status === "active" && role) {
                return NextResponse.redirect(
                    new URL(role === "jobseeker" ? "/jobseeker/dashboard" : "/recruiter/dashboard", BASE_URL)
                );
            }
            // If still onboarding/unknown, keep them on auth flow
        }
        // Return the cookie-plumbed response for other /auth cases
        return supabaseResponse;
    }

    // ---- 2) Public routes: just pass through (like the reference) --------------
    if (isPublicRoute) {
        return supabaseResponse;
    }

    // ---- 3) Protected role routes & onboarding/role enforcement ----------------
    // 3a) Not logged in but hitting protected role areas -> send to role-specific login
    if (isJobSeekerRoute || isRecruiterRoute) {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = isJobSeekerRoute ? "/auth/jobseeker/login" : "/auth/recruiter/login";
            return NextResponse.redirect(url);
        }
        else {
            // Resolve DB-backed role & status via your existing API
            const roleStatus = await getRoleStatus(BASE_URL, user.id);
            const userRole = (roleStatus?.role as UserRole) ?? undefined;
            const userStatus = (roleStatus?.status as UserStatus) ?? null;
            console.log("Middleware protected route check - user:", user.id, "roleStatus from DB:", roleStatus, "final role:", userRole, "final status:", userStatus);

            // Intended role (if status is pending or role missing) -> use metadata fallback
            const intendedRole: UserRole =
                (user.user_metadata?.role as UserRole) ?? "jobseeker";
            const onboardingPath =
                intendedRole === "jobseeker"
                    ? "/auth/jobseeker/onboarding"
                    : "/auth/recruiter/onboarding";

            // 3b) Onboarding gate: pending or missing role -> only allow the onboarding path
            if (userStatus === "pending" || !userRole) {
                if (pathname !== onboardingPath && !isPublicRoute) {
                    const url = request.nextUrl.clone();
                    url.pathname = onboardingPath;
                    return NextResponse.redirect(url);
                }
                return supabaseResponse;
            }

            // 3c) Wrong dashboard/area guard: block cross-role areas
            if (isJobSeekerRoute && userRole !== "jobseeker") {
                const url = request.nextUrl.clone();
                url.pathname = "/auth/jobseeker/login";
                return NextResponse.redirect(url);
            }
            if (isRecruiterRoute && userRole !== "recruiter") {
                const url = request.nextUrl.clone();
                url.pathname = "/auth/recruiter/login";
                return NextResponse.redirect(url);
            }

            // (Optional) If your root "/" should smart-redirect (like noteId logic in the reference),
            // you can send users to their dashboard. Keep it simple & safe:
            if (isLandingPage) {
                const url = request.nextUrl.clone();
                url.pathname = userRole === "recruiter" ? "/recruiter/dashboard" : "/jobseeker/dashboard";
                return NextResponse.redirect(url);
            }
        }

        // Default: return the cookie-aware response (mirrors the reference snippet)
        return supabaseResponse;
    }
}

async function getRoleStatus(
    BASE_URL: string,
    userId: string
): Promise<{ role?: UserRole; status?: UserStatus } | null> {
    try {
        // Expecting it to return something like: { role: "jobseeker" | "recruiter", status: "pending" | "active" | ... }
        const res = await fetch(
            `${BASE_URL}/api/auth/getrolestatus?userId=${encodeURIComponent(userId)}`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        if (!res.ok) return null;

        const data = await res.json();
        return data.userInfo;
    } catch {
        return null;
    }
}