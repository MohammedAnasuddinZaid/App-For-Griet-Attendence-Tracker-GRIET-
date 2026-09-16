import { useMemo, useState } from 'react'
import { CalendarClock, CircleHelp, Minus, Plus, Target, TrendingUp, Activity, CalendarRange, ClipboardList, Sparkles, Info } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button, Card, CardHeader, Badge, EmptyState, useToast } from '@/components/ui'
import { AttendanceHero, SubjectCard, InsightItem, EmptySection } from '@/components/domain'
import { LineChart, BarChart, DonutChart } from '@/components/Charts'
import { useDashboardData } from '@/hooks/useDashboardData'
import { computeSummary, project, classesNeeded } from '@/services/attendanceEngine'
import { attendanceTrend, trendSlope, weeklyAttendanceQuality, monthlySummaries } from '@/services/analyticsEngine'
import { buildPlan, type PlanResult, type PlanDay } from '@/services/ai/planner'
import { addDays, todayStr, formatFriendlyDate } from '@/utils/date'
import { cn } from '@/utils/cn'

type Tab = 'overview' | 'forecast' | 'subjects' | 'whatif' | 'trend' | 'planner'

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp },
  { id: 'subjects', label: 'Subjects', icon: ClipboardList },
  { id: 'whatif', label: 'What-if', icon: CircleHelp },
  { id: 'trend', label: 'Trend', icon: CalendarClock },
  { id: 'planner', label: 'Plan', icon: Target }
]

function Stepper({ value, onChange, min = 0, max = 100 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" aria-label="Decrease">
        <Minus size={14} />
      </button>
      <span className="w-8 text-center text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" aria-label="Increase">
        <Plus size={14} />
      </button>
    </div>
  )
}

