import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Test Page",
};

export default function NestedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <section>{children}</section>;
}
