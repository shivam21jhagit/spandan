
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'
import ProfileDropdown from '../components/ProfileDropdown'
import { api } from '../lib/api'

export default function TeacherLearningReportDetailPage() {
  const { roomId, studentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    api.get(`/learning-reports/${roomId}/student/${studentId}`)
      .then(data => {
        if (!cancelled) setReport(data.report)
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Could not load learning report')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [roomId, studentId])

  const metrics = report?.metrics || {}
  const analysis = report?.aiAnalysis || {}

  const isFallback = analysis.summary?.startsWith(
    'Metrics-based report only.'
  )

  const card = (label, value) => (
    <div
      key={label}
      style={{
        padding: 22,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        boxShadow: 'var(--card-shadow, 0 2px 5px rgba(0,0,0,0.05))'
      }}
    >
      <p style={{
        margin: 0,
        color: 'var(--text-secondary)'
      }}>
        {label}
      </p>
      <h2 style={{
        marginBottom: 0,
        color: 'var(--text-primary)',
        fontSize: 26
      }}>
        {value}
      </h2>
    </div>
  )

  const renderList = items => (
    Array.isArray(items) && items.length > 0
      ? (
        <ul style={{ paddingLeft: 22 }}>
          {items.map((item, index) => (
            <li key={index} style={{ marginBottom: 8 }}>
              {item}
            </li>
          ))}
        </ul>
      )
      : <p>Not provided in this report.</p>
  )

  const section = (title, content) => (
    <section
      key={title}
      style={{
        padding: 24,
        borderRadius: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
        minWidth: 0,
        overflowWrap: 'anywhere'
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {content}
    </section>
  )

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      fontFamily: '"Segoe UI", Tahoma, sans-serif'
    }}>
      <Sidebar user={user} />

      <main style={{
        flex: 1,
        minWidth: 0,
        marginLeft: 'var(--sidebar-width, 240px)'
      }}>
        <header style={{
          padding: '24px 32px',
          background: 'var(--header-bg)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div>
            <h1 style={{ margin: 0 }}>
              Student Learning Report
            </h1>
            <p style={{ marginBottom: 0 }}>
              {report?.studentId?.name || 'Student'}
              {report?.studentId?.email
                ? ` · ${report.studentId.email}`
                : ''}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </header>

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 24,
          display: 'grid',
          gap: 22
        }}>
          <div>
            <button
              onClick={() =>
                navigate(
                  `/teacher/room/${roomId}/learning-reports`
                )
              }
              style={{
                padding: '11px 18px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 15
              }}
            >
              ← Back to Student Reports
            </button>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-primary)' }}>
              Loading learning report…
            </p>
          ) : error ? (
            <section style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--bg-card)',
              color: 'var(--text-primary)'
            }}>
              <h2>Unable to load report</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Retry
              </button>
            </section>
          ) : report ? (
            <>
              {isFallback && (
                <div style={{
                  padding: 20,
                  border: '1px solid #fbbf24',
                  borderRadius: 12,
                  background: '#fffbeb',
                  color: '#92400e'
                }}>
                  <strong>Metrics-based analysis</strong>
                  <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
                    AI analysis was unavailable when this report was
                    generated. The metrics below are saved session
                    data; this summary is a fallback, not AI-generated
                    advice.
                  </p>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(175px, 1fr))',
                gap: 16
              }}>
                {card('Accuracy', `${metrics.accuracy ?? 0}%`)}
                {card(
                  'Questions attempted',
                  `${metrics.attempted ?? 0} / ${metrics.totalQuestions ?? 0}`
                )}
                {card('Correct answers', metrics.correct ?? 0)}
                {card('Total points', metrics.totalPoints ?? 0)}
                {card(
                  'Average response time',
                  `${metrics.averageResponseTime ?? 0} sec`
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(270px, 1fr))',
                gap: 20
              }}>
                {section(
                  'Session summary',
                  <p style={{ lineHeight: 1.8 }}>
                    {analysis.summary || 'No summary available.'}
                  </p>
                )}

                {section(
                  'Strengths',
                  renderList(analysis.strengths)
                )}

                {section(
                  'Areas to improve',
                  renderList(analysis.weaknesses)
                )}

                {section(
                  'Recommendations',
                  renderList(analysis.recommendations)
                )}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-primary)' }}>
              No report data was returned.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
