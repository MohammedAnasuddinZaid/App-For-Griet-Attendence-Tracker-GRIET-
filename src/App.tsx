import React, { type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useApp } from '@/context/AppContext'
import HomePage from '@/pages/Home'
import TodayPage from '@/pages/Today'
import TimetablePage from '@/pages/Timetable'
import CalendarPage from '@/pages/Calendar'
import StatsPage from '@/pages/Stats'
import SetupPage from '@/pages/Setup'
import SettingsPage from '@/pages/Settings'
import AiPage from '@/pages/AI'
import AbsenceJournalPage from '@/pages/AbsenceJournal'

class AppErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  state: { hasError: boolean } = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card mx-auto my-12 max-w-md p-8 text-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You can reload the page. Your data stays safe on this device.
          </p>
          <button
            className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function RequireProfile({ children }: { children: ReactNode }) {
  const { profile } = useApp()
  if (profile) return <>{children}</>
  return <Navigate to="/setup" replace />
}

function App() {
  return (
    <AppErrorBoundary>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <RequireProfile>
                <HomePage />
              </RequireProfile>
            }
          />
          <Route
            path="/today"
            element={
              <RequireProfile>
                <TodayPage />
              </RequireProfile>
            }
          />
          <Route
            path="/timetable"
            element={
              <RequireProfile>
                <TimetablePage />
              </RequireProfile>
            }
          />
          <Route
            path="/calendar"
            element={
              <RequireProfile>
                <CalendarPage />
              </RequireProfile>
            }
          />
          <Route
            path="/stats"
            element={
              <RequireProfile>
                <StatsPage />
              </RequireProfile>
            }
          />
          <Route
            path="/absences"
            element={
              <RequireProfile>
                <AbsenceJournalPage />
              </RequireProfile>
            }
          />
          <Route
            path="/ai"
            element={
              <RequireProfile>
                <AiPage />
              </RequireProfile>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireProfile>
                <SettingsPage />
              </RequireProfile>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppErrorBoundary>
  )
}

export default App