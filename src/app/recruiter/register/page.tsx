import Link from 'next/link'
import { RegisterRecruiterForm } from '@/components/auth/RegisterRecruiterForm'
import { registerRecruiter } from '@/app/auth-actions'

export default function RecruiterRegisterPage() {
    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: '#e0f2fe',
                padding: '3rem 1rem',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Link href="/" style={{ color: '#0c4a6e', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none' }}>
                    AI Recruitment
                </Link>
            </div>

            <RegisterRecruiterForm action={registerRecruiter} />
        </main>
    )
}

