// Calendar engine — layered academic-calendar model.
//
// Priority order (never silently overwrite a higher-priority source):
//   1. Student's explicit manual override
//   2. GRIET-specific academic calendar
//   3. GRIET-specific announced closure/event
//   4. Telangana government holiday calendar
//   5. Weekend/default rules
//   6. Normal instructional day
import type { CalendarEvent, CalendarStatus } from '@/types'
import { getDayOfWeek } from '@/utils/date'

export interface CalendarResolution {
  date: string
  status: CalendarStatus
  title: string
  detail: string
  sources: { label: string; priority: number; affectsAttendance: boolean }[]
  conflict: boolean
  isCollegeClosed: boolean
  isInstructionalDay: boolean
  isExamDay: boolean
  conflictDetails?: string[]
}

const WEEKEND_DAYS = [0, 6] // Sun, Sat

function emptyResolution(date: string): CalendarResolution {
  return {
    date,
    status: 'INSTRUCTIONAL_DAY',
    title: 'Instructional day',
    detail: 'Normal instructional day.',
    sources: [],
    conflict: false,
    isCollegeClosed: false,
    isInstructionalDay: true,
    isExamDay: false
  }
}

export function resolveCalendarDate(
  date: string,
  events: CalendarEvent[],
  overrides: { date: string; title: string; toStatus: string }[] = []
): CalendarResolution {
  const res = emptyResolution(date)
  const dayEvents = events.filter((e) => e.date === date)
  const override = overrides.find((o) => o.date === date)
  const dow = getDayOfWeek(date)
  const isWeekend = WEEKEND_DAYS.includes(dow)

  // Normalize: build candidate list sorted by source priority (lower = higher).
  const candidates = dayEvents
    .map((e) => ({
      event: e,
      priority: e.sourcePriority
    }))
    .sort((a, b) => a.priority - b.priority)

  // 1. User override first
  if (override) {
    res.sources.push({ label: 'User override', priority: 1, affectsAttendance: true })
    const isHolidayLike =
      override.toStatus.includes('holiday') ||
      override.toStatus.includes('closed') ||
      override.toStatus.includes('vacation') ||
      override.toStatus.includes('break') ||
      override.toStatus.includes('HOLIDAY') ||
      override.toStatus.includes('COLLEGE_CLOSED') ||
      override.toStatus === 'holiday'
    if (isHolidayLike) {
      res.status = 'CONFIRMED_HOLIDAY'
      res.title = override.title || 'Day off'
      res.detail = `Marked as holiday by your manual override (${override.toStatus}).`
      res.isCollegeClosed = true
      res.isInstructionalDay = false
    } else {
      res.status = 'INSTRUCTIONAL_DAY'
      res.title = override.title || 'Working day'
      res.detail = `Marked as a working day by your manual override.`
      res.isCollegeClosed = false
      res.isInstructionalDay = true
    }
    // Even with override, note any underlying conflict info
    if (dayEvents.some((e) => e.sourcePriority === 4)) {
      res.conflictDetails = ['A state holiday candidate exists, but your override takes precedence.']
    }
    return res
  }

  const grietEvents = candidates.filter((c) => c.event.source === 'GRIET_ACADEMIC_CALENDAR')
  const tgCandidateEvents = candidates.filter((c) => c.event.source === 'TELANGANA_STATE_CALENDAR')

  // 2. GRIET academic calendar (strongest institutional signal)
  const griet = grietEvents[0]
  if (griet) {
    res.sources.push({ label: 'GRIET academic calendar', priority: 2, affectsAttendance: griet.event.affectsAttendance })
    const e = griet.event
    const closed = e.isCollegeClosed === true
    const instructional = e.isInstructionalDay === true
    const exam = e.isExamDay === true
    const vacation = e.isVacation === true

    if (vacation) {
      res.status = 'CONFIRMED_HOLIDAY'
      res.title = 'Semester break / vacation'
      res.detail = `GRIET academic calendar: ${e.title} (${date}).`
      res.isCollegeClosed = true
      res.isInstructionalDay = false
    } else if (closed && exam) {
      res.status = 'CONFIRMED_HOLIDAY'
      res.title = e.title
      res.detail = `GRIET academic calendar: ${e.title}. No regular classes during the exam period.`
      res.isCollegeClosed = true
      res.isInstructionalDay = false
      res.isExamDay = true
    } else if (closed) {
      res.status = 'CONFIRMED_HOLIDAY'
      res.title = e.title
      res.detail = `GRIET academic calendar marks ${date} as ${e.title}.`
      res.isCollegeClosed = true
      res.isInstructionalDay = false
    } else if (instructional) {
      res.status = 'INSTRUCTIONAL_DAY'
      res.title = 'Working day'
      res.detail = `GRIET academic calendar: ${e.title} (instructional).`
      res.isInstructionalDay = true
      // Twilight: even on instructional days a state candidate may exist -> conflict
      if (tgCandidateEvents.length > 0) {
        res.status = 'CONFLICT'
        res.conflict = true
        res.title = 'Calendar conflict'
        res.detail =
          'Telangana calendar lists a holiday candidate, but the configured GRIET academic calendar indicates an instructional period.'
        res.conflictDetails = [
          `GRIET schedule requests instruction on ${date}.`,
          `State holiday candidate exists (${tgCandidateEvents[0]?.event.title ?? 'festival'}).`,
          'No GRIET closure is currently configured.'
        ]
      } else if (isWeekend) {
        // Weekend but GRIET says instructional — keep instructional (day type overrides weekend default)
      }
    } else if (exam) {
      res.status = 'GRIET_EVENT'
      res.title = 'Mid-term examinations'
      res.detail = `GRIET academic calendar: ${e.title}.`
      res.isExamDay = true
    } else {
      // Induction / special events — not attendance-affecting
      res.status = 'GRIET_EVENT'
      res.title = e.title
      res.detail = `GRIET academic calendar: ${e.title}.`
      res.isInstructionalDay = false
    }
    res.sources = dedupeSources(res.sources)
    return res
  }

  // 3-4. No GRIET event. Check state candidate.
  if (tgCandidateEvents.length > 0) {
    const cand = tgCandidateEvents[0]!.event
    res.sources.push({ label: 'Telangana state calendar', priority: 4, affectsAttendance: false })
    res.status = 'HOLIDAY_CANDIDATE'
    res.title = 'Possible holiday'
    res.detail = `State holiday candidate (${cand.title}). Not confirmed as a GRIET closure — verify GRIET schedule before relying on this.`
    res.isCollegeClosed = false
    res.isInstructionalDay = false
    res.conflictDetails = ['State holiday candidate detected. GRIET-specific confirmation is not available.']
    return res
  }

  // 5. Weekend
  if (isWeekend) {
    res.status = 'WEEKEND'
    res.title = 'Weekend'
    res.detail = 'No classes on a default weekend (Saturday/Sunday rules).'
    res.isInstructionalDay = false
    res.isCollegeClosed = false
    res.sources.push({ label: 'Weekend default rule', priority: 5, affectsAttendance: false })
    return res
  }

  // 6. Default instructional day
  res.status = 'INSTRUCTIONAL_DAY'
  res.title = 'Working day'
  res.detail = 'Normal instructional day (no conflicting sources).'
  res.sources = dedupeSources(res.sources)
  return res
}

