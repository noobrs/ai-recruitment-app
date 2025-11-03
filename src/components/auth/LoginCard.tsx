import { PropsWithChildren } from "react";

export default function LoginCard({ children, title }: PropsWithChildren<{ title: string }>) {
    return (
        <div className="glass p-6 sm:p-8">
            <h1 className="text-2xl font-semibold text-neutral-900 text-center mb-6">
                {title}
            </h1>
            {children}
        </div>
    );
}
