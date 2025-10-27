'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { AuthActionState } from '@/app/auth-actions'

type LoginFormProps = {
    title: string
    subtitle?: string
    action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>
    submitLabel?: string
    switchHref: string
    switchLabel: string
    switchLinkLabel?: string
}

const initialState: AuthActionState = {}

function SubmitButton({ label }: { label: string }) {
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
            {pending ? 'Please wait...' : label}
        </button>
    )
}

export function LoginForm({
    title,
    subtitle,
    action,
    submitLabel = 'Sign in',
    switchHref,
    switchLabel,
    switchLinkLabel = 'Create one',
}: LoginFormProps) {
    const [state, formAction] = useActionState(action, initialState)

    return (
        <div
            style={{
                maxWidth: 420,
                margin: '0 auto',
                padding: '2.5rem 2rem',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                background: '#fff',
            }}
        >
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>{title}</h1>
                {subtitle ? <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '0.95rem' }}>{subtitle}</p> : null}
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
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                    Email
                    <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
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

                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem', color: '#0f172a' }}>
                    Password
                    <input
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        placeholder="Your password"
                        autoComplete="current-password"
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

                <SubmitButton label={submitLabel} />
            </form>

            <p style={{ marginTop: '1.5rem', fontSize: '0.95rem', color: '#475569', textAlign: 'center' }}>
                {switchLabel}{' '}
                <Link href={switchHref} style={{ color: '#2563eb', fontWeight: 600 }}>
                    {switchLinkLabel}
                </Link>
            </p>
        </div>
    )
}
