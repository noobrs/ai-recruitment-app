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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">

        {/* ======================= */}
        {/* HERO */}
        {/* ======================= */}
        <section className="text-center mb-24">
          <h1 className="text-6xl font-bold text-gray-900 tracking-tight mb-6">
            Recruit Smarter with AI
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A modern recruitment platform powered by OCR, AI-matching,
            and intelligent screening – designed for SMEs, startups, and job seekers.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/login"
              className="px-10 py-4 bg-indigo-600 text-white font-medium rounded-xl shadow-lg hover:bg-indigo-700 transition"
            >
              Login
            </a>

            <a
              href="/auth/register"
              className="px-10 py-4 bg-white text-indigo-600 border-2 border-indigo-600 font-medium rounded-xl shadow-lg hover:bg-indigo-50 transition"
            >
              Register
            </a>
          </div>

          {/* Decorative illustration */}
          {/* <div className="mt-16 flex justify-center">
            <img
              src="/images/hero-recruitment.svg"
              className="w-full max-w-3xl drop-shadow-lg"
              alt="AI recruitment"
            />
          </div> */}
        </section>

        {/* ======================= */}
        {/* FEATURES */}
        {/* ======================= */}
        <section className="mb-32">
          <h2 className="text-3xl font-semibold text-gray-900 text-center mb-12">
            Powerful Features for Modern Hiring
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                iconBg: "bg-indigo-100",
                iconColor: "text-indigo-600",
                title: "AI Matching",
                desc: "Smart matching algorithm pairs candidates with relevant jobs."
              },
              {
                iconBg: "bg-green-100",
                iconColor: "text-green-600",
                title: "Smart Screening",
                desc: "OCR + NLP to parse resumes, verify skills, and highlight strengths."
              },
              {
                iconBg: "bg-purple-100",
                iconColor: "text-purple-600",
                title: "Fast Workflow",
                desc: "Reduce hiring time with automated processes and simplified steps."
              }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-gray-100 transition hover:shadow-2xl"
              >
                <div className={`w-14 h-14 ${item.iconBg} rounded-xl flex items-center justify-center mb-6`}>
                  <svg className={`w-7 h-7 ${item.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={index === 0
                        ? "M13 10V3L4 14h7v7l9-11h-7z"
                        : index === 1
                        ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"}
                    />
                  </svg>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================= */}
        {/* HOW IT WORKS */}
        {/* ======================= */}
        <section className="mb-32">
          <h2 className="text-3xl font-semibold text-gray-900 text-center mb-14">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              {
                step: "1",
                title: "Upload Resume",
                desc: "Supports image, PDF, and unscannable documents with OCR."
              },
              {
                step: "2",
                title: "AI Screening",
                desc: "Extracts skills, experience, education, and job fit score."
              },
              {
                step: "3",
                title: "Get Matched",
                desc: "AI pairs your profile with the most suitable opportunities."
              }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition"
              >
                <div className="w-14 h-14 bg-indigo-600 text-white flex items-center justify-center rounded-full mx-auto text-2xl font-bold mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================= */}
        {/* STATUS */}
        {/* ======================= */}
        <div className="flex justify-center mt-8">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white rounded-full shadow">
            <span className={`w-3 h-3 rounded-full ${health?.ok ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-gray-700 text-sm">
              {health?.ok ? "All systems operational" : "Service status unknown"}
            </span>
          </div>
        </div>

        {/* ======================= */}
        {/* FOOTER */}
        {/* ======================= */}
        <footer className="mt-24 text-center text-gray-500 text-sm py-8">
          © {new Date().getFullYear()} AI Recruitment System — Built for SMEs & Startups
        </footer>
      </div>
    </main>
  )
}
