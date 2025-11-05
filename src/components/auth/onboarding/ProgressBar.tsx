'use client';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    stepLabel: string;
}

export default function ProgressBar({ currentStep, totalSteps, stepLabel }: ProgressBarProps) {
    const percentage = (currentStep / totalSteps) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">{stepLabel}</span>
                <span className="text-sm text-neutral-500">
                    Step {currentStep} of {totalSteps}
                </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2.5">
                <div
                    className="bg-neutral-900 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}
