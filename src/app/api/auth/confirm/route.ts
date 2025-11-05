import { type EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/'
    const redirectTo = request.nextUrl.clone()
    redirectTo.pathname = next

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            return NextResponse.redirect(redirectTo)
        }
    }

    // return the user to an error page with some instructions
    redirectTo.pathname = '/auth/auth-code-error'
    return NextResponse.redirect(redirectTo)
}

// import { type EmailOtpType } from '@supabase/supabase-js'
// import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@/utils/supabase/server'

// /*
// * Reset Password or Email Confirmation Handler
// */
// export async function GET(request: NextRequest) {
//     const { searchParams } = new URL(request.url)
//     const token_hash = searchParams.get('token_hash')
//     const type = searchParams.get('type') as EmailOtpType | null
//     const next = searchParams.get('next') ?? '/'
//     const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
//     const redirectTo = request.nextUrl.clone()
//     redirectTo.pathname = next

//     if (token_hash && type) {
//         const supabase = await createClient()

//         // Special handling for password recovery
//         if (type === 'recovery') {
//             const { error } = await supabase.auth.verifyOtp({
//                 type,
//                 token_hash,
//             })

//             if (error) {
//                 console.error('Password recovery verification error:', error)
//                 // Redirect to error page with context
//                 return NextResponse.redirect(
//                     new URL(`/auth/verify/error?reason=${encodeURIComponent(error.message)}`, origin)
//                 )
//             }

//             // Successfully verified - user is now authenticated but MUST reset password
//             // Add a flag to indicate password reset is required
//             const response = NextResponse.redirect(new URL('/auth/reset-password', origin))
//             response.cookies.set('password_reset_required', 'true', {
//                 httpOnly: true,
//                 secure: process.env.NODE_ENV === 'production',
//                 sameSite: 'lax',
//                 maxAge: 600, // 10 minutes to complete password reset
//                 path: '/'
//             })
//             return response
//         }

//         // Handle other OTP types (signup, etc.)
//         const { error } = await supabase.auth.verifyOtp({
//             type,
//             token_hash,
//         })

//         if (!error) {
//             return NextResponse.redirect(redirectTo)
//         }

//         console.error('OTP verification error:', error)
//         // Redirect to error page with context
//         return NextResponse.redirect(
//             new URL(`/auth/verify/error?reason=${encodeURIComponent(error.message)}`, origin)
//         )
//     }

//     // Missing required parameters
//     return NextResponse.redirect(
//         new URL('/auth/verify/error?reason=Invalid verification link', origin)
//     )
// }