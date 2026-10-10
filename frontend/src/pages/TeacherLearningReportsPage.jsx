
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'
import ProfileDropdown from '../components/ProfileDropdown'
import { api } from '../lib/api'

function TeacherLearningReportsPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [reports, setReports] = useState([])
  const [roomName, setRoomName] = useState('Completed session')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadReports() {
      setLoading(true)
      setError('')

      try {
        const [reportData, roomData] = await Promise.all([
          api.get(`/learning-reports/${roomId}/all`),
          api.get(`/rooms/${roomId}`)
        ])

        if (cancelled) return

        setReports(reportData.reports || [])
        setRoomName(roomData.room?.name || roomData.name || 'Completed session')
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load student learning reports.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReports()

    return () => {
      cancelled = true
    }
  }, [roomId])

  const fallback = (report) =>
    report.aiAnalysis?.summary?.startsWith('Metrics-based report only.')

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <Sidebar user={user} />

      <main style={{
        flex: 1,
        minWidth: 0,
        marginLeft: 'var(--sidebar-width, 240px)'
      }}>
        <header style={{
          background: 'var(--header-bg)',
          color: 'white',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26 }}>
              Student Learning Reports
            </h1>
            <p style={{ margin: '6px 0 0', opacity: 0.9 }}>
              {roomName}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </header>

        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          <button
            onClick={() => navigate(`/teacher/room/${roomId}/results`)}
            style={{
              padding: '10px 16px',
              marginBottom: 24,
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            ← Back to Results
          </button>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              Loading student reports…
            </p>
          ) : error ? (
            <div style={{
              padding: 20,
              borderRadius: 12,
              background: 'var(--bg-card)',
              color: 'var(--text-primary)'
            }}>
              <h2>Unable to load reports</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)'
            }}>
              <h2 style={{ color: 'var(--text-primary)' }}>
                No reports available yet
              </h2>
              Reports will appear here once student learning reports have
              been generated for this session.
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginBottom: 24
              }}>
                {[
                  ['Students with reports', reports.length],
                  [
                    'Average accuracy',
                    `${(
                      reports.reduce((sum, r) => sum + (r.metrics?.accuracy || 0), 0) /
                      reports.length
                    ).toFixed(1)}%`
                  ],
                  [
                    'AI unavailable',
                    reports.filter(fallback).length
                  ]
                ].map(([label, value]) => (
                  <div key={label} style={{
                    padding: 20,
                    borderRadius: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--card-shadow, 0 2px 8px rgba(0,0,0,0.05))'
                  }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      {label}
                    </p>
                    <strong style={{
                      display: 'block',
                      marginTop: 8,
                      fontSize: 26,
                      color: 'var(--text-primary)'
                    }}>
                      {value}
                    </strong>
                  </div>
                ))}
              </div>

              <div style={{
                overflowX: 'auto',
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  color: 'var(--text-primary)'
                }}>
                  <thead>
                    <tr>
                      {['Student', 'Attempted', 'Correct', 'Accuracy', 'Points', 'Analysis', 'Report'].map(label => (
                        <th key={label} style={{
                          padding: 14,
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap'
                        }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => {
                      const metrics = report.metrics || {}
                      const student = report.studentId
                      const isFallback = fallback(report)

                      return (
                        <tr key={report._id}>
                          <td style={{ padding: 14, borderBottom: '1px solid var(--border-color)' }}>
                            <div>{student?.name || 'Student'}</div>
                            <small style={{ color: 'var(--text-secondary)' }}>
                              {student?.email || 'Student account'}
                            </small>
                          </td>
                          <td style={{ padding: 14 }}>
                            {metrics.attempted ?? 0} / {metrics.totalQuestions ?? 0}
                          </td>
                          <td style={{ padding: 14 }}>{metrics.correct ?? 0}</td>
                          <td style={{ padding: 14 }}>{metrics.accuracy ?? 0}%</td>
                          <td style={{ padding: 14 }}>{metrics.totalPoints ?? 0}</td>
                          <td style={{ padding: 14 }}>
                            <span style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              background: isFallback ? '#fef3c7' : '#d1fae5',
                              color: isFallback ? '#92400e' : '#065f46'
                            }}>
                              {isFallback ? 'Metrics fallback' : 'AI report'}
                            </span>
                          </td>
                          <td style={{ padding: 14 }}>
                            <button
                              onClick={() => navigate(
                                `/teacher/learning-report/${roomId}/${student?._id || report.studentId}`
                              )}
                              style={{
                                padding: '8px 12px',
                                border: 0,
                                borderRadius: 7,
                                background: '#2563eb',
                                color: 'white',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              View report
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default TeacherLearningReportsPage
