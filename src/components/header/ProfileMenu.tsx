"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { BaseUser } from "@/types";
import SignOutButton from "@/components/header/SignOutButton";

type Props = {
    user: BaseUser;
    theme: { text: string; bg: string };
};

export default function ProfileMenu({ user, theme }: Props) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isJobSeeker = user.role === "jobseeker";

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    const initials =
        user.first_name?.[0]?.toUpperCase() ||
        user.last_name?.[0]?.toUpperCase() ||
        "U";

    return (
        <div className="relative" ref={mounted ? ref : null}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold text-sm hover:opacity-90 transition-opacity overflow-hidden ${!user.profile_picture_path ? 'bg-gray-600' : 'border-2 border-white'}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Profile menu"
            >
                {user.profile_picture_path ? (
                    <Image
                        src={user.profile_picture_path}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    initials
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                >
                    <Link
                        href={isJobSeeker ? "/jobseeker/profile" : "/recruiter/profile"}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                    </Link>

                    <Link
                        href="/notifications"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Notifications
                    </Link>

                    <Link
                        href="/auth/change-password"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Change Password
                    </Link>

                    <hr className="my-1 border-gray-200" />
                    <div className="px-2">
                        <SignOutButton />
                    </div>
                </div>
            )}
        </div>
    );
}
