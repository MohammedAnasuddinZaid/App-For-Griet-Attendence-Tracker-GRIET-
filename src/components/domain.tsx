// Domain components: AttendanceHero, StatusCard, ClassCard, TodayTimeline,
// SubjectCard, NextClassCard, InsightCard.
import type { ReactNode } from 'react'
import { CalendarDays, Clock, MapPin, User, Check, X, HelpCircle } from 'lucide-react'
import { Badge, Card, Progress } from '@/components/ui'
import { DonutChart } from '@/components/Charts'
import { formatTime, weekdayShort } from '@/utils/date'
import { cn } from '@/utils/cn'
import type { TodaySlot } from '@/services/timetableEngine'
import type { CalendarStatus, RiskLevel, HealthLevel } from '@/types'

// ---------- AttendanceHero ----------

export function AttendanceHero({ pct, present, conducted, target, buffer, status, onClick }: {
  pct: number | null
  present: number
  conducted: number
  target: number
  buffer: number | null
  status: string
  onClick?: () => void
}) {
  return (
    <Card onClick={onClick} className="p-5 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-50 dark:bg-brand-950/40 opacity-60" aria-hidden />
      <div className="relative flex items-center gap-4">
        <DonutChart value={pct} size={64} stroke={7} label="Overall attendance" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {pct === null ? '—' : pct.toFixed(1)}<span className="text-lg text-slate-400">%</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {present} of {conducted} classes
          </p>
          <div className="mt-2">
            <Progress value={pct ?? 0} max={100} />
          </div>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-medium">Target</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{target}%</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-medium">Buffer</p>
          <p className={cn('text-sm font-semibold', buffer !== null && buffer < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
            {buffer === null ? '—' : buffer >= 0 ? `+${buffer.toFixed(1)}%` : `${buffer.toFixed(1)}%`}
          </p>
        </div>
        <Badge tone={statusBadgeTone(status)}>{status}</Badge>
      </div>
    </Card>
  )
}

function statusBadgeTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (status === 'SAFE' || status === 'EXCELLENT' || status === 'HEALTHY') return 'success'
  if (status === 'WATCH') return 'warning'
  if (status === 'AT_RISK' || status === 'CRITICAL' || status === 'UNRECOVERABLE') return 'danger'
  return 'info'
}

export function riskTone(risk: RiskLevel): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (risk) {
    case 'EXCELLENT': case 'SAFE': return 'success'
    case 'WATCH': return 'warning'
    case 'AT_RISK': case 'CRITICAL': case 'UNRECOVERABLE': return 'danger'
    default: return 'neutral'
  }
}

// ---------- Today status card ----------

