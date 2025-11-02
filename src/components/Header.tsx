'use client';

import Link from 'next/link';
import { useAuthContext } from '@/hooks';
import { usePathname } from 'next/navigation';

/**
 * Header component with two-row layout
 * 
 * First row: App title | Bell icon, Profile picture, Action link
 * Second row: Role-based navigation links (centered)
 * 
 * Role-based styling:
 * - Job Seeker: Primary color (green)
 * - Recruiter: Secondary color (purple)
 */
export default function Header() {
    const { user, isAuthenticated, isJobSeeker, isRecruiter, loading } = useAuthContext();
    const pathname = usePathname();

    // Don't show header on auth pages
    if (pathname?.startsWith('/auth')) {
        return null;
    }

    // Show skeleton header while loading (only on initial load)
    const showSkeleton = loading && !user;

    // Role-based colors
    const textColor = isJobSeeker ? 'text-primary' : isRecruiter ? 'text-secondary' : 'text-gray-700';
    const bgColor = isJobSeeker ? 'bg-primary' : isRecruiter ? 'bg-secondary' : 'bg-gray-300';
    const hoverBg = isJobSeeker ? 'hover:bg-primary/10' : isRecruiter ? 'hover:bg-secondary/10' : 'hover:bg-gray-100';

    // Navigation links based on role
    const navLinks = isJobSeeker
        ? [
            { href: '/jobseeker/jobs', label: 'Jobs' },
            { href: '/jobseeker/companies', label: 'Companies' },
        ]
        : isRecruiter
            ? [
                { href: '/recruiter/posts', label: 'Posts' },
                { href: '/recruiter/jobs', label: 'Jobs' },
                { href: '/recruiter/companies', label: 'Companies' },
            ]
            : [];

    // Action link (top right)
    const actionLink = isJobSeeker
        ? { href: '/auth/recruiter/login', label: 'Employers' }
        : isRecruiter
            ? { href: '/recruiter/jobs/new', label: 'Post a Job' }
            : null;

    // Skeleton header while loading initial auth state
    if (showSkeleton) {
        return (
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            {/* First Row */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: App Title */}
                    <Link href="/" className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-primary">
                            AI-Powered Recruitment
                        </h1>
                    </Link>

                    {/* Right: Notifications, Profile, Action Link */}
                    {isAuthenticated && (
                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <button
                                type="button"
                                aria-label="Notifications"
                                className={`relative p-2 rounded-full ${hoverBg} transition-colors`}
                            >
                                <svg
                                    className={`w-6 h-6 ${textColor}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                {/* Notification badge - you can add count logic later */}
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Profile Picture */}
                            <Link
                                href={isJobSeeker ? '/jobseeker/profile' : '/recruiter/profile'}
                                className={`flex items-center justify-center w-10 h-10 rounded-full ${bgColor} text-white font-semibold text-sm hover:opacity-90 transition-opacity`}
                            >
                                {user?.first_name?.[0]?.toUpperCase() ||
                                    user?.last_name?.[0]?.toUpperCase() ||
                                    'U'}
                            </Link>

                            {/* Action Link */}
                            {actionLink && (
                                <Link
                                    href={actionLink.href}
                                    className={`hidden sm:block px-4 py-2 text-sm font-medium ${textColor} ${hoverBg} rounded-lg transition-colors`}
                                >
                                    {actionLink.label}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Second Row: Navigation Links */}
            {isAuthenticated && navLinks.length > 0 && (
                <div className="border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex items-center justify-center gap-8 h-12">
                            {navLinks.map((link) => {
                                const isActive = pathname?.startsWith(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`text-sm font-medium transition-colors relative ${isActive
                                            ? textColor
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        {link.label}
                                        {isActive && (
                                            <span
                                                className={`absolute -bottom-3 left-0 right-0 h-0.5 ${isJobSeeker ? 'bg-primary' : 'bg-secondary'
                                                    }`}
                                            ></span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
