"use client";

import Link from "next/link";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import type { BaseUser, Notification } from "@/types";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from "react";

type Props = {
    user: BaseUser | null;
    actionLink: { href: string; label: string } | null;
    theme: { text: string; bg: string; hoverChip: string; underline: string };
    notificationData: {
        unreadCount: number;
        recentNotifications: Notification[];
    } | null;
};

export default function HeaderState({ user, actionLink, theme, notificationData }: Props) {
    const pathname = usePathname();

    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // On first client render, DON'T hide (match SSR). Hide only after mount.
    const shouldHide = mounted && pathname?.startsWith("/auth");

    if (shouldHide) return null;

    return (
        <>
            {/* Right section of first row */}
            {user ? (
                <div className="flex items-center gap-4">
                    {notificationData && (
                        <NotificationBell
                            userId={user.id}
                            initialUnreadCount={notificationData.unreadCount}
                            hoverClass={theme.hoverChip}
                            iconClass={theme.text}
                        />
                    )}

                    <ProfileMenu user={user} theme={theme} />

                    {actionLink && (
                        <Link
                            href={actionLink.href}
                            className={`hidden sm:block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme.text} ${theme.hoverChip}`}
                        >
                            {actionLink.label}
                        </Link>
                    )}
                </div>
            ) : (
                // not logged in: you can show login/register here if you like
                <div className="flex items-center gap-2">
                    <Link href="/auth/login" className="text-sm text-gray-700 hover:text-gray-900">
                        Log in
                    </Link>
                    <Link
                        href="/auth/register"
                        className="text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:opacity-90"
                    >
                        Get started
                    </Link>
                </div>
            )}
        </>
    );
}
