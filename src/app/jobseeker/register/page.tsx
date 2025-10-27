import Link from 'next/link'
import { RegisterJobSeekerForm } from '@/components/auth/RegisterJobSeekerForm'
import { registerJobSeeker } from '@/app/auth-actions'

export default function JobSeekerRegisterPage() {
    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: '#eef2ff',
                padding: '3rem 1rem',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Link href="/" style={{ color: '#312e81', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none' }}>
                    AI Recruitment
                </Link>
            </div>

            <RegisterJobSeekerForm action={registerJobSeeker} />
        </main>
    )
}

