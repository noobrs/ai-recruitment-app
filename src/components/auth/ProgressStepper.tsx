interface Step {
    label: string;
    status: 'completed' | 'current' | 'upcoming';
}

interface ProgressStepperProps {
    steps: Step[];
}

export default function ProgressStepper({ steps }: ProgressStepperProps) {
    return (
        <div className="w-full mb-8">
            {/* Progress bar */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center flex-1">
                        {/* Step circle */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                                    ${step.status === 'completed' 
                                        ? 'bg-indigo-600 text-white' 
                                        : step.status === 'current'
                                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                        : 'bg-gray-200 text-gray-500'
                                    }
                                    transition-all duration-300
                                `}
                            >
                                {step.status === 'completed' ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </div>
                            <span
                                className={`
                                    mt-2 text-xs font-medium hidden sm:block
                                    ${step.status === 'current' 
                                        ? 'text-indigo-600' 
                                        : step.status === 'completed'
                                        ? 'text-gray-700'
                                        : 'text-gray-400'
                                    }
                                `}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connecting line */}
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-1 mx-2 relative" style={{ top: '-18px' }}>
                                <div
                                    className={`
                                        h-full rounded
                                        ${step.status === 'completed' 
                                            ? 'bg-indigo-600' 
                                            : 'bg-gray-200'
                                        }
                                        transition-all duration-300
                                    `}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Mobile labels */}
            <div className="mt-4 sm:hidden">
                {steps.map((step, index) => (
                    step.status === 'current' && (
                        <p key={index} className="text-sm text-center text-indigo-600 font-medium">
                            Step {index + 1}: {step.label}
                        </p>
                    )
                ))}
            </div>
        </div>
    );
}
