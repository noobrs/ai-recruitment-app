'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type AuthActionState = {
    error?: string
}

function getFormValue(formData: FormData, key: string) {
    const raw = formData.get(key)
    return typeof raw === 'string' ? raw.trim() : ''
}

function getBaseUrl() {
    const url = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_REDIRECT ?? ''
    if (url) {
        return url.endsWith('/') ? url.slice(0, -1) : url
    }
    return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
}

export async function registerJobSeeker(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const email = getFormValue(formData, 'email')
    const password = getFormValue(formData, 'password')
    const confirmPassword = getFormValue(formData, 'confirmPassword')
    const firstName = getFormValue(formData, 'firstName')
    const lastName = getFormValue(formData, 'lastName')
    const aboutMe = getFormValue(formData, 'aboutMe')
    const location = getFormValue(formData, 'location')

    if (!email || !password) {
        return { error: 'Email and password are required.' }
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters.' }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match.' }
    }

    const supabase = await createClient()

    const signUpResult = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${getBaseUrl()}/auth/callback`,
            data: {
                role: 'jobseeker',
                first_name: firstName,
                last_name: lastName,
            },
        },
    })

    if (signUpResult.error) {
        return { error: signUpResult.error.message }
    }

    const user = signUpResult.data.user

    if (!user) {
        return { error: 'Registration succeeded but user information is unavailable. Please verify your email and try signing in.' }
    }

    const profileInsert = await supabase
        .from('users')
        .upsert(
            {
                id: user.id,
                email,
                first_name: firstName || null,
                last_name: lastName || null,
            },
            { onConflict: 'id' },
        )

    if (profileInsert.error) {
        return { error: profileInsert.error.message }
    }

    const jobSeekerInsert = await supabase.from('job_seeker').insert({
        user_id: user.id,
        about_me: aboutMe || null,
        location: location || null,
        status: 'active',
    })

    if (jobSeekerInsert.error) {
        return { error: jobSeekerInsert.error.message }
    }

    revalidatePath('/')
    redirect('/jobseeker/login?registered=1')
}

export async function registerRecruiter(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const email = getFormValue(formData, 'email')
    const password = getFormValue(formData, 'password')
    const confirmPassword = getFormValue(formData, 'confirmPassword')
    const firstName = getFormValue(formData, 'firstName')
    const lastName = getFormValue(formData, 'lastName')
    const position = getFormValue(formData, 'position')
    const companyName = getFormValue(formData, 'companyName')
    const companyIndustry = getFormValue(formData, 'companyIndustry')
    const companyWebsite = getFormValue(formData, 'companyWebsite')

    if (!email || !password || !companyName) {
        return { error: 'Email, password, and company name are required.' }
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters.' }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match.' }
    }

    const supabase = await createClient()

    const signUpResult = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${getBaseUrl()}/auth/callback`,
            data: {
                role: 'recruiter',
                first_name: firstName,
                last_name: lastName,
            },
        },
    })

    if (signUpResult.error) {
        return { error: signUpResult.error.message }
    }

    const user = signUpResult.data.user

    if (!user) {
        return { error: 'Registration succeeded but user information is unavailable. Please verify your email and try signing in.' }
    }

    const profileInsert = await supabase
        .from('users')
        .upsert(
            {
                id: user.id,
                email,
                first_name: firstName || null,
                last_name: lastName || null,
            },
            { onConflict: 'id' },
        )

    if (profileInsert.error) {
        return { error: profileInsert.error.message }
    }

    const companyLookup = await supabase.from('company').select('company_id').eq('comp_name', companyName).maybeSingle()

    if (companyLookup.error) {
        return { error: companyLookup.error.message }
    }

    let companyId = companyLookup.data?.company_id ?? null

    if (!companyId) {
        const companyInsert = await supabase
            .from('company')
            .insert(
                {
                    comp_name: companyName,
                    comp_industry: companyIndustry || null,
                    comp_website: companyWebsite || null,
                }
            )
            .select('company_id')
            .single()

        if (companyInsert.error || !companyInsert.data) {
            return { error: companyInsert.error?.message ?? 'Unable to create company record.' }
        }

        companyId = companyInsert.data.company_id
    }

    const recruiterInsert = await supabase.from('recruiter').insert({
        user_id: user.id,
        company_id: companyId,
        position: position || null,
    })

    if (recruiterInsert.error) {
        return { error: recruiterInsert.error.message }
    }

    revalidatePath('/')
    redirect('/recruiter/login?registered=1')
}

export async function loginJobSeeker(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const email = getFormValue(formData, 'email')
    const password = getFormValue(formData, 'password')

    if (!email || !password) {
        return { error: 'Email and password are required.' }
    }

    const supabase = await createClient()

    const signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (signInResult.error) {
        return { error: signInResult.error.message }
    }

    const user = signInResult.data.user

    if (!user) {
        return { error: 'Unable to load user after login.' }
    }

    const jobSeekerLookup = await supabase
        .from('job_seeker')
        .select('job_seeker_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (jobSeekerLookup.error) {
        await supabase.auth.signOut()
        return { error: jobSeekerLookup.error.message }
    }

    if (!jobSeekerLookup.data) {
        await supabase.auth.signOut()
        return { error: 'No job seeker profile found for this account.' }
    }

    revalidatePath('/')
    redirect('/')
}

export async function loginRecruiter(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const email = getFormValue(formData, 'email')
    const password = getFormValue(formData, 'password')

    if (!email || !password) {
        return { error: 'Email and password are required.' }
    }

    const supabase = await createClient()

    const signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (signInResult.error) {
        return { error: signInResult.error.message }
    }

    const user = signInResult.data.user

    if (!user) {
        return { error: 'Unable to load user after login.' }
    }

    const recruiterLookup = await supabase
        .from('recruiter')
        .select('recruiter_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (recruiterLookup.error) {
        await supabase.auth.signOut()
        return { error: recruiterLookup.error.message }
    }

    if (!recruiterLookup.data) {
        await supabase.auth.signOut()
        return { error: 'No recruiter profile found for this account.' }
    }

    revalidatePath('/')
    redirect('/')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
    redirect('/')
}
