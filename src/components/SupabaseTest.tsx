"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type SupabaseData = Record<string, unknown>[] | null;

export default function SupabaseTest() {
    const [data, setData] = useState<SupabaseData>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function testSupabase() {
        setLoading(true);
        setError(null);
        try {
            // Example: Test connection by querying a table
            // Replace 'your_table_name' with an actual table from your database
            const { data, error } = await supabase
                .from('your_table_name')
                .select('*')
                .limit(5);

            if (error) throw error;
            setData(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                Supabase Test (Client-side)
            </h2>

            <button
                onClick={testSupabase}
                style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #374151",
                    background: "#111827",
                    color: "white",
                    cursor: "pointer",
                    marginBottom: 12
                }}
            >
                {loading ? "Loading..." : "Test Supabase Connection"}
            </button>

            {error && (
                <div style={{
                    padding: 12,
                    background: "#7f1d1d",
                    color: "#fecaca",
                    borderRadius: 8,
                    marginBottom: 12
                }}>
                    Error: {error}
                    <br />
                    <small>Make sure you have created a table in Supabase</small>
                </div>
            )}

            {data && (
                <pre
                    style={{
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
