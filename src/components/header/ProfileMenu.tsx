"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { BaseUser } from "@/types";
import SignOutButton from "@/components/header/SignOutButton";

type Props = {
    user: BaseUser;
    theme: { text: string; bg: string };
};

export default function ProfileMenu({ user, theme }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isJobSeeker = user.role === "jobseeker";

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
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold text-sm hover:opacity-90 transition-opacity ${theme.bg}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Profile menu"
            >
                {initials}
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                >
                    <Link
                        href={isJobSeeker ? "/jobseeker/dashboard" : "/recruiter/dashboard"}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                    </Link>

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

                    <hr className="my-1 border-gray-200" />
                    <div className="px-2">
                        <SignOutButton />
                    </div>
                </div>
            )}
        </div>
    );
}
