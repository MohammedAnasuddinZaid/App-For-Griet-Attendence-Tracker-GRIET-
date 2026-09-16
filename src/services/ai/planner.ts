// Attendance planner — deterministic constraint solving over the real schedule.
// In: profile attendance + timetable + calendar + constraints.
// Out: verified day-by-day plan with projections. Everything is computed,
// never guessed by a model.
import type { AttendanceRecord, TimetableSlot, SpecialTimetableDate, CalendarEvent, CalendarOverride } from '@/types'
import { todayStr, addDays } from '@/utils/date'
import { resolveCalendarDate } from '@/services/calendarEngine'
import { generateDailySchedule } from '@/services/timetableEngine'
import { computeSummary } from '@/services/attendanceEngine'

export interface PlanConstraint {
  unavailableDates: string[] // YYYY-MM-DD
  unavailableWeekdays: number[] // days with planned absences
  target: number
  endDate: string
  buffer: number
}

export interface PlanDay {
  date: string
  status: 'ATTEND' | 'ABSENT' | 'HOLIDAY' | 'NO_CLASS'
  subjects: string[]
  reason?: string
}

export interface PlanResult {
  feasible: boolean
  currentPct: number | null
  target: number
  endDate: string
  constrainedSlots: number
  attendCount: number
  requiredAttendancePct: number | null
  finalProjectedPct: number | null
  safetyBuffer: number | null
  days: PlanDay[]
  message: string
  unreachableReason?: string
}

export function buildPlan(opts: {
  records: AttendanceRecord[]
  slots: TimetableSlot[]
  specialDates: SpecialTimetableDate[]
  events: CalendarEvent[]
  overrides: CalendarOverride[]
  target: number
  endDate: string
  unavailableDates?: string[]
  unavailableWeekdays?: number[]
  buffer?: number
}): PlanResult {
  const summary = computeSummary(opts.records)
  const buffer = opts.buffer ?? 0
  const target = opts.target + buffer
  const unavailableDates = new Set(opts.unavailableDates ?? [])
  const unavailableWeekdays = new Set(opts.unavailableWeekdays ?? [])

  const days: PlanDay[] = []
  let cursor = todayStr()
  let constrainedSlots = 0
  while (cursor <= opts.endDate && days.length < 120) {
    const res = resolveCalendarDate(cursor, opts.events, opts.overrides.map((o) => ({ date: o.date, title: o.title, toStatus: o.toStatus })))
    const weekday = new Date(cursor + 'T00:00:00').getDay()
    const daySlots = generateDailySchedule(opts.slots, opts.specialDates, cursor)

    if ((res.isCollegeClosed || res.status === 'CONFIRMED_HOLIDAY' || (res.status === 'HOLIDAY_CANDIDATE' && unavailableWeekdays.size === 0)) && daySlots.length === 0) {
      days.push({ date: cursor, status: 'HOLIDAY', subjects: [] })
    } else if (daySlots.length === 0) {
      days.push({ date: cursor, status: 'NO_CLASS', subjects: [] })
    } else {
      const cannotAttend = unavailableDates.has(cursor) || unavailableWeekdays.has(weekday)
      constrainedSlots += cannotAttend ? daySlots.length : 0
      days.push({
        date: cursor,
        status: cannotAttend ? 'ABSENT' : 'ATTEND',
        subjects: daySlots.map((s) => s.subjectName),
        reason: cannotAttend ? 'User constraint' : undefined
      })
    }
    cursor = addDays(cursor, 1)
  }

  // Calculate feasibility exactly.
  const plannedAbsences = days.filter((d) => d.status === 'ABSENT').reduce((acc, d) => acc + d.subjects.length, 0)
  const attendable = days.filter((d) => d.status === 'ATTEND').reduce((acc, d) => acc + d.subjects.length, 0)
  const totalConducted = summary.conducted + plannedAbsences + attendable
  const finalPresent = summary.present + attendable
  const finalPct = totalConducted > 0 ? finalPresent / totalConducted * 100 : null

  // Required attendance among remaining future classes to reach target:
  // need (P + a)/(C + a + b) >= T  where b = planned absences count already fixed.
  const neededAttendClasses = (() => {
    const b = plannedAbsences
    if (target <= 0) return 0
    const P = summary.present
    const C = summary.conducted
    // (P + a) / (C + a + b) >= T * (C + a + b) >= P + a
    if (target >= 100) return Number.isFinite(aFromTarget()) ? aFromTarget() : Infinity
    // Solve: P + a >= T(C + a + b) => P + a >= TC + Ta + Tb => a(1-T) >= TC + Tb - P
    const a = (target * C + target * b - P) / (1 - target)
    return Math.max(0, Math.ceil(a - 1e-9))
  })()

  function aFromTarget() {
    return Infinity
  }

  const feasible = finalPct !== null && finalPct >= target - 1e-9 && neededAttendClasses <= attendable

  // Percentage of the remaining scheduled classes you must actually attend
  // to land exactly on the (buffered) target — anything above this is buffer.
  const requiredPct = attendable > 0 ? neededAttendClasses / attendable * 100 : null

  return {
    feasible,
    currentPct: summary.percentage,
    target,
    endDate: opts.endDate,
    constrainedSlots,
    attendCount: attendable,
    requiredAttendancePct: requiredPct,
    finalProjectedPct: finalPct,
    safetyBuffer: finalPct !== null ? finalPct - target : null,
    days,
    message: feasible
      ? `Plan is feasible. Attending ${attendable} of the remaining scheduled classes keeps you at or above ${target.toFixed(0)}%.`
      : `Under these constraints, ${target.toFixed(0)}% cannot be maintained with the currently scheduled classes.`,
    unreachableReason: feasible ? undefined : `Your committed absences on those dates make the target mathematically unreachable.`
  }
}