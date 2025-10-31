import { getUserWithRoleStatus } from '@/services/user.service'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Get the user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Define protected routes
    const isJobSeekerRoute = pathname.startsWith('/jobseeker')
    const isRecruiterRoute = pathname.startsWith('/recruiter')
    const isAuthRoute = pathname.startsWith('/auth')
    const isLandingPage = pathname === '/'
    const isPublicRoute = isLandingPage || pathname.startsWith('/_next') || pathname.startsWith('/api')

    // Allow public routes for everyone
    if (isPublicRoute) {
        return supabaseResponse
    }

    // If user is not logged in and trying to access protected routes
    if (!user && (isJobSeekerRoute || isRecruiterRoute)) {
        const url = request.nextUrl.clone()

        if (isJobSeekerRoute) {
            url.pathname = '/auth/jobseeker/login'
        } else if (isRecruiterRoute) {
            url.pathname = '/auth/recruiter/login'
        }

        return NextResponse.redirect(url)
    }

    // If user is logged in
    if (user) {
        // Get user role and status from database
        const userInfo = await getUserWithRoleStatus(user.id)
        const userRole = userInfo?.role
        const userStatus = userInfo?.status

        // Check if user needs to complete onboarding
        if (userStatus === 'pending' || !userRole) {
            // User hasn't completed onboarding
            const intendedRole = user.user_metadata?.role || 'jobseeker'
            const onboardingPath = intendedRole === 'jobseeker'
                ? '/auth/jobseeker/onboarding'
                : '/auth/recruiter/onboarding'

            // Allow access to onboarding page
            if (pathname === onboardingPath) {
                return supabaseResponse
            }

            // Redirect to onboarding if trying to access other routes
            if (!isAuthRoute && !isPublicRoute) {
                const url = request.nextUrl.clone()
                url.pathname = onboardingPath
                return NextResponse.redirect(url)
            }
        }

        // Redirect if accessing wrong dashboard
        if (isJobSeekerRoute && userRole !== 'jobseeker') {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/jobseeker/login'
            return NextResponse.redirect(url)
        }

        if (isRecruiterRoute && userRole !== 'recruiter') {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/recruiter/login'
            return NextResponse.redirect(url)
        }

        // Redirect logged-in users away from auth pages to their dashboard (only if onboarded)
        if (isAuthRoute && userStatus === 'active' && userRole) {
            const url = request.nextUrl.clone()
            url.pathname = userRole === 'jobseeker'
                ? '/jobseeker/dashboard'
                : '/recruiter/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}