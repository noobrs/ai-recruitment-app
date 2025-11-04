'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/hooks';

export default function Footer() {
    const { isJobSeeker, isRecruiter, isAuthenticated } = useAuthContext();
    const pathname = usePathname();

    // Hide footer on auth pages
    if (pathname?.startsWith('/auth')) {
        return null;
    }

    // Role-based colors
    const textColor = isJobSeeker ? 'text-primary' : isRecruiter ? 'text-secondary' : 'text-gray-300';
    const hoverColor = isJobSeeker ? 'hover:text-primary' : isRecruiter ? 'hover:text-secondary' : 'hover:text-white';
    const borderColor = isJobSeeker ? 'border-primary' : isRecruiter ? 'border-secondary' : 'border-gray-700';

    return (
        <footer className="bg-gray-900 text-white border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Info */}
                    <div className="col-span-1 md:col-span-2">
                        <h3 className={`text-xl font-bold mb-4 ${textColor}`}>
                            AI-Powered Recruitment
                        </h3>
                        <p className="text-gray-400 mb-4 leading-relaxed">
                            Empowering job seekers and employers through intelligent matching.
                            Your trusted partner in AI-driven hiring.
                        </p>
                        <div className="flex space-x-4">
                            {[
                                {
                                    label: 'Facebook',
                                    icon: (
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    )
                                },
                                {
                                    label: 'LinkedIn',
                                    icon: (
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                                    )
                                },
                            ].map((social) => (
                                <a
                                    key={social.label}
                                    href="#"
                                    aria-label={social.label}
                                    className={`text-gray-400 ${hoverColor} transition-colors`}
                                >
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        {social.icon}
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>Quick Links</h3>
                        <ul className="space-y-2">
                            {[
                                { href: '/', label: 'Home' },
                                { href: '/jobs', label: 'Jobs' },
                                { href: '/companies', label: 'Companies' },
                                { href: '/about', label: 'About' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={`text-gray-400 ${hoverColor} transition-colors`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>Contact</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li className="flex items-center">
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                contact@aihire.com
                            </li>
                            <li className="flex items-center">
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                                +60 12-345 6789
                            </li>
                            <li className="flex items-center">
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                </svg>
                                Kuala Lumpur, Malaysia
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider & Copyright */}
                <div className={`mt-10 border-t ${borderColor} pt-6 text-center text-sm text-gray-500`}>
                    <p>
                        © {new Date().getFullYear()} AI-Powered Recruitment. All rights reserved.
                    </p>
                    {isAuthenticated && (
                        <p className="mt-1">
                            Logged in as{' '}
                            <span className={`${textColor} font-medium`}>
                                {isJobSeeker ? 'Job Seeker' : isRecruiter ? 'Recruiter' : 'User'}
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </footer>
    );
}