export function TodayStatusCard({ status, title, detail, onReview }: {
  status: CalendarStatus
  title: string
  detail: string
  onReview?: () => void
}) {
  const { emoji, cls } = statusVisual(status)
  return (
    <Card className={cn('p-4 flex items-center gap-3', cls)}>
      <span className="text-2xl" aria-hidden>{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{detail}</p>
      </div>
      {onReview && status === 'CONFLICT' && (
        <button onClick={onReview} className="text-xs font-medium text-brand-600 dark:text-brand-400 shrink-0 hover:underline">Review</button>
      )}
    </Card>
  )
}

function statusVisual(status: CalendarStatus): { emoji: string; cls: string } {
  switch (status) {
    case 'INSTRUCTIONAL_DAY': return { emoji: '🟢', cls: 'border-emerald-200 dark:border-emerald-900' }
    case 'CONFIRMED_HOLIDAY': return { emoji: '🎉', cls: 'border-purple-200 dark:border-purple-900' }
    case 'HOLIDAY_CANDIDATE': return { emoji: '🟣', cls: 'border-purple-200 dark:border-purple-900' }
    case 'WEEKEND': return { emoji: '🛋️', cls: 'border-slate-200 dark:border-slate-800' }
    case 'GRIET_EVENT': return { emoji: '📘', cls: 'border-sky-200 dark:border-sky-900' }
    case 'CONFLICT': case 'UNCERTAIN': return { emoji: '⚠️', cls: 'border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20' }
    default: return { emoji: '📅', cls: '' }
  }
}

// ---------- Class card ----------

export interface ClassCardProps {
  slot: TodaySlot
  statusLabel?: string
  current?: boolean
  onMark?: (status: 'PRESENT' | 'ABSENT') => void
  onNotHeld?: () => void
  timeFormat?: '12h' | '24h'
}

export function ClassCard({ slot, statusLabel, current, onMark, onNotHeld, timeFormat = '12h' }: ClassCardProps) {
  const marked = statusLabel !== undefined && statusLabel !== '—'
  return (
    <Card className={cn('p-4 transition-all', current && 'border-brand-300 dark:border-brand-700 ring-1 ring-brand-500/20')}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-0.5">
          <span className={cn('size-2.5 rounded-full', current ? 'bg-brand-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700')} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {slot.isMakeup && <Badge tone="special">Makeup</Badge>}
            {slot.isSpecial && <Badge tone="info">Special</Badge>}
            {slot.slotType === 'LAB' && <Badge tone="purple">Lab</Badge>}
          </div>
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-0.5">{slot.subjectName}</h4>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{formatTime(slot.startTime, timeFormat)} – {formatTime(slot.endTime, timeFormat)}</span>
            {slot.room && <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{slot.room}</span>}
            {slot.faculty && <span className="inline-flex items-center gap-1"><User size={12} aria-hidden />{slot.faculty}</span>}
          </div>
          {statusLabel && statusLabel !== '—' && (
            <div className="mt-2">
              <Badge tone={statusLabel === 'Present' ? 'success' : 'danger'}>{statusLabel}</Badge>
            </div>
          )}
        </div>
      </div>
      {(onMark || onNotHeld) && (
        <div className="mt-3 flex items-center gap-2">
          {onMark && (
            <>
              <button
                onClick={() => onMark('PRESENT')}
                className={cn('flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium transition-colors',
                  marked && statusLabel === 'Present'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60')}
                aria-label={`Mark ${slot.subjectName} present`}
              >
                <Check size={16} aria-hidden /> Present
              </button>
              <button
                onClick={() => onMark('ABSENT')}
                className={cn('flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium transition-colors',
                  marked && statusLabel === 'Absent'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60')}
                aria-label={`Mark ${slot.subjectName} absent`}
              >
                <X size={16} aria-hidden /> Absent
              </button>
              <button
                onClick={onNotHeld}
                className="inline-flex items-center justify-center size-9 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
                title="Mark as not held / cancelled"
                aria-label={`Mark ${slot.subjectName} not held`}
              >
                <HelpCircle size={16} aria-hidden />
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

// ---------- Timeline ----------

export function TodayTimeline({ slots, statusLabels, onMark, onNotHeld, timeFormat = '12h' }: {
  slots: TodaySlot[]
  statusLabels: Record<string, string>
  onMark: (slot: TodaySlot, status: 'PRESENT' | 'ABSENT') => void
  onNotHeld?: (slot: TodaySlot) => void
  timeFormat?: '12h' | '24h'
}) {
  if (slots.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <CalendarDays size={20} className="mr-2" aria-hidden /> No classes scheduled today.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {slots.map((s, i) => (
        <div key={s.id} className="relative">
          {i < slots.length - 1 && <div className="absolute left-[5px] top-4 bottom-[-16px] w-px bg-slate-200 dark:bg-slate-800" aria-hidden />}
          <TodayTimelineRow slot={s} statusLabel={statusLabels[s.subjectName + s.startTime] ?? '—'} onMark={onMark} onNotHeld={onNotHeld} timeFormat={timeFormat} />
        </div>
      ))}
    </div>
  )
}

function TodayTimelineRow({ slot, statusLabel, onMark, onNotHeld, timeFormat }: {
  slot: TodaySlot
  statusLabel: string
  onMark: (slot: TodaySlot, status: 'PRESENT' | 'ABSENT') => void
  onNotHeld?: (slot: TodaySlot) => void
  timeFormat?: '12h' | '24h'
}) {
  return (
    <div className="relative pl-6">
      <span className={cn('absolute left-0 top-4.5 size-[11px] rounded-full border-2 bg-white dark:bg-slate-900',
        statusLabel === 'Present' ? 'border-emerald-500' : statusLabel === 'Absent' ? 'border-red-500' : 'border-slate-300 dark:border-slate-600')} aria-hidden />
      <ClassCard slot={slot} statusLabel={statusLabel} onMark={slot.isSpecial || slot.isMakeupOverride ? undefined : (s) => onMark(slot, s)} onNotHeld={slot.isSpecial ? undefined : () => onNotHeld?.(slot)} timeFormat={timeFormat} />
    </div>
  )
}

// ---------- Subject card ----------

export function SubjectCard({ name, pct, present, conducted, target, classesNeeded, risk, onClick }: {
  name: string
  pct: number | null
  present: number
  conducted: number
  target: number
  classesNeeded: number | null
  risk: RiskLevel
  onClick?: () => void
}) {
  return (
    <Card onClick={onClick} className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{present} / {conducted} classes</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-lg font-bold tabular-nums', pct === null ? 'text-slate-400' : pct >= target ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {pct === null ? 'N/A' : `${pct.toFixed(1)}%`}
          </p>
        </div>
      </div>
      <div className="mt-2">
        <Progress value={pct ?? 0} max={100} />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <Badge tone={riskTone(risk)}>{riskLabel(risk)}</Badge>
        {classesNeeded ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{classesNeeded} classes to {target}%</p>
        ) : null}
      </div>
    </Card>
  )
}

export function riskLabel(risk: RiskLevel): string {
  switch (risk) {
    case 'EXCELLENT': return 'EXCELLENT'
    case 'SAFE': return 'SAFE'
    case 'WATCH': return 'WATCH'
    case 'AT_RISK': return 'AT RISK'
    case 'CRITICAL': return 'CRITICAL'
    case 'UNRECOVERABLE': return 'UNRECOVERABLE'
    default: return 'SAFE'
  }
}

// ---------- Next class ----------

export function NextClassCard({ subject, startTime, endTime, room, current, timeFormat = '12h' }: {
  subject: string
  startTime: string
  endTime: string
  room?: string
  current?: boolean
  timeFormat?: '12h' | '24h'
}) {
  return (
    <Card className="p-4 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50/60 to-white dark:from-brand-950/30 dark:to-slate-900">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">
        <Clock size={12} aria-hidden /> {current ? 'Now' : 'Next'}
      </div>
      <h4 className="font-semibold text-base text-slate-900 dark:text-white mt-1">{subject}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 tabular-nums">
        {formatTime(startTime, timeFormat)} – {formatTime(endTime, timeFormat)}
      </p>
      {room && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{room}</p>}
    </Card>
  )
}

// ---------- Insight ----------

export function InsightItem({ level, text, action }: { level: 'critical' | 'warning' | 'info' | 'positive'; text: string; action?: string }) {
  const cls = level === 'critical' ? 'border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20' : level === 'warning' ? 'border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-800'
  return (
    <div className={cn('rounded-xl border px-3.5 py-2.5', cls)}>
      <p className="text-sm text-slate-800 dark:text-slate-100">{text}</p>
      {action && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{action}</p>}
    </div>
  )
}

// ---------- misc ----------

export function WeekdayPill({ dow, active, onClick }: { dow: number; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex-1 rounded-xl py-2 text-xs font-semibold transition-colors',
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700')}
    >
      {weekdayShort(dow)}
    </button>
  )
}

export function EmptySection({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8">
      <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">{icon}</div>
      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{title}</h4>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function healthStyle(h: HealthLevel): { title: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  switch (h) {
    case 'HEALTHY': return { title: 'HEALTHY', tone: 'success' }
    case 'WATCH': return { title: 'WATCH', tone: 'warning' }
    case 'AT_RISK': return { title: 'AT RISK', tone: 'danger' }
    case 'CRITICAL': return { title: 'CRITICAL', tone: 'danger' }
    default: return { title: '—', tone: 'neutral' }
  }
}