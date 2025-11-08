'use client';

import { useState } from 'react';
import { UserRole } from '@/types';
import RoleSelection from '@/components/auth/onboarding/RoleSelection';
import JobSeekerOnboarding from '@/components/auth/onboarding/JobSeekerOnboarding';
import RecruiterOnboarding from '@/components/auth/onboarding/RecruiterOnboarding';
import ProgressBar from '@/components/auth/onboarding/ProgressBar';

interface OnboardingClientProps {
    userId: string;
    email: string;
    defaultFirstName: string;
    defaultLastName: string;
    currentRole: UserRole | null;
}

export default function OnboardingClient({
    userId,
    email,
    defaultFirstName,
    defaultLastName,
    currentRole,
}: OnboardingClientProps) {
    const [step, setStep] = useState(currentRole ? 2 : 1);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(currentRole);

    const handleRoleSelected = (role: UserRole) => {
        setSelectedRole(role);
        setStep(2);
    };

    const getTotalSteps = () => {
        return 2; // Role selection + Profile setup
    };

    const getStepLabel = () => {
        if (step === 1) return 'Choose Your Role';
        if (step === 2 && selectedRole === 'jobseeker') return 'Job Seeker Profile';
        if (step === 2 && selectedRole === 'recruiter') return 'Recruiter Profile';
        return '';
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-center text-neutral-900 mb-2">
                        Welcome to AI Recruitment
                    </h1>
                    <p className="text-center text-neutral-600 mb-6">
                        Let&apos;s set up your profile
                    </p>
                    <ProgressBar
                        currentStep={step}
                        totalSteps={getTotalSteps()}
                        stepLabel={getStepLabel()}
                    />
                </div>

                <div className="glass p-6 sm:p-8">
                    {step === 1 && (
                        <RoleSelection onRoleSelected={handleRoleSelected} />
                    )}
                    {step === 2 && selectedRole === 'jobseeker' && (
                        <JobSeekerOnboarding
                            userId={userId}
                            email={email}
                            defaultFirstName={defaultFirstName}
                            defaultLastName={defaultLastName}
                        />
                    )}
                    {step === 2 && selectedRole === 'recruiter' && (
                        <RecruiterOnboarding
                            userId={userId}
                            email={email}
                            defaultFirstName={defaultFirstName}
                            defaultLastName={defaultLastName}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
