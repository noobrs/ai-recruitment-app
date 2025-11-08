"use client";

import { Check, X } from "lucide-react";

export interface PasswordChecks {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
}

export const validatePasswordStrength = (password: string): PasswordChecks => {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
};

export const isPasswordStrong = (checks: PasswordChecks): boolean => {
    return Object.values(checks).filter(Boolean).length >= 4;
};

interface PasswordRequirementsProps {
    password: string;
    checks?: PasswordChecks;
    show?: boolean;
}

export default function PasswordRequirements({
    password,
    checks: externalChecks,
    show = true
}: PasswordRequirementsProps) {
    const checks = externalChecks || validatePasswordStrength(password);
    const strong = isPasswordStrong(checks);

    if (!show || password.length === 0) {
        return null;
    }

    return (
        <div className="mt-2 p-3 bg-neutral-50 rounded-lg text-xs space-y-1">
            <p className="font-medium text-neutral-700 mb-2">Password requirements:</p>
            <PasswordRequirement met={checks.length} text="At least 8 characters" />
            <PasswordRequirement met={checks.uppercase} text="Contains uppercase letter" />
            <PasswordRequirement met={checks.lowercase} text="Contains lowercase letter" />
            <PasswordRequirement met={checks.number} text="Contains number" />
            <PasswordRequirement met={checks.special} text="Contains special character" />
            {/* <p className="text-neutral-500 mt-2 pt-2 border-t border-neutral-200">
                {strong ? "✓ Strong password" : "Meet at least 4 requirements"}
            </p> */}
        </div>
    );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-2 ${met ? 'text-green-600' : 'text-neutral-400'}`}>
            {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            <span>{text}</span>
        </div>
    );
}
