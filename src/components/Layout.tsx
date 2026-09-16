import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, CalendarDays, CalendarRange, BarChart3, Settings, BookOpenCheck, Sparkles, ScrollText, WifiOff } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { cn } from '@/utils/cn'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/today', label: 'Today', icon: CalendarDays },
  { to: '/timetable', label: 'Timetable', icon: BookOpenCheck },
  { to: '/calendar', label: 'Calendar', icon: CalendarRange },
  { to: '/stats', label: 'Stats', icon: BarChart3 }
]

export function useResetIfNoProfile() {}

export function Layout() {
  const { profile, offline } = useApp()
  const navigate = useNavigate()

  const navItem = ({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Home; end?: boolean }) => (
    <NavLink key={to} to={to} end={end}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      )}>
      <Icon size={18} aria-hidden /> {label}
    </NavLink>
  )

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="size-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">G</div>
          <div>
            <p className="font-bold text-sm leading-tight">GRIET Attendance</p>
            <p className="text-[11px] text-slate-400">Student-built utility</p>
          </div>
        </div>
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map(navItem)}
          {navItem({ to: '/ai', label: 'Attendance AI', icon: Sparkles })}
          {navItem({ to: '/absences', label: 'Absence Journal', icon: ScrollText })}
        </nav>
        <div className="mt-auto pt-4">
          <button
            onClick={() => navigate('/settings')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Settings size={18} aria-hidden /> Settings
          </button>
          {!profile && (
            <button onClick={() => navigate('/setup')}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
              Set up profile
            </button>
          )}
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="lg:hidden sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur pb-safe">
        <div className="flex items-center justify-between px-4 pt-3 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">G</div>
            <div>
              <p className="font-bold text-sm leading-tight tracking-tight">GRIET Attendance</p>
              {profile && <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[140px]">{profile.name} · {profile.year} {profile.section}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {offline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300" title="Offline — changes are saved on this device">
                <WifiOff size={11} aria-hidden /> Offline
              </span>
            )}
            <button onClick={() => navigate('/ai')} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Attendance AI">
              <Sparkles size={19} />
            </button>
            <button onClick={() => navigate('/settings')} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Settings">
              <Settings size={19} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:pl-60 pb-24 lg:pb-8">
        <div className="mx-auto max-w-5xl px-4 pt-5 lg:pt-8">
          {offline && (
            <div className="hidden lg:items-center lg:mb-4 mb-4 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400">
              <WifiOff size={14} aria-hidden />
              Offline — your changes are saved on this device.
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'
              )}>
              <Icon size={20} aria-hidden /> {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}