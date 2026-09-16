// Analytics, forecasting and planning engine.
import type { AttendanceRecord, TimetableSlot, SpecialTimetableDate, CalendarEvent, AttendanceSummary, ForecastResult, ForecastScenario, SubjectStats } from '@/types'
import { computeSummary, computeSubjectStats, maxSafeAbsences, classesNeeded } from '@/services/attendanceEngine'
import { resolveCalendarDate } from '@/services/calendarEngine'
import { generateDailySchedule } from '@/services/timetableEngine'
import { addDays, getMonthKey, todayStr, getDayOfWeek } from '@/utils/date'

export interface RemainingClassesResult {
  count: number
  bySubject: Record<string, number>
  firstDate: string | null
  lastDate: string | null
  dates: string[]
}

// Count remaining scheduled classes between today and endDate (inclusive),
// respecting calendar status (holidays/breaks/exams excluded) and overrides.
export function countRemainingClasses(
  slots: TimetableSlot[],
  specialDates: SpecialTimetableDate[],
  events: CalendarEvent[],
  overrides: { date: string; toStatus: string; title?: string }[],
  endDate: string,
  fromDate: string = todayStr()
): RemainingClassesResult {
  let count = 0
  const bySubject: Record<string, number> = {}
  const dates: string[] = []
  let firstDate: string | null = null
  let lastDate: string | null = null

  let cursor = fromDate
  while (cursor <= endDate && dates.length < 366) {
    const res = resolveCalendarDate(cursor, events, overrides.map((o) => ({ date: o.date, title: o.title ?? '', toStatus: o.toStatus })))
    if (res.status === 'INSTRUCTIONAL_DAY' || res.status === 'CONFLICT' || res.status === 'GRIET_EVENT') {
      const daySlots = generateDailySchedule(slots, specialDates, cursor)
      if (daySlots.length > 0) {
        dates.push(cursor)
        if (firstDate === null) firstDate = cursor
        lastDate = cursor
        for (const s of daySlots) {
          count++
          bySubject[s.subjectName] = (bySubject[s.subjectName] ?? 0) + 1
        }
      }
    }
    cursor = addDays(cursor, 1)
  }
  return { count, bySubject, firstDate, lastDate, dates }
}

export function forecast(
  summary: AttendanceSummary,
  remaining: number,
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
): ForecastResult {
  const scenarios: ForecastScenario[] = [
    { label: 'Attend everything', attendanceRate: 1.0, projectedPercentage: null },
    { label: 'Attend 90%', attendanceRate: 0.9, projectedPercentage: null },
    { label: 'Attend 80%', attendanceRate: 0.8, projectedPercentage: null },
    { label: 'Attend 75%', attendanceRate: 0.75, projectedPercentage: null }
  ]
  for (const s of scenarios) {
    const attend = Math.round(remaining * s.attendanceRate)
    const conducted = summary.conducted + remaining
    const present = summary.present + attend
    s.projectedPercentage = conducted > 0 ? present / conducted * 100 : null
    s.label = s.label.replace('Attend', `Attend ${s.attendanceRate === 1 ? '100' : Math.round(s.attendanceRate * 100)}%`)
  }
  return { scenarios, remainingClasses: remaining, confidence }
}

export function evaluateConfidence(slots: TimetableSlot[], allSlots: TimetableSlot[]): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (!allSlots || allSlots.length === 0) return 'LOW'
  const daysCovered = new Set(allSlots.map((s) => s.dayOfWeek)).size
  if (daysCovered >= 5 && slots.length >= 20) return 'HIGH'
  if (daysCovered >= 3 && slots.length >= 8) return 'MEDIUM'
  return 'LOW'
}

export interface MonthlySummary {
  monthKey: string
  label: string
  conducted: number
  present: number
  absent: number
  percentage: number | null
}

export function monthlySummaries(records: AttendanceRecord[]): MonthlySummary[] {
  const byMonth = new Map<string, AttendanceRecord[]>()
  for (const r of records) {
    const key = getMonthKey(r.date)
    const arr = byMonth.get(key)
    if (arr) arr.push(r)
    else byMonth.set(key, [r])
  }
  const out: MonthlySummary[] = []
  for (const [key, recs] of byMonth) {
    const s = computeSummary(recs)
    out.push({
      monthKey: key,
      label: formatMonth(key),
      conducted: s.conducted,
      present: s.present,
      absent: s.absent,
      percentage: s.percentage
    })
  }
  return out.sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

function formatMonth(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y ?? 0, (m ?? 1) - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export interface TrendPoint {
  date: string
  percentage: number | null
  conducted: number
}

// Rolling attendance trend: cumulative percentage over sequential classes.
export function attendanceTrend(records: AttendanceRecord[]): TrendPoint[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date) || String(a.timeSlot ?? '').localeCompare(String(b.timeSlot ?? '')))
  const points: TrendPoint[] = []
  let present = 0
  let conducted = 0
  let lastDate = ''
  for (const r of sorted) {
    if (r.status === 'CANCELLED' || r.status === 'NOT_HELD') continue
    if (r.status === 'PRESENT' || r.status === 'ONLINE') present++
    if (r.status === 'PRESENT' || r.status === 'ONLINE' || r.status === 'ABSENT' || r.status === 'EXCUSED') conducted++
    if (r.date !== lastDate) {
      points.push({
        date: r.date,
        percentage: conducted > 0 ? present / conducted * 100 : null,
        conducted
      })
      lastDate = r.date
    }
  }
  return points
}

export function trendSlope(points: TrendPoint[]): number | null {
  if (points.length < 3) return null
  const recent = points.slice(-5)
  if (recent.length < 2) return null
  const first = recent[0]!.percentage
  const last = recent[recent.length - 1]!.percentage
  if (first === null || last === null) return null
  return last - first
}

