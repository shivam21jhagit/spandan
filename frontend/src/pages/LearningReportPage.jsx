
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'
import ProfileDropdown from '../components/ProfileDropdown'
import { api } from '../lib/api'

function LearningReportPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()

  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadReport() {
      setIsLoading(true)
      setError('')

      try {
        const data = await api.get(`/learning-reports/${roomId}`)
        if (!cancelled) setReport(data.report)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load learning report')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadReport()
    return () => {
      cancelled = true
    }
  }, [roomId])

  const metrics = report?.metrics || {}
  const analysis = report?.aiAnalysis || {}
  const fallback = analysis.summary?.startsWith('Metrics-based report only.')

  const Stat = ({ label, value, suffix = '' }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
        {value ?? 0}{suffix}
      </p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <main
  className="flex-1 min-w-0 transition-all duration-200"
  style={{
    marginLeft: window.matchMedia('(max-width: 768px)').matches
      ? 0
      : 'var(--sidebar-width, 240px)'
  }}
>
        <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Learning Report</h1>
            <p className="mt-1 text-sm text-blue-100">Post-session learning insights</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-6">
          <button
            onClick={() => navigate(`/student/room/${roomId}/results`)}
            className="mb-6 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            ← Back to Results
          </button>

          {isLoading ? (
            <div className="rounded-xl bg-white dark:bg-gray-800 p-8 text-center">
              Loading your learning report…
            </div>
          ) : error ? (
            <div className="rounded-xl bg-white dark:bg-gray-800 p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Unable to load report
              </h2>
              <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Make sure the session has ended and a report has been generated for your account.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Try again
              </button>
            </div>
          ) : report ? (
            <>
              {fallback && (
                <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-4">
                  <h2 className="font-semibold text-amber-900 dark:text-amber-200">
                    Metrics-based analysis
                  </h2>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                    AI analysis was unavailable when this report was generated. The metrics below are saved session data; this summary is a fallback, not AI-generated advice.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <Stat label="Accuracy" value={metrics.accuracy} suffix="%" />
                <Stat label="Questions attempted" value={`${metrics.attempted ?? 0} / ${metrics.totalQuestions ?? 0}`} />
                <Stat label="Correct answers" value={metrics.correct} />
                <Stat label="Total points" value={metrics.totalPoints} />
                <Stat label="Average response time" value={metrics.averageResponseTime} suffix=" sec" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Session summary</h2>
                  <p className="mt-3 leading-7 text-gray-700 dark:text-gray-300">
                    {analysis.summary || 'No summary is available.'}
                  </p>
                </section>

                {[
                  { title: 'Strengths', items: analysis.strengths },
                  { title: 'Areas to improve', items: analysis.weaknesses },
                  { title: 'Recommendations', items: analysis.recommendations }
                ].map(section => (
                  <section key={section.title} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
                    {section.items?.length ? (
                      <ul className="mt-4 space-y-3 list-disc pl-5 text-gray-700 dark:text-gray-300">
                        {section.items.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    ) : (
                      <p className="mt-3 text-gray-500 dark:text-gray-400">
                        {fallback ? 'Not provided by the metrics-based fallback.' : 'No items available.'}
                      </p>
                    )}
                  </section>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}

export default LearningReportPage
