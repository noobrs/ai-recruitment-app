import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { loginRecruiter } from '@/app/auth-actions'

type PageProps = {
    searchParams?: Record<string, string | string[] | undefined>
}

export default function RecruiterLoginPage({ searchParams }: PageProps) {
    const registered = searchParams?.registered === '1'
    const message = registered ? 'Recruiter account created. Sign in to manage your hiring pipeline.' : undefined

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
                title="Sign in as a Recruiter"
                subtitle="Manage job postings, review applicants, and collaborate with your hiring team."
                action={loginRecruiter}
                submitLabel="Sign in"
                switchHref="/recruiter/register"
                switchLabel="Need an account?"
                switchLinkLabel="Register instead"
            />
        </main>
    )
}
