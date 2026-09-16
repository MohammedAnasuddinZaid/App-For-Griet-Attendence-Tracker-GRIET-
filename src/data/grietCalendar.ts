// Official GRIET 2026-27 academic calendar data.
// Source: https://www.griet.ac.in/academic_calendar.php
// These are academic-calendar PERIODS, not individual holiday dates.
// The app must distinguish instruction, exams, preparation holidays,
// semester breaks, and actual holidays. Never convert every period to
// a generic holiday.
import type { CalendarEvent } from '@/types'

interface Period {
  label: string
  from: string
  to?: string
  eventType: CalendarEvent['eventType']
  affectsAttendance: boolean
  isCollegeClosed: boolean
  isInstructionalDay: boolean
  isExamDay: boolean
  isVacation: boolean
}

type YearCal = Record<string, Period[]>

// Academic-year period structures per B.Tech year, as supplied.
// NOTE: Periods alone do not mark every day as holiday. SLOT boundaries:
//   - INSTRUCTIONAL periods set isInstructionalDay = true
//   - Exam periods set isExamDay = true
//   - Vacation/break periods set isVacation = true, isCollegeClosed = true
//   - Mid-term exams: isExamDay true, college open (mid-terms held on campus)
const CALENDARS: Record<string, YearCal> = {
  I_BTECH: {
    semester1: [
      { label: 'Induction Programme', from: '2026-08-11', to: '2026-08-17', eventType: 'SPECIAL_EVENT', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: false, isVacation: false },
      { label: 'I Spell of Instructions', from: '2026-08-18', to: '2026-10-12', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'I Mid-term Examinations', from: '2026-10-13', to: '2026-10-17', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'II Spell of Instructions', from: '2026-10-21', to: '2026-12-15', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'II Mid-term Examinations', from: '2026-12-16', to: '2026-12-22', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Preparation Holidays & End Semester Exams', from: '2026-12-23', to: '2027-01-12', eventType: 'EXAM', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Semester Break', from: '2027-01-13', to: '2027-01-16', eventType: 'SEMESTER_BREAK', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: false, isVacation: true }
    ],
    semester2: [
      { label: 'Commencement / I Spell of Instructions', from: '2027-01-18', to: '2027-03-12', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'I Mid-term Examinations', from: '2027-03-15', to: '2027-03-19', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'II Spell of Instructions', from: '2027-03-20', to: '2027-05-07', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'Summer Vacation', from: '2027-05-08', to: '2027-05-22', eventType: 'VACATION', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: false, isVacation: true },
      { label: 'II Spell Continuation', from: '2027-05-24', to: '2027-05-29', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'II Mid-term Examinations', from: '2027-05-31', to: '2027-06-05', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Preparation & End Semester Exams', from: '2027-06-07', to: '2027-06-24', eventType: 'EXAM', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Next Semester Class Work (2027-28)', from: '2027-07-05', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false }
    ]
  },
  II_BTECH: {
    semester1: [
      { label: 'Commencement / I Spell of Instructions', from: '2026-08-06', to: '2026-10-03', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'I Mid-term Examinations', from: '2026-10-05', to: '2026-10-08', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'II Spell of Instructions (incl. Dussehra vacation per GRIET)', from: '2026-10-09', to: '2026-12-03', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'II Mid-term Examinations', from: '2026-12-04', to: '2026-12-08', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Preparation Holidays & End Semester Exams', from: '2026-12-09', to: '2026-12-29', eventType: 'EXAM', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: true, isVacation: false }
    ],
    semester2: [
      { label: 'Commencement / I Spell of Instructions (incl. Sankranti vacation per GRIET)', from: '2026-12-30', to: '2027-02-23', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'I Mid-term Examinations', from: '2027-02-24', to: '2027-03-01', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'II Spell of Instructions', from: '2027-03-02', to: '2027-04-26', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'II Mid-term Examinations', from: '2027-04-27', to: '2027-04-30', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Preparation & End Semester Exams', from: '2027-05-01', to: '2027-05-21', eventType: 'EXAM', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: true, isVacation: false }
    ]
  },
  III_BTECH: {
    semester1: [
      { label: 'Commencement / I Spell of Instructions', from: '2026-06-30', to: '2026-08-24', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'I Mid-term Examinations', from: '2026-08-25', to: '2026-08-28', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'II Spell of Instructions (incl. Dussehra vacation per GRIET)', from: '2026-08-29', to: '2026-10-30', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'II Mid-term Examinations', from: '2026-11-02', to: '2026-11-04', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Preparation Holidays & End Semester Exams', from: '2026-11-05', to: '2026-11-25', eventType: 'EXAM', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Semester Break', from: '2026-11-26', to: '2026-12-02', eventType: 'SEMESTER_BREAK', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: false, isVacation: true }
    ],
    semester2: [
      { label: 'Commencement / I Spell of Instructions (incl. Sankranti vacation per GRIET)', from: '2026-12-03', to: '2027-01-27', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'I Mid-term Examinations', from: '2027-01-28', to: '2027-01-30', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'II Spell of Instructions', from: '2027-02-01', to: '2027-03-31', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'II Mid-term Examinations', from: '2027-04-01', to: '2027-04-03', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Preparation Holidays & End Semester Exams', from: '2027-04-05', to: '2027-04-30', eventType: 'EXAM', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: true, isVacation: false }
    ]
  },
  IV_BTECH: {
    semester1: [
      { label: 'Commencement / I Spell of Instructions', from: '2026-06-15', to: '2026-08-11', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'I Mid-term Examinations', from: '2026-08-12', to: '2026-08-14', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'II Spell of Instructions', from: '2026-08-17', to: '2026-10-09', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'II Mid-term Examinations', from: '2026-10-12', to: '2026-10-14', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Preparation Holidays & End Semester Exams', from: '2026-10-15', to: '2026-11-07', eventType: 'EXAM', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Semester Break', from: '2026-11-09', to: '2026-11-14', eventType: 'SEMESTER_BREAK', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: false, isVacation: true }
    ],
    semester2: [
      { label: 'Commencement / I Spell of Instructions (incl. Sankranti vacation per GRIET)', from: '2026-11-16', to: '2027-01-16', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'I Mid-term Examinations', from: '2027-01-18', to: '2027-01-19', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'II Spell of Instructions', from: '2027-01-20', to: '2027-03-09', eventType: 'INSTRUCTIONAL', affectsAttendance: true, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false, isVacation: false },
      { label: 'II Mid-term Examinations', from: '2027-03-11', to: '2027-03-12', eventType: 'MIDTERM', affectsAttendance: false, isCollegeClosed: false, isInstructionalDay: false, isExamDay: true, isVacation: false },
      { label: 'Preparation Holidays & End Semester Exams', from: '2027-03-13', to: '2027-04-02', eventType: 'EXAM', affectsAttendance: false, isCollegeClosed: true, isInstructionalDay: false, isExamDay: true, isVacation: false }
    ]
  }
}

export const YEAR_TO_CAL = {
  I: 'I_BTECH',
  II: 'II_BTECH',
  III: 'III_BTECH',
  IV: 'IV_BTECH'
} as const

export function getGrietSeedEvents(year: string, semester: string): CalendarEvent[] {
  const calKey = YEAR_TO_CAL[year as keyof typeof YEAR_TO_CAL]
  if (!calKey) return []
  const sem = semester === 'I' || semester === '1' ? 'semester1' : 'semester2'
  const periods = CALENDARS[calKey]?.[sem] ?? []
  const now = new Date().toISOString()
  const events: CalendarEvent[] = []
  for (const p of periods) {
    let cursor = p.from
    const push = (date: string) => {
      const effective =
        p.eventType === 'INSTRUCTIONAL' && p.label.toLowerCase().includes('incl')
          ? `${p.label} (holidays within period handled by other sources)`
          : p.label
      events.push({
        id: `griet-${calKey}-${sem}-${date}`,
        date,
        title: effective.length > 80 ? `${p.label}` : p.label,
        description: effective !== p.label ? effective : undefined,
        eventType: p.eventType,
        source: 'GRIET_ACADEMIC_CALENDAR',
        sourcePriority: 2,
        affectsAttendance: p.affectsAttendance,
        isCollegeClosed: p.isCollegeClosed,
        isInstructionalDay: p.isInstructionalDay,
        isExamDay: p.isExamDay,
        isVacation: p.isVacation,
        isManualOverride: false,
        createdAt: now,
        updatedAt: now
      })
    }
    if (!p.to) {
      push(cursor)
    } else {
      while (cursor <= p.to) {
        push(cursor)
        cursor = addDays(cursor, 1)
      }
    }
  }
  return dedupeByDate(events, 'griet')
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return formatDateLocal(d)
}

// Local timezone-safe formatting (never use toISOString which shifts to UTC)
export function formatDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dedupeByDate(events: CalendarEvent[], prefix: string): CalendarEvent[] {
  const seen = new Set<string>()
  const out: CalendarEvent[] = []
  for (const e of events) {
    if (seen.has(e.date)) continue
    seen.add(e.date)
    out.push({ ...e, id: `${prefix}-${e.date}` })
  }
  return out
}

export function seedCalendarEventsFor(year: string, semester: string) {
  return getGrietSeedEvents(year, semester)
}