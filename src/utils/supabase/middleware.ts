import { getUserWithRoleStatus } from '@/services'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole, UserStatus } from '@/types'

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
    const pathname = request.nextUrl.pathname
    const isJobSeekerRoute = pathname.startsWith('/jobseeker')
    const isRecruiterRoute = pathname.startsWith('/recruiter')
    const isAuthRoute = pathname.startsWith('/auth')

    const publicPaths = ['/', '/_next', '/api', '/contact-us', '/favicon.ico', '/robots.txt']
    const isPublicRoute = publicPaths.some((p) => pathname.startsWith(p))

    // 1) Always fetch the signed-in user first
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 2) Edge-safe fetch of role & status using THIS supabase client
    let userRole: UserRole | null = null
    let userStatus: UserStatus | null = null
    if (user) {
        const { data: info } = await supabase
            .from('users')
            .select('role,status')
            .eq('id', user.id)
            .maybeSingle()
        userRole = (info?.role as UserRole) ?? null
        userStatus = (info?.status as UserStatus) ?? null
    }

    // Helper: infer intended role when unknown
    const intendedRole: UserRole =
        (user?.user_metadata?.role as UserRole) ??
        (isRecruiterRoute ? 'recruiter' : isJobSeekerRoute ? 'jobseeker' : (userRole ?? 'jobseeker'))

    const onboardingPath =
        intendedRole === 'recruiter'
            ? '/auth/recruiter/onboarding'
            : '/auth/jobseeker/onboarding'

    const dashboardPath =
        userRole === 'recruiter'
            ? '/recruiter/dashboard'
            : '/jobseeker/dashboard'

    // 3) TOP-LEVEL pending redirect: apply on ANY route except the onboarding (and auth verification pages if you have them)
    if (user && (userStatus === 'pending' || !userRole)) {
        const alreadyOnOnboarding = pathname === onboardingPath
        const isVerificationFlow = pathname.startsWith('/auth/verify')

        if (!alreadyOnOnboarding && !isVerificationFlow) {
            const url = request.nextUrl.clone()
            url.pathname = onboardingPath
            return NextResponse.redirect(url)
        }
        // allow onboarding/verification to proceed
        return supabaseResponse
    }

    // Auth area: if already active & has role, push to dashboard
    if (isAuthRoute) {
        if (user && userStatus === 'active' && userRole) {
            const url = request.nextUrl.clone()
            url.pathname = dashboardPath
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // Protected areas: require auth
    if (isJobSeekerRoute || isRecruiterRoute) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = isJobSeekerRoute ? '/auth/jobseeker/login' : '/auth/recruiter/login'
            return NextResponse.redirect(url)
        }

        // Wrong-role guard (user is active here because pending handled above)
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
        return supabaseResponse
    }

    // Public routes
    return supabaseResponse
}