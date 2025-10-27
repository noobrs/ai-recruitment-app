import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { loginJobSeeker } from '@/app/auth-actions'

type PageProps = {
    searchParams?: Record<string, string | string[] | undefined>
}

export default function JobSeekerLoginPage({ searchParams }: PageProps) {
    const registered = searchParams?.registered === '1'
    const message = registered ? 'Account created. Please sign in to continue.' : undefined

    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: '#f1f5f9',
                padding: '3rem 1rem',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Link href="/" style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none' }}>
                    AI Recruitment
                </Link>
            </div>

            {message ? (
                <div
                    style={{
                        maxWidth: 420,
                        margin: '0 auto 1.5rem auto',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        borderRadius: '0.75rem',
                        border: '1px solid #bbf7d0',
                        textAlign: 'center',
                        fontSize: '0.95rem',
                    }}
                >
                    {message}
                </div>
            ) : null}

            <LoginForm
                title="Sign in as a Job Seeker"
                subtitle="Access personalized job matches, track your applications, and get notified about recruiter feedback."
                action={loginJobSeeker}
                submitLabel="Sign in"
                switchHref="/jobseeker/register"
                switchLabel="Need an account?"
                switchLinkLabel="Register instead"
            />
        </main>
    )
}