export default function StatsPage() {
  const { profile, settings } = useApp()
  const data = useDashboardData(profile)
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('overview')

  // What-if state
  const [wiAttend, setWiAttend] = useState(1)
  const [wiMiss, setWiMiss] = useState(1)
  const [wiSubject, setWiSubject] = useState<string>('__overall__')

  // Planner state
  const [plTarget, setPlTarget] = useState(settings?.attendanceTarget ?? 75)
  const [plBuffer, setPlBuffer] = useState(0)
  const [plEndDate, setPlEndDate] = useState(addDays(todayStr(), 120))
  const [plWeekdays, setPlWeekdays] = useState<number[]>([])
  const [planResult, setPlanResult] = useState<PlanResult | null>(null)
  const [plannerOpen, setPlannerOpen] = useState(false)

  const today = todayStr()

  const subjectNames = useMemo(() => {
    const set = new Set<string>()
    for (const r of data.records) {
      if (r.subjectName) set.add(r.subjectName)
    }
    return [...set].sort()
  }, [data.records])

  const subjectOptions = ['__overall__', ...subjectNames]

  const scenario = useMemo(() => {
    if (wiSubject === '__overall__') {
      return project(data.summary, wiAttend, wiMiss)
    }
    const recs = data.records.filter((r) => r.subjectName === wiSubject)
    const s = computeSummary(recs)
    return project(s, wiAttend, wiMiss)
  }, [data.summary, data.records, wiSubject, wiAttend, wiMiss])

  const trendPoints = useMemo(
    () => attendanceTrend(data.records).map((p) => ({ label: p.date.slice(5), value: p.percentage })),
    [data.records]
  )
  const slope = useMemo(() => trendSlope(attendanceTrend(data.records)), [data.records])
  const weekly = useMemo(() => weeklyAttendanceQuality(data.records), [data.records])
  const monthly = useMemo(
    () => monthlySummaries(data.records).map((m) => ({ label: m.label.slice(0, 3), value: m.percentage })),
    [data.records]
  )

  const targetLadder = useMemo(() => {
    return [60, 65, 70, 75, 80, 85, 90].map((t) => ({
      target: t,
      needed: classesNeeded(data.summary.present, data.summary.conducted, t)
    }))
  }, [data.summary.present, data.summary.conducted])

  async function runPlanner() {
    if (!profile) return
    if (plEndDate < today) {
      toast({ type: 'warning', message: 'End date must be in the future.' })
      return
    }
    const res = buildPlan({
      records: data.records,
      slots: data.slots,
      specialDates: data.specialDates,
      events: data.events,
      overrides: data.overrides,
      target: plTarget,
      endDate: plEndDate,
      buffer: plBuffer,
      unavailableWeekdays: plWeekdays
    })
    setPlanResult(res)
    setPlannerOpen(true)
    toast({ type: res.feasible ? 'success' : 'warning', message: res.message })
  }

  const riskCounts = useMemo(() => {
    const acc = { excellent: 0, safe: 0, watch: 0, risk: 0 }
    for (const s of data.subjectStats) {
      if (s.risk === 'EXCELLENT' || s.risk === 'SAFE') acc.excellent++
      else if (s.risk === 'WATCH') acc.watch++
      else acc.risk++
    }
    return acc
  }, [data.subjectStats])

  if (!profile || !settings) {
    return <EmptyState icon={<Activity size={28} />} title="No profile yet" />
  }

  const forecastRows = data.forecastData.scenarios
  const maxPossible = data.summary.conducted + data.remainingCount > 0
    ? (data.summary.present + data.remainingCount) / (data.summary.conducted + data.remainingCount) * 100
    : null

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Statistics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Attendance analytics for {profile.section} · {profile.semester} sem</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setPlannerOpen(true) }}><Sparkles size={15} aria-hidden /> Plan</Button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-thin">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors',
              tab === id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            <Icon size={14} aria-hidden /> {label}
          </button>
        ))}
      </div>

      {data.isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 h-36" />
          <div className="animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 h-52" />
        </div>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="space-y-4">
              <AttendanceHero
                pct={data.summary.percentage}
                present={data.summary.present}
                conducted={data.summary.conducted}
                target={data.settings?.attendanceTarget ?? 75}
                buffer={data.summary.percentage !== null ? data.summary.percentage - (data.settings?.attendanceTarget ?? 75) : null}
                status={data.health}
              />
              <p className="text-[11px] text-slate-400 -mt-1 flex items-center gap-1">
                <Info size={11} aria-hidden /> Health is an app-generated planning indicator, not an official GRIET metric.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4">
                  <p className="text-[11px] uppercase tracking-wide font-medium text-slate-400">Missing budget</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {data.maxSafe === null ? '—' : data.maxSafe}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">classes you can still miss</p>
                </Card>
                <Card className="p-4">
                  <p className="text-[11px] uppercase tracking-wide font-medium text-slate-400">To reach target</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {data.classesNeeded === null ? '—' : data.classesNeeded}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">classes you must attend</p>
                </Card>
              </div>

              <Card>
                <CardHeader title="Impact of each target" subtitle="How many straight classes you need to attend to hit each percentage." />
                <div className="px-5 pb-4 grid grid-cols-7 gap-1.5">
                  {targetLadder.map(({ target, needed }) => (
                    <div key={target} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 text-center">
                      <p className="text-[10px] font-semibold text-slate-400">{target}%</p>
                      <p className={cn('text-sm font-bold tabular-nums', needed !== null && needed > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                        {needed === null || !isFinite(needed) || needed === Infinity ? '—' : needed}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Insights" subtitle="Rule-based notes generated from your data" />
                <div className="px-4 pb-4 space-y-2">
                  {data.insights.length === 0
                    ? <EmptySection icon={<Activity size={20} />} title="Nothing to report yet" />
                    : data.insights.map((ins, i) => <InsightItem key={i} level={ins.level} text={ins.text} action={ins.action} />)}
                </div>
              </Card>
            </div>
          )}

          {tab === 'forecast' && (
            <div className="space-y-4">
              <Card>
                <CardHeader
                  title="Semester forecast"
                  subtitle={`${data.remainingCount} scheduled classes left in your configured timetable`}
                  right={<Badge tone={data.confidence === 'HIGH' ? 'success' : data.confidence === 'MEDIUM' ? 'warning' : 'danger'}>{data.confidence} confidence</Badge>}
                />
                <div className="px-5 pb-5 space-y-3">
                  {data.remainingCount === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      No future classes found. Add your timetable to unlock a meaningful forecast.
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Best possible (attend every class)</p>
                    <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {maxPossible === null ? '—' : maxPossible.toFixed(1)}%
                    </p>
                  </div>
                  <BarChart data={forecastRows.map((s) => ({ label: s.label, value: s.projectedPercentage }))} height={130} colorBy={(v) => (v >= (settings.attendanceTarget ?? 75) ? '#16a34a' : '#d97706')} />
                  <div className="space-y-2">
                    {forecastRows.map((s) => (
                      <div key={s.label} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{s.label}</span>
                        <span className={cn('text-sm font-bold tabular-nums', (s.projectedPercentage ?? 0) >= (settings.attendanceTarget ?? 75) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                          {s.projectedPercentage === null ? '—' : `${s.projectedPercentage.toFixed(1)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Forecast assumes classes continue at your current weekly pattern. It does not account for future holidays, cancellations or timetable changes.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {tab === 'subjects' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone={riskCounts.excellent > 0 ? 'success' : 'neutral'}>{riskCounts.excellent} excellent/safe</Badge>
                <Badge tone={riskCounts.watch > 0 ? 'warning' : 'neutral'}>{riskCounts.watch} watch</Badge>
                <Badge tone={riskCounts.risk > 0 ? 'danger' : 'neutral'}>{riskCounts.risk} at risk</Badge>
              </div>
              {data.subjectStats.length === 0 ? (
                <Card><EmptySection icon={<ClipboardList size={20} />} title="No subject attendance yet" description="Mark today's classes to start building per-subject statistics." /></Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.subjectStats.map((s) => (
                    <SubjectCard
                      key={s.subjectName}
                      name={s.subjectName}
                      pct={s.percentage}
                      present={s.present}
                      conducted={s.conducted}
                      target={s.target}
                      classesNeeded={s.classesNeeded}
                      risk={s.risk}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'whatif' && (
            <div className="space-y-4">
              <Card>
                <CardHeader title="What-if simulator" subtitle="See how hypothetical attendances change your percentage." />
                <div className="px-5 pb-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500" htmlFor="wi-subject">Simulate for</label>
                    <select id="wi-subject" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={wiSubject} onChange={(e) => setWiSubject(e.target.value)}>
                      {subjectOptions.map((s) => <option key={s} value={s}>{s === '__overall__' ? 'Overall attendance' : s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Classes you attend</p>
                      <p className="text-xs text-slate-400">consecutive future classes</p>
                    </div>
                    <Stepper value={wiAttend} onChange={setWiAttend} min={0} max={60} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Classes you miss</p>
                      <p className="text-xs text-slate-400">consecutive future classes</p>
                    </div>
                    <Stepper value={wiMiss} onChange={setWiMiss} min={0} max={60} />
                  </div>

                  <div className="rounded-xl bg-slate-50/70 dark:bg-slate-800/50 p-4">
                    <p className="text-[11px] uppercase tracking-wide font-medium text-slate-400">Projected result</p>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{scenario.projectedPercentage?.toFixed(1) ?? '—'}%</p>
                        <p className="text-[10px] text-slate-400">after scenario</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{scenario.projectedConducted}</p>
                        <p className="text-[10px] text-slate-400">conducted</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{scenario.projectedPresent}</p>
                        <p className="text-[10px] text-slate-400">present</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold tabular-nums text-red-500">{scenario.projectedConducted - scenario.projectedPresent}</p>
                        <p className="text-[10px] text-slate-400">absent</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Uses the exact same integer math as the rest of the app. Enter how many future classes you will attend vs miss, and it recomputes instantly.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {tab === 'trend' && (
            <div className="space-y-4">
              <Card>
                <CardHeader
                  title="Cumulative trend"
                  subtitle="Your attendance percentage across time"
                  right={slope !== null ? <Badge tone={slope >= 0 ? 'success' : 'warning'}>{(slope >= 0 ? '+' : '') + slope.toFixed(1)} pts</Badge> : undefined}
                />
                <div className="px-4 pb-4">
                  {trendPoints.length === 0
                    ? <EmptySection icon={<TrendingUp size={20} />} title="No trend data yet" />
                    : (
                      <>
                        <LineChart data={trendPoints} height={130} className="w-full" />
                        <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                          <span>{trendPoints[0]?.label}</span>
                          <span>today</span>
                        </div>
                      </>
                    )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Monthly summary" />
                <div className="px-4 pb-4">
                  {monthly.length === 0
                    ? <EmptySection icon={<CalendarRange size={20} />} title="No monthly data yet" />
                    : <BarChart data={monthly} height={120} className="w-full" colorBy={(v) => (v >= (settings.attendanceTarget ?? 75) ? '#16a34a' : '#d97706')} />}
                </div>
              </Card>

              <Card>
                <CardHeader title="Weekday pattern" subtitle="Average attendance by day of week" />
                <div className="px-5 pb-5 flex gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                      <DonutChart value={weekly[i] !== undefined && weekly[i] === 0 ? null : (weekly[i] ?? 1) * 100} size={44} stroke={4} label={label} />
                      <p className="text-[10px] text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 'planner' && (
            <Card>
              <CardHeader title="Recovery planner" subtitle="Generate a day-by-day attendance plan to reach a target." />
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500" htmlFor="pl-target">Target %</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input id="pl-target" type="number" min={0} max={100} value={plTarget} onChange={(e) => setPlTarget(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500" htmlFor="pl-buffer">Extra buffer</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input id="pl-buffer" type="number" min={0} max={20} value={plBuffer} onChange={(e) => setPlBuffer(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500" htmlFor="pl-end">End date</label>
                    <input id="pl-end" type="date" value={plEndDate} onChange={(e) => setPlEndDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Days you already know you'll be absent</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPlWeekdays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]))}
                        className={cn('rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
                          plWeekdays.includes(i)
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700')}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={() => void runPlanner()}>Generate plan</Button>
                <p className="text-[11px] text-slate-400">
                  The planner respects your calendar (holidays, exams, overrides) and special timetable days. It is deterministic — it never guesses.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Plan result modal */}
      <PlanModal
        open={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        result={planResult}
        today={today}
      />
    </div>
  )
}

function PlanDayRow({ day }: { day: PlanDay }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50/70 dark:bg-slate-800/50 px-3 py-1.5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{formatFriendlyDate(day.date, { weekday: true })}</p>
        {day.subjects.length > 0 && <p className="text-[10px] text-slate-400 truncate">{day.subjects.slice(0, 3).join(', ')}{day.subjects.length > 3 ? '…' : ''}</p>}
      </div>
      <div className="shrink-0">
        {day.status === 'ATTEND' && <Badge tone="success">Attend</Badge>}
        {day.status === 'ABSENT' && <Badge tone="danger">Absent</Badge>}
        {day.status === 'HOLIDAY' && <Badge tone="holiday">Holiday</Badge>}
        {day.status === 'NO_CLASS' && <Badge tone="neutral">No class</Badge>}
      </div>
    </div>
  )
}

function PlanModal({ open, onClose, result, today }: { open: boolean; onClose: () => void; result: PlanResult | null; today: string }) {
  if (!open) return null
  const upcoming = result ? result.days.filter((d) => d.date >= today) : []
  const summary = result ? (
    <>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{result.finalProjectedPct?.toFixed(1) ?? '—'}%</p>
          <p className="text-[10px] text-slate-400">final</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{result.attendCount}</p>
          <p className="text-[10px] text-slate-400">to attend</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-red-500">{result.constrainedSlots}</p>
          <p className="text-[10px] text-slate-400">committed absences</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{result.safetyBuffer?.toFixed(1) ?? '—'} pts</p>
          <p className="text-[10px] text-slate-400">buffer</p>
        </div>
      </div>
      {result.requiredAttendancePct !== null && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
          You must attend at least <strong className="text-slate-800 dark:text-slate-100">{result.requiredAttendancePct.toFixed(1)}%</strong> of remaining classes to land on target.
        </p>
      )}
    </>
  ) : null

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full md:max-w-lg md:rounded-2xl rounded-t-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] animate-scale-in">
        <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Attendance plan</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Plus size={18} className="rotate-45" /></button>
        </div>
        <div className="p-5 space-y-4">
          {result ? (
            <>
              <div className={cn('rounded-xl border p-4', result.feasible ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20' : 'border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20')}>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {result.feasible ? 'Plan is feasible' : 'Plan is not feasible'}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{result.message}</p>
                {result.unreachableReason && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{result.unreachableReason}</p>}
              </div>
              {summary}
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Day-by-day plan</h3>
                <div className="space-y-1.5">
                  {upcoming.slice(0, 21).map((d) => <PlanDayRow key={d.date} day={d} />)}
                  {upcoming.length === 0 && <p className="text-xs text-slate-400">No class days in the range.</p>}
                </div>
              </div>
            </>
          ) : (
            <EmptyState icon={<Target size={26} />} title="Run a plan first" description="Configure the planner tab to generate a day-by-day plan." />
          )}
        </div>
      </div>
    </div>
  )
}