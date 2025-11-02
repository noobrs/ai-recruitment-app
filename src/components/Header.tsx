'use client';

import Link from 'next/link';
import { useAuthContext } from '@/hooks';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

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
    const { user, isAuthenticated, isJobSeeker, isRecruiter, loading, signOut } = useAuthContext();
    const pathname = usePathname();
    const router = useRouter();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }

        if (showProfileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showProfileMenu]);

    // Handle sign out
    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

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

                            {/* Profile Picture with Dropdown */}
                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full ${bgColor} text-white font-semibold text-sm hover:opacity-90 transition-opacity`}
                                    aria-label="Profile menu"
                                >
                                    {user?.first_name?.[0]?.toUpperCase() ||
                                        user?.last_name?.[0]?.toUpperCase() ||
                                        'U'}
                                </button>

                                {/* Dropdown Menu */}
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        <Link
                                            href={isJobSeeker ? '/jobseeker/dashboard' : '/recruiter/dashboard'}
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            Dashboard
                                        </Link>
                                        <Link
                                            href={isJobSeeker ? '/jobseeker/profile' : '/recruiter/profile'}
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile
                                        </Link>
                                        <hr className="my-1 border-gray-200" />
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>

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
