// Server-side fetch to FastAPI route
async function getHealth() {
  let baseUrl = "https://ai-recruitment-app-pi.vercel.app";
  if (process.env.NODE_ENV === "development") {
    baseUrl = "http://localhost:3000";
  }

  const res = await fetch(`${baseUrl}/api/health`, {
    // Uses Vercel serverless function
    cache: "no-store",
  });
  console.log("Health response status:", res);
  if (!res.ok) throw new Error("Failed to call /api/health");
  return res.json() as Promise<{ ok: boolean; service: string }>;
}

import ClientCaller from "../components/ClientCaller";

export default async function Home() {
  const health = await getHealth();

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Next.js ↔ FastAPI (Vercel Function)
      </h1>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Server Component call</h2>
        <pre
          style={{
            background: "#111827",
            color: "#e5e7eb",
            padding: 12,
            borderRadius: 8,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Client Component call</h2>
        <ClientCaller />
      </section>
    </main>
  );
}
