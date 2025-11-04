import Link from 'next/link';
import { AlertCircle, RotateCcw, Mail } from 'lucide-react';
import { isValidRole } from '@/utils/utils';
import type { UserRole } from '@/types';

export default async function VerificationErrorPage({
    params,
    searchParams,
}: {
    params: Promise<{ role: string }>;
    searchParams: Promise<{ reason?: string; email?: string }>;
}) {
    const { role: rawRole } = await params;
    const { reason, email } = await searchParams;

    const role: UserRole = isValidRole(rawRole) ? rawRole : 'jobseeker';

    const getErrorMessage = (errorReason?: string) => {
        if (!errorReason) return 'An unexpected error occurred during verification.';

        if (errorReason.includes('expired') || errorReason.includes('Token')) {
            return 'Your verification link has expired. Please request a new one.';
        }

        if (errorReason.includes('invalid')) {
            return 'This verification link is invalid. Please request a new one.';
        }

        if (errorReason.includes('already')) {
            return 'This email has already been verified. You can log in now.';
        }

        return errorReason;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-neutral-50 to-neutral-100 p-4">
            <div className="mx-auto max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Error Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="h-10 w-10 text-red-600" />
                            </div>
                        </div>
                    </div>

                    {/* Error Title */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-neutral-900">
                            Verification Failed
                        </h1>
                        <p className="text-neutral-600">
                            {getErrorMessage(reason)}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4">
                        {email ? (
                            <Link
                                href={`/auth/verify/${role}?email=${encodeURIComponent(email)}`}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                            >
                                <Mail className="h-4 w-4" />
                                Request New Verification Email
                            </Link>
                        ) : (
                            <Link
                                href={`/auth/${role}/register`}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Back to Registration
                            </Link>
                        )}

                        <Link
                            href={`/auth/${role}/login`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-neutral-200 text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                        >
                            Already verified? Login
                        </Link>
                    </div>

                    {/* Help Text */}
                    <div className="pt-4 border-t border-neutral-200">
                        <details className="text-sm text-neutral-600">
                            <summary className="cursor-pointer hover:text-neutral-900 font-medium">
                                Need help?
                            </summary>
                            <ul className="mt-2 space-y-1 list-disc list-inside text-neutral-600">
                                <li>Verification links expire after 24 hours</li>
                                <li>Make sure you&apos;re using the latest link from your email</li>
                                <li>Check your spam folder for the verification email</li>
                                <li>Contact support if the problem persists</li>
                            </ul>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}
