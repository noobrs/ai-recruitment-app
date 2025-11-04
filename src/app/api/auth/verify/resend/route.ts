import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
    const form = await req.formData()
    const email = String(form.get('email') ?? '')
    const role = String(form.get('role') ?? '')
    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
            emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
        },
    })

    if (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
}
