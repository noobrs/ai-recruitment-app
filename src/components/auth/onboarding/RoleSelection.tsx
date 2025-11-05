'use client';

import { useState } from 'react';
import { UserRole } from '@/types';
import { Briefcase, UserRound } from 'lucide-react';

interface RoleSelectionProps {
    onRoleSelected: (role: UserRole) => void;
}

export default function RoleSelection({ onRoleSelected }: RoleSelectionProps) {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    const handleRoleClick = (role: UserRole) => {
        setSelectedRole(role);
    };

    const handleContinue = () => {
        if (selectedRole) {
            onRoleSelected(selectedRole);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                    Choose Your Role
                </h2>
                <p className="text-neutral-600">
                    Select how you&apos;ll be using the platform
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Job Seeker Option */}
                <button
                    type="button"
                    onClick={() => handleRoleClick('jobseeker')}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${selectedRole === 'jobseeker'
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-neutral-200 hover:border-primary/50 hover:bg-neutral-50'
                        }`}
                >
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div
                            className={`p-4 rounded-full ${selectedRole === 'jobseeker'
                                    ? 'bg-primary text-white'
                                    : 'bg-neutral-100 text-neutral-700'
                                }`}
                        >
                            <UserRound className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                                Job Seeker
                            </h3>
                            <p className="text-sm text-neutral-600">
                                I&apos;m looking for job opportunities
                            </p>
                        </div>
                    </div>
                </button>

                {/* Recruiter Option */}
                <button
                    type="button"
                    onClick={() => handleRoleClick('recruiter')}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${selectedRole === 'recruiter'
                            ? 'border-secondary bg-secondary/5 shadow-md'
                            : 'border-neutral-200 hover:border-secondary/50 hover:bg-neutral-50'
                        }`}
                >
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div
                            className={`p-4 rounded-full ${selectedRole === 'recruiter'
                                    ? 'bg-secondary text-white'
                                    : 'bg-neutral-100 text-neutral-700'
                                }`}
                        >
                            <Briefcase className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                                Recruiter
                            </h3>
                            <p className="text-sm text-neutral-600">
                                I&apos;m hiring for my company
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedRole}
                className="w-full rounded-lg bg-neutral-900 text-white py-3 font-medium hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
                Continue
            </button>
        </div>
    );
}
