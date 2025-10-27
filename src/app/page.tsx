import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { logout } from './auth-actions'

type HealthResponse = {
    ok: boolean
    service: string
}

type UserContext = {
    userId: string | null
    email: string | null
    name: string | null
    role: 'jobseeker' | 'recruiter' | null
}

async function getHealth(): Promise<HealthResponse | null> {
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ai-recruitment-app-pi.vercel.app')

    try {
        const res = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' })
        if (!res.ok) {
            return null
        }
        return (await res.json()) as HealthResponse
    } catch (error) {
        console.error('Unable to reach /api/health', error)
        return null
    }
}

async function getUserContext(): Promise<UserContext> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { userId: null, email: null, name: null, role: null }
    }

    const profileResult = await supabase.from('users').select('first_name, last_name, email').eq('id', user.id).maybeSingle()
    const firstName = profileResult.data?.first_name ?? null
    const lastName = profileResult.data?.last_name ?? null
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || null
    const email = profileResult.data?.email ?? user.email ?? null

    const jobSeekerResult = await supabase.from('job_seeker').select('job_seeker_id').eq('user_id', user.id).maybeSingle()
    if (jobSeekerResult.data) {
        return { userId: user.id, email, name: displayName, role: 'jobseeker' }
    }

    const recruiterResult = await supabase.from('recruiter').select('recruiter_id').eq('user_id', user.id).maybeSingle()
    if (recruiterResult.data) {
        return { userId: user.id, email, name: displayName, role: 'recruiter' }
    }

    return { userId: user.id, email, name: displayName, role: null }
}

export default async function Home() {
    const [health, user] = await Promise.all([getHealth(), getUserContext()])
    const isSignedIn = Boolean(user.userId)
    const greetingName = user.name ?? user.email ?? 'there'

    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem',
                padding: '3rem 1.25rem 4rem 1.25rem',
                background: '#f8fafc',
                fontFamily: 'ui-sans-serif, system-ui, -apple-system',
            }}
        >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
                <Link href="/" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}>
                    AI Recruitment
                </Link>
                {isSignedIn ? (
                    <form action={logout}>
                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1.2rem',
                                backgroundColor: '#0f172a',
                                color: '#fff',
                                borderRadius: '999px',
                                border: 'none',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Sign out
                        </button>
                    </form>
                ) : (
                    <nav style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Link href="/jobseeker/login" style={{ color: '#2563eb', fontWeight: 600 }}>
                            Job seeker login
                        </Link>
                        <Link href="/recruiter/login" style={{ color: '#0f172a', fontWeight: 600 }}>
                            Recruiter login
                        </Link>
                    </nav>
                )}
            </header>

            <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div
                    style={{
                        padding: '2.5rem',
                        borderRadius: '1.25rem',
                        border: '1px solid #e2e8f0',
                        background: '#0f172a',
                        color: '#fff',
                        boxShadow: '0 15px 35px rgba(15, 23, 42, 0.25)',
                    }}
                >
                    <p style={{ fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#cbd5f5' }}>AI powered hiring</p>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.2, marginTop: '1rem' }}>
                        Match top talent with the right role in minutes, not weeks.
                    </h1>
                    <p style={{ marginTop: '1.25rem', fontSize: '1rem', lineHeight: 1.7, color: '#e2e8f0' }}>
                        Our platform analyzes resumes, highlights the best-fit applicants, and keeps both recruiters and job seekers in sync through
                        the entire hiring journey.
                    </p>
                    {!isSignedIn ? (
                        <div style={{ marginTop: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <Link
                                href="/jobseeker/register"
                                style={{
                                    padding: '0.75rem 1.4rem',
                                    backgroundColor: '#38bdf8',
                                    color: '#0f172a',
                                    fontWeight: 700,
                                    borderRadius: '999px',
                                    textDecoration: 'none',
                                }}
                            >
                                Join as job seeker
                            </Link>
                            <Link
                                href="/recruiter/register"
                                style={{
                                    padding: '0.75rem 1.4rem',
                                    backgroundColor: '#fff',
                                    color: '#0f172a',
                                    fontWeight: 700,
                                    borderRadius: '999px',
                                    textDecoration: 'none',
                                }}
                            >
                                Hire with us
                            </Link>
                        </div>
                    ) : (
                        <div style={{ marginTop: '1.75rem', fontSize: '1rem', lineHeight: 1.6 }}>
                            <p style={{ marginBottom: '0.5rem' }}>Welcome back, {greetingName}.</p>
                            {user.role ? (
                                <p>Your account is set up as a {user.role === 'jobseeker' ? 'job seeker' : 'recruiter'}.</p>
                            ) : (
                                <p>Your account is created. Complete your profile to unlock tailored experiences.</p>
                            )}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: '2.5rem',
                        borderRadius: '1.25rem',
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                    }}
                >
                    <div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>System status</h2>
                        <p style={{ color: '#475569', fontSize: '0.95rem', marginTop: '0.4rem' }}>
                            Latest health check from the FastAPI service powering resume intelligence.
                        </p>
                    </div>

                    <div
                        style={{
                            borderRadius: '1rem',
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            padding: '1.25rem',
                            fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas',
                        }}
                    >
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {JSON.stringify(health ?? { ok: false, service: 'unavailable' }, null, 2)}
                        </pre>
                    </div>

                    <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>
                        <p>
                            Looking for the admin views?{' '}
                            <Link href="/recruiter/login" style={{ color: '#2563eb', fontWeight: 600 }}>
                                Sign in to the recruiter portal
                            </Link>{' '}
                            to manage job postings and review applications.
                        </p>
                        <p style={{ marginTop: '0.75rem' }}>
                            Job seekers can{' '}
                            <Link href="/jobseeker/login" style={{ color: '#2563eb', fontWeight: 600 }}>
                                sign in here
                            </Link>{' '}
                            to track applications, upload resumes, and receive real-time notifications.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}

