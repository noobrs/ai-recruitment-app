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
    // --- Fast exits for assets & public infrastructure ---
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/') ||                    // keep API free (adjust if needed)
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt' ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js')
    ) {
        return supabaseResponse
    }

    // Define "public" routes you want available to everyone
    const PUBLIC_PATHS = new Set<string>([
        '/', '/contact-us',
        '/auth/login', '/auth/register', '/auth/forgot-password',
        '/auth/verify',               // if you have verification routes under here
        '/auth/reset-password'        // IMPORTANT: allow this explicitly
    ])
    const isPublicRoute =
        PUBLIC_PATHS.has(pathname) || // exact matches
        pathname.startsWith('/auth/verify') // e.g. /auth/verify/[role]?token=...

    const isJobSeekerRoute = pathname.startsWith('/jobseeker')
    const isRecruiterRoute = pathname.startsWith('/recruiter')
    const isAuthRoute = pathname.startsWith('/auth')
    const isResetPasswordPage = pathname === '/auth/reset-password'

    // 1) Get user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 2) Get role/status (edge-safe, same client)
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

    // 3) RESET MODE: lock user to public + reset page only
    const isReset = user?.user_metadata?.reset_password === true

    if (user && isReset) {
        // Allow only: public pages and the reset page
        if (isResetPasswordPage) {
            return supabaseResponse
        }
        // Everything else -> bounce to reset page
        const url = request.nextUrl.clone()
        url.pathname = '/auth/reset-password'
        return NextResponse.redirect(url)
    }

    // 4) Pending users go to onboarding (unless on onboarding/verification)
    const onboardingPath = '/auth/onboarding'
    if (user && userStatus === 'pending') {
        const alreadyOnOnboarding = pathname === onboardingPath
        const isVerificationFlow = pathname.startsWith('/auth/verify')
        if (!alreadyOnOnboarding && !isVerificationFlow) {
            const url = request.nextUrl.clone()
            url.pathname = onboardingPath
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // 5) Auth area: if fully active + has role, send to dashboard (but only if not reset mode; handled above)
    const dashboardPath =
        userRole === 'recruiter' ? '/recruiter/dashboard' : '/jobseeker/dashboard'

    if (isAuthRoute) {
        if (user && userStatus === 'active' && userRole) {
            const url = request.nextUrl.clone()
            url.pathname = dashboardPath
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // 6) Protected areas: require auth and correct role
    if (isJobSeekerRoute || isRecruiterRoute) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
        if (isJobSeekerRoute && userRole !== 'jobseeker') {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
        if (isRecruiterRoute && userRole !== 'recruiter') {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // 7) Public routes pass through
    return supabaseResponse
}