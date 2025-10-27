type HealthResponse = {
  ok: boolean
  service: string
}

async function getHealth(): Promise<HealthResponse | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ai-recruitment-app-pi.vercel.app')

  try {
    const res = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' })
    if (!res.ok) {
      return null
    }
    return (await res.json()) as HealthResponse
  } catch (error) {
    console.error('Unable to reach /api/health', error)
    return null
  }
}

export default async function Home() {

  const health = await getHealth()

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
        padding: '3rem 1.25rem 4rem 1.25rem',
        background: '#f8fafc',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system',
      }}
    >
      <div>{health?.ok ? health.service : 'Service is down'}</div>
    </main>
  )
}
