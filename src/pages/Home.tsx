import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CalendarDays, ChevronRight, Sparkles, Clock } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useDashboardData } from '@/hooks/useDashboardData'
import { AttendanceHero, TodayStatusCard, NextClassCard, InsightItem, SubjectCard } from '@/components/domain'
import { Card, Skeleton, Button, EmptyState } from '@/components/ui'
import { formatFriendlyDate, todayStr, formatTime } from '@/utils/date'
import { afterAttending, afterMissing } from '@/services/attendanceEngine'

export function homeGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const { profile, settings } = useApp()
  const navigate = useNavigate()
  const data = useDashboardData(profile)
  const [, setClock] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const today = todayStr()

  if (!profile || !settings) {
    return (
      <div className="pt-10">
        <EmptyState
          icon={<CalendarDays size={32} />}
          title="Welcome to GRIET Attendance"
          description="Set up your profile to see today's schedule, attendance and academic calendar — all offline."
          action={<Button onClick={() => navigate('/setup')}>Set up profile</Button>}
        />
      </div>
    )
  }

  if (data.isLoading && data.profile === null) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  const s = data.summary
  const target = settings?.attendanceTarget ?? 75
  const buffer = s.percentage === null ? null : s.percentage - target
  const timeFormat = settings?.timeFormat ?? '12h'

  const next = data.classPosition.next ?? data.todaySlots[0] ?? null
  const impact =
    next && s.conducted > 0
      ? { a: afterAttending(s, 1).projectedPercentage, m: afterMissing(s, 1).projectedPercentage }
      : null

  // Today's impact
  const todayImpact =
    data.todaySlots.length > 0 && s.conducted > 0
      ? {
          all: afterAttending(s, data.todaySlots.length).projectedPercentage,
          none: afterMissing(s, data.todaySlots.length).projectedPercentage,
          count: data.todaySlots.length
        }
      : null

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {homeGreeting()}, <span className="text-brand-600 dark:text-brand-400">{profile.name.split(' ')[0]}</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {formatFriendlyDate(today)} · {profile.year} B.Tech {profile.branch} · Sec {profile.section} · Sem {profile.semester}
        </p>
      </div>

      {/* Today status */}
      <TodayStatusCard
        status={data.todayStatus.status}
        title={data.todayStatus.title}
        detail={data.todayStatus.detail}
        onReview={() => navigate('/calendar')}
      />

      {/* Today chips */}
      {data.todayStatus.status !== 'CONFIRMED_HOLIDAY' && data.todaySlots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.todaySlots.map((sl) => (
            <span key={sl.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Clock size={12} aria-hidden /> {formatTime(sl.startTime, timeFormat)} {sl.subjectName}
            </span>
          ))}
        </div>
      )}

      {/* Attendance hero */}
      <AttendanceHero
        pct={s.percentage}
        present={s.present}
        conducted={s.conducted}
        target={target}
        buffer={buffer}
        status={s.percentage === null ? 'NO DATA' : buffer !== null && buffer < 0 ? 'WATCH' : s.percentage >= target + 10 ? 'SAFE' : s.percentage >= target ? 'ON TRACK' : 'WATCH'}
        onClick={() => navigate('/stats')}
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => navigate('/today')} variant="primary" className="h-11">
          <CalendarDays size={18} aria-hidden /> Today's classes
        </Button>
        <Button onClick={() => navigate('/stats')} variant="secondary" className="h-11">
          Attendance analytics
        </Button>
      </div>

      {/* Next class */}
      {next && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{data.classPosition.current ? 'Current class' : 'Next class'}</h2>
          </div>
          <NextClassCard
            subject={next.subjectName}
            startTime={next.startTime}
            endTime={next.endTime}
            room={next.room}
            current={!!data.classPosition.current}
            timeFormat={timeFormat}
          />
          {impact && (
            <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Impact of this class</span>
              <div className="flex items-center gap-3 font-medium tabular-nums">
                <span className="text-emerald-600 dark:text-emerald-400">Present → {impact.a?.toFixed(1)}%</span>
                <span className="text-red-600 dark:text-red-400">Absent → {impact.m?.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Attention</h2>
            <button onClick={() => navigate('/ai')} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
              <Sparkles size={13} aria-hidden /> Ask Attendance AI
            </button>
          </div>
          <div className="space-y-2">
            {data.insights.slice(0, 3).map((ins, i) => <InsightItem key={i} {...ins} />)}
          </div>
        </div>
      )}

      {/* Subjects */}
      {data.subjectStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Subjects</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.subjectStats.slice(0, 4).map((sub) => (
              <SubjectCard
                key={sub.subjectName}
                name={sub.subjectName}
                pct={sub.percentage}
                present={sub.present}
                conducted={sub.conducted}
                target={target}
                classesNeeded={sub.classesNeeded}
                risk={sub.risk}
                onClick={() => navigate('/stats')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's impact */}
      {todayImpact && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Today's attendance impact</h3>
            <button onClick={() => navigate('/today')} className="inline-flex items-center text-xs text-brand-600 dark:text-brand-400">
              Mark attendance <ChevronRight size={14} aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Attend all ({todayImpact.count})</p>
              <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">{todayImpact.all === null ? 'N/A' : todayImpact.all.toFixed(1) + '%'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Current</p>
              <p className="font-bold tabular-nums mt-0.5">{s.percentage === null ? 'N/A' : s.percentage.toFixed(1) + '%'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Miss all</p>
              <p className="font-bold tabular-nums text-red-600 dark:text-red-400 mt-0.5">{todayImpact.none === null ? 'N/A' : todayImpact.none.toFixed(1) + '%'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* No timetable */}
      {data.todaySlots.length === 0 && !data.todayStatus.isCollegeClosed && data.todayStatus.status !== 'WEEKEND' && !data.isLoading && (
        <Card>
          <EmptyState
            icon={<CalendarDays size={28} />}
            title="You have no classes scheduled today"
            description="Add your timetable to see the daily schedule here."
            action={<Button variant="secondary" onClick={() => navigate('/timetable')}>Open timetable</Button>}
          />
        </Card>
      )}

      {data.todaySlots.length === 0 && data.todayStatus.status === 'WEEKEND' && !data.isLoading && (
        <Card>
          <EmptyState
            icon={<Clock size={28} />}
            title="No classes scheduled today"
            description="It's a weekend. Review the calendar for special days or make-up classes."
            action={<Button variant="secondary" onClick={() => navigate('/calendar')}>View calendar</Button>}
          />
        </Card>
      )}

      <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center pb-2">
        Attendance metrics are app-generated planning indicators, not official GRIET records. GRIET — Est. 1997, Bachupally.
      </p>
    </div>
  )
}