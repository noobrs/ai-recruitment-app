import ButtonFilledBlack from '@/components/shared/buttons/ButtonFilledBlack';

interface SuccessConfirmationProps {
    jobTitle: string;
    onNavigateBack: () => void;
}

/**
 * SuccessConfirmation - Displays application submission success message
 */
export default function SuccessConfirmation({
    jobTitle,
    onNavigateBack
}: SuccessConfirmationProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-10">
            <h1 className="text-3xl font-bold text-green-600 mb-3">
                🎉 Application Submitted!
            </h1>

            <p className="text-gray-600 mb-6">
                Thank you for applying for {jobTitle}.
            </p>

            <ButtonFilledBlack
                text="Back to Job Listings"
                className="px-6 py-3"
                onClick={onNavigateBack}
            />
        </div>
    );
}
