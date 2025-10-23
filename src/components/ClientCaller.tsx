"use client";

import { useState } from "react";

type ApiResponse = {
    error?: string;
    [key: string]: unknown;
} | null;

export default function ClientCaller() {
    const [data, setData] = useState<ApiResponse>(null);
    const [loading, setLoading] = useState(false);

    async function callApi() {
        setLoading(true);
        setData(null);
        try {
            // Calls Vercel serverless function
            const res = await fetch("/api/health", { cache: "no-store" });
            const json = await res.json();
            setData(json);
        } catch (e) {
            setData({ error: String(e) });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <button
                onClick={callApi}
                style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #374151",
                    background: "#111827",
                    color: "white",
                    cursor: "pointer",
                }}
            >
                {loading ? "Calling..." : "Call /api/health"}
            </button>

            {data && (
                <pre
                    style={{
                        marginTop: 12,
                        background: "#111827",
                        color: "#e5e7eb",
                        padding: 12,
                        borderRadius: 8,
                        overflowX: "auto",
                    }}
                >
                    {JSON.stringify(data, null, 2)}
                </pre>
            )}
        </div>
    );
}