function dedupeSources(
  arr: { label: string; priority: number; affectsAttendance: boolean }[]
): { label: string; priority: number; affectsAttendance: boolean }[] {
  const seen = new Set<string>()
  return arr.filter((s) => {
    if (seen.has(s.label)) return false
    seen.add(s.label)
    return true
  })
}

export const STATUS_META: Record<CalendarStatus, { color: string; badge: string; label: string }> = {
  INSTRUCTIONAL_DAY: {
    color: '#16a34a',
    badge: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950',
    label: 'Working day'
  },
  GRIET_EVENT: {
    color: '#0284c7',
    badge: 'text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-950',
    label: 'Academic event'
  },
  HOLIDAY_CANDIDATE: {
    color: '#7c3aed',
    badge: 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-950',
    label: 'Possible holiday'
  },
  CONFIRMED_HOLIDAY: {
    color: '#dc2626',
    badge: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950',
    label: 'Holiday / closed'
  },
  WEEKEND: {
    color: '#6b7280',
    badge: 'text-gray-700 bg-gray-200 dark:text-gray-300 dark:bg-gray-800',
    label: 'Weekend'
  },
  CONFLICT: {
    color: '#d97706',
    badge: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950',
    label: 'Calendar conflict'
  },
  UNCERTAIN: {
    color: '#d97706',
    badge: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950',
    label: 'Uncertain'
  }
}