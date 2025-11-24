import type { Metadata } from 'next'
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
    title: '404 - Page Not Found',
    description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
    return (
        <html lang="en">
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center px-4">
                        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            Page Not Found
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Sorry, we couldn&apos;t find the page you&apos;re looking for.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link
                                href="/"
                                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
