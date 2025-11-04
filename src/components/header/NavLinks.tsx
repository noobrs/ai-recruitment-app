"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
    navLinks: { href: string; label: string }[];
    underlineClass: string;
    activeTextClass: string;
};

export default function NavLinks({ navLinks, underlineClass, activeTextClass }: Props) {
    const pathname = usePathname();

    return (
        <div className="border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex items-center justify-center gap-8 h-12">
                    {navLinks.map((link) => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium transition-colors relative ${isActive ? activeTextClass : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {link.label}
                                {isActive && (
                                    <span className={`absolute -bottom-3 left-0 right-0 h-0.5 ${underlineClass}`} />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
