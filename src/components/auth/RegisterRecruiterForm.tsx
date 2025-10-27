'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { AuthActionState } from '@/app/auth-actions'

type RegisterRecruiterFormProps = {
    action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>
}

const initialState: AuthActionState = {}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: pending ? '#94a3b8' : '#0f172a',
                color: '#fff',
                fontWeight: 600,
                borderRadius: '0.5rem',
                border: 'none',
                cursor: pending ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
            }}
        >
            {pending ? 'Setting things up...' : 'Create recruiter account'}
        </button>
    )
}

export function RegisterRecruiterForm({ action }: RegisterRecruiterFormProps) {
    const [state, formAction] = useActionState(action, initialState)

    return (
        <div
            style={{
                maxWidth: 640,
                margin: '0 auto',
                padding: '2.5rem 2rem',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                background: '#fff',
            }}
        >
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                    Register your recruiter account
                </h1>
                <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    Manage jobs, review applicants, and collaborate with hiring teams from a single workspace.
                </p>
            </div>

            {state.error ? (
                <div
                    role="alert"
                    style={{
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.95rem',
                    }}
                >
                    {state.error}
                </div>
            ) : null}

            <form action={formAction} style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                        First name
                        <input
                            name="firstName"
                            type="text"
                            placeholder="Jordan"
                            autoComplete="given-name"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5f5',
                                fontSize: '1rem',
                                background: '#f8fafc',
                            }}
                        />
                    </label>

                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                        Last name
                        <input
                            name="lastName"
                            type="text"
                            placeholder="Taylor"
                            autoComplete="family-name"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5f5',
                                fontSize: '1rem',
                                background: '#f8fafc',
                            }}
                        />
                    </label>
                </div>

                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                    Work email
                    <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        autoComplete="email"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #cbd5f5',
                            fontSize: '1rem',
                            background: '#f8fafc',
                        }}
                    />
                </label>

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                        Password
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5f5',
                                fontSize: '1rem',
                                background: '#f8fafc',
                            }}
                        />
                    </label>

                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                        Confirm password
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={8}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5f5',
                                fontSize: '1rem',
                                background: '#f8fafc',
                            }}
                        />
                    </label>
                </div>

                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                    Company name
                    <input
                        name="companyName"
                        type="text"
                        required
                        placeholder="Acme Inc."
                        autoComplete="organization"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #cbd5f5',
                            fontSize: '1rem',
                            background: '#f8fafc',
                        }}
                    />
                </label>

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                        Industry
                        <input
                            name="companyIndustry"
                            type="text"
                            placeholder="Technology, Retail, Healthcare..."
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5f5',
                                fontSize: '1rem',
                                background: '#f8fafc',
                            }}
                        />
                    </label>

                    <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                        Company website
                        <input
                            name="companyWebsite"
                            type="url"
                            placeholder="https://company.com"
                            autoComplete="url"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5f5',
                                fontSize: '1rem',
                                background: '#f8fafc',
                            }}
                        />
                    </label>
                </div>

                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                    Your role or title
                    <input
                        name="position"
                        type="text"
                        placeholder="Talent Acquisition Lead"
                        autoComplete="organization-title"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #cbd5f5',
                            fontSize: '1rem',
                            background: '#f8fafc',
                        }}
                    />
                </label>

                <SubmitButton />
            </form>

            <p style={{ marginTop: '1.5rem', fontSize: '0.95rem', color: '#475569', textAlign: 'center' }}>
                Looking for opportunities instead?{' '}
                <Link href="/jobseeker/register" style={{ color: '#2563eb', fontWeight: 600 }}>
                    Register as a job seeker
                </Link>
            </p>

            <p style={{ marginTop: '0.75rem', fontSize: '0.95rem', color: '#475569', textAlign: 'center' }}>
                Already onboard?{' '}
                <Link href="/recruiter/login" style={{ color: '#2563eb', fontWeight: 600 }}>
                    Sign in
                </Link>
            </p>
        </div>
    )
}
