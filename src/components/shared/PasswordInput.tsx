'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    showIcon?: boolean;
    error?: string;
    success?: string;
    ref?: React.Ref<HTMLInputElement>; // new in React 19
}

export default function PasswordInput({
    label,
    showIcon = true,
    error,
    success,
    className = '',
    ref,
    ...props
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <label className="block">
            {label && (
                <span className="mb-1 block text-sm text-neutral-700">{label}</span>
            )}
            <div className="relative">
                {showIcon && (
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                )}
                <input
                    ref={ref}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full rounded-lg border border-neutral-200 bg-white/70 ${showIcon ? 'pl-10' : 'pl-3'
                        } pr-10 py-2 outline-none focus:ring-2 focus:ring-neutral-900 ${className}`}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            {success && <p className="mt-1 text-xs text-green-600">{success}</p>}
        </label>
    );
}