// Weekly heatmap data: 0=absent/..  1=fully attended
export function weeklyAttendanceQuality(records: AttendanceRecord[]): Record<string, number> {
  const byDay: Record<number, { present: number; conducted: number }> = { 0: { present: 0, conducted: 0 }, 1: { present: 0, conducted: 0 }, 2: { present: 0, conducted: 0 }, 3: { present: 0, conducted: 0 }, 4: { present: 0, conducted: 0 }, 5: { present: 0, conducted: 0 }, 6: { present: 0, conducted: 0 } }
  for (const r of records) {
    if (r.status === 'CANCELLED' || r.status === 'NOT_HELD') continue
    const dow = getDayOfWeek(r.date)
    const entry = byDay[dow] ?? { present: 0, conducted: 0 }
    if (r.status === 'PRESENT' || r.status === 'ONLINE') entry.present++
    if (r.status === 'PRESENT' || r.status === 'ONLINE' || r.status === 'ABSENT' || r.status === 'EXCUSED') entry.conducted++
    byDay[dow] = entry
  }
  const out: Record<string, number> = {}
  for (const [day, v] of Object.entries(byDay)) {
    out[day] = v.conducted > 0 ? v.present / v.conducted : 1
  }
  return out
}

export interface Insight {
  priority: number
  level: 'critical' | 'warning' | 'info' | 'positive'
  text: string
  action?: string
}

// Deterministic rules-based insight engine.
export function generateInsights(opts: {
  summary: AttendanceSummary
  target: number
  subjects: SubjectStats[]
  maxSafe: number | null
  classesNeeded: number | null
  trendDelta: number | null
  remainingClasses: number
  lowestSubject?: SubjectStats
  health: string
}): Insight[] {
  const insights: Insight[] = []
  const { summary, target, subjects, maxSafe, classesNeeded, trendDelta, remainingClasses, lowestSubject } = opts

  if (summary.percentage === null) {
    insights.push({ priority: 5, level: 'info', text: 'No attendance recorded yet. Mark your first class to start tracking.' })
  } else {
    const gap = summary.percentage - target
    if (gap < 0) {
      insights.push({
        priority: 1,
        level: 'critical',
        text: `Your attendance (${summary.percentage.toFixed(1)}%) is below your ${target}% target.`,
        action: classesNeeded ? `Attend the next ${classesNeeded} scheduled classes to reach ${target}%.` : undefined
      })
    } else if (gap < 3) {
      insights.push({
        priority: 3,
        level: 'warning',
        text: `You are close to your ${target}% target. A few absences could move you below it.`,
        action: maxSafe ? `You have room for ${maxSafe} additional absences.` : undefined
      })
    } else {
      insights.push({
        priority: 5,
        level: 'positive',
        text: `You have a healthy attendance buffer of ${gap.toFixed(1)} percentage points above your ${target}% target.`
      })
    }
  }

  const risky = subjects.filter((s) => s.percentage !== null && s.percentage < target)
  if (risky.length > 0) {
    const worst = risky.sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0))[0]!
    insights.push({
      priority: 4,
      level: 'warning',
      text: `${worst.subjectName} is currently your lowest-attendance subject at ${worst.percentage?.toFixed(1)}%.`,
      action: worst.classesNeeded ? `${worst.classesNeeded} classes needed to reach ${target}%.` : undefined
    })
  }

  if (lowestSubject && lowestSubject.subjectName && lowestSubject.percentage !== null && summary.percentage !== null && lowestSubject.percentage < summary.percentage) {
    insights.push({
      priority: 6,
      level: 'info',
      text: `${lowestSubject.subjectName} is ${(summary.percentage - lowestSubject.percentage).toFixed(1)} percentage points below your overall attendance.`
    })
  }

  if (trendDelta !== null) {
    if (trendDelta > 0.5) {
      insights.push({ priority: 5, level: 'positive', text: `Your attendance has improved by ${trendDelta.toFixed(1)} percentage points recently.` })
    } else if (trendDelta < -0.5) {
      insights.push({ priority: 2, level: 'warning', text: `Your attendance has decreased by ${Math.abs(trendDelta).toFixed(1)} percentage points recently.`, action: 'Review your recent absences.' })
    }
  }

  if (summary.percentage !== null && maxSafe !== null && maxSafe === 0 && summary.percentage >= target) {
    insights.push({ priority: 3, level: 'warning', text: `You have no room for additional absences while staying at your ${target}% target.` })
  }

  if (remainingClasses === 0 && summary.percentage !== null) {
    insights.push({ priority: 4, level: 'info', text: 'No future classes are in your configured timetable, so the semester forecast is limited.' })
  }

  return insights.sort((a, b) => a.priority - b.priority)
}

export function computeRemainingSafety(records: AttendanceRecord[], target: number) {
  const summary = computeSummary(records)
  return {
    summary,
    maxSafe: maxSafeAbsences(summary.present, summary.conducted, target),
    classesNeeded: classesNeeded(summary.present, summary.conducted, target),
    isBelow: summary.percentage !== null && summary.percentage < target
  }
}

export function computeAllSubjectStats(
  records: AttendanceRecord[],
  target: number,
  remainingBySubject: Record<string, number>
): SubjectStats[] {
  const bySubject = new Map<string, AttendanceRecord[]>()
  for (const r of records) {
    const key = r.subjectName || 'Unknown'
    const arr = bySubject.get(key)
    if (arr) arr.push(r)
    else bySubject.set(key, [r])
  }
  const out: SubjectStats[] = []
  for (const recs of bySubject.values()) {
    out.push(computeSubjectStats(recs, target, remainingBySubject))
  }
  return out.sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0))
}