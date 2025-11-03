import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserWithRoleStatus } from "@/services";

export async function middleware(request: NextRequest) {

    const response = NextResponse.next({ request });

    const pathname = new URL(request.url).pathname;

    // Route groups from your updated logic
    const isJobSeekerRoute = pathname.startsWith("/jobseeker");
    const isRecruiterRoute = pathname.startsWith("/recruiter");
    const isAuthRoute = pathname.startsWith("/auth");
    const isLandingPage = pathname === "/";
    const isPublicRoute =
        isLandingPage ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api");

    // Fetch the Supabase user (and keep cookie plumbing identical to your original)
    const user = await getUser(request, response);

    // 1) Allow public routes for everyone
    if (isPublicRoute) {
        return response;
    }

    // 2) If NOT logged in and trying to access protected role routes
    if (!user && (isJobSeekerRoute || isRecruiterRoute)) {
        const url = request.nextUrl.clone();
        url.pathname = isJobSeekerRoute
            ? "/auth/jobseeker/login"
            : "/auth/recruiter/login";
        return NextResponse.redirect(url);
    }

    // 3) If logged in, enforce onboarding, role, and auth-page redirects
    if (user) {
        // Load role & status from your DB
        const userInfo = await getUserWithRoleStatus(user.id);
        const userRole = userInfo?.role as "jobseeker" | "recruiter" | undefined;
        const userStatus = userInfo?.status as "pending" | "active" | undefined;

        // Determine intended role when status pending/missing role
        const intendedRole =
            (user.user_metadata?.role as "jobseeker" | "recruiter" | undefined) ??
            "jobseeker";
        const onboardingPath =
            intendedRole === "jobseeker"
                ? "/auth/jobseeker/onboarding"
                : "/auth/recruiter/onboarding";

        // 3a) Onboarding gate: if pending or no role, only allow onboarding route
        if (userStatus === "pending" || !userRole) {
            if (pathname !== onboardingPath && !isPublicRoute) {
                const url = request.nextUrl.clone();
                url.pathname = onboardingPath;
                return NextResponse.redirect(url);
            }
            return response;
        }

        // 3b) Wrong dashboard guard: block cross-role areas
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

        // 3c) Logged-in users hitting /auth => send to role dashboard (only if onboarded/active)
        if (isAuthRoute && userStatus === "active" && userRole) {
            const url = request.nextUrl.clone();
            url.pathname =
                userRole === "jobseeker"
                    ? "/jobseeker/dashboard"
                    : "/recruiter/dashboard";
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

export async function getUser(request: NextRequest, response: NextResponse) {

    const supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {
        data: { user },
    } = await supabaseClient.auth.getUser()

    return user;
}