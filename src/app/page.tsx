type HealthResponse = {
  ok: boolean
  service: string
}

async function getHealth(): Promise<HealthResponse | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ai-recruitment-app-pi.vercel.app')

  try {
    const res = await fetch(`${baseUrl}/api/py/health`, { cache: 'no-store' })
    if (!res.ok) {
      return null
    }
    return (await res.json()) as HealthResponse
  } catch (error) {
    console.error('Unable to reach /api/py/health', error)
    return null
  }
}

export default async function Home() {
  const health = await getHealth()

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Recruitment
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect talented job seekers with top employers using intelligent matching and automated screening.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a
              href="/auth/jobseeker/login"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
            >
              I&apos;m Looking for a Job
            </a>
            <a
              href="/auth/recruiter/login"
              className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              I&apos;m Hiring Talent
            </a>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Matching</h3>
              <p className="text-gray-600">Advanced algorithms match candidates with perfect opportunities</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Screening</h3>
              <p className="text-gray-600">Automated resume parsing and skill verification</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Process</h3>
              <p className="text-gray-600">Streamlined hiring workflow saves time for everyone</p>
            </div>
          </div>

          {/* Service Status */}
          <div className="mt-16 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <div className={`w-2 h-2 rounded-full ${health?.ok ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {health?.ok ? 'All systems operational' : 'Service status unknown'}
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
