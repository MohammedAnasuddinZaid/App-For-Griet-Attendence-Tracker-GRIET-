// Timetable engine. Generates "Today's classes", applies special timetable
// overrides, detects current/next/previous classes, and supports labs.
import type { TimetableSlot, SpecialTimetableDate, AttendanceRecord } from '@/types'
import { getDayOfWeek, todayStr, timeToMinutes } from '@/utils/date'

export interface TodaySlot extends TimetableSlot {
  isMakeupOverride: boolean
  isSpecial: boolean
}

export function generateDailySchedule(
  slots: TimetableSlot[],
  specialDates: SpecialTimetableDate[],
  date: string
): TodaySlot[] {
  const special = specialDates.find((s) => s.date === date)
  const dow = getDayOfWeek(date)

  if (special) {
    switch (special.overrideType) {
      case 'HOLIDAY':
      case 'REMOVE_CLASSES':
        return []
      case 'REPLACE_DAY': {
        const targetDow = special.replaceDayOfWeek ?? dow
        return slots
          .filter((s) => s.dayOfWeek === targetDow)
          .map((s) => ({ ...s, id: `${s.id}-${date}`, isMakeupOverride: true, isSpecial: true }))
      }
      case 'ADD_CLASSES':
      case 'SPECIAL_WORKING_DAY':
      case 'MAKEUP_CLASS': {
        const base = slots.filter((s) => s.dayOfWeek === dow)
        const extra = (special.slots ?? []).map((e) =>
          clutter(e, special)
        )
        return [...base.map((s) => ({ ...s, isMakeupOverride: false, isSpecial: true })), ...extra]
      }
      default:
        return slots
          .filter((s) => s.dayOfWeek === dow)
          .map((s) => ({ ...s, isMakeupOverride: true, isSpecial: true }))
    }
  }

  return slots
    .filter((s) => s.dayOfWeek === dow && s.isActive !== false)
    .map((s) => ({ ...s, isMakeupOverride: false, isSpecial: false }))
}

function clutter(
  e: { startTime: string; endTime: string; subjectName: string; faculty?: string; room?: string; slotType: NonNullable<TodaySlot['slotType']> },
  special: SpecialTimetableDate
): TodaySlot {
  const now = new Date().toISOString()
  return {
    id: `special-${special.id}-${e.startTime}-${e.subjectName}`,
    timetableId: special.timetableId ?? '',
    dayOfWeek: getDayOfWeek(todayStr()),
    startTime: e.startTime,
    endTime: e.endTime,
    subjectName: e.subjectName,
    faculty: e.faculty,
    room: e.room,
    slotType: e.slotType,
    isActive: true,
    isMakeupOverride: true,
    isSpecial: true,
    isMakeup: special.overrideType === 'MAKEUP_CLASS',
    createdAt: now,
    updatedAt: now
  }
}

export function sortSlots(slots: TodaySlot[]): TodaySlot[] {
  return [...slots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

export interface ClassPosition {
  previous: TodaySlot | null
  current: TodaySlot | null
  next: TodaySlot | null
}

export function detectClassPosition(slots: TodaySlot[], nowMinutes?: number): ClassPosition {
  const sorted = sortSlots(slots)
  const current = nowMinutes ?? minutesFromMidnight()

  let prev: TodaySlot | null = null
  let curr: TodaySlot | null = null
  let next: TodaySlot | null = null

  for (const s of sorted) {
    const start = timeToMinutes(s.startTime)
    const end = timeToMinutes(s.endTime)
    if (current >= start && current < end) {
      curr = s
    } else if (current < start) {
      next = s
      break
    } else if (current >= end) {
      prev = s
    }
  }

  return { previous: prev, current: curr, next }
}

function minutesFromMidnight(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export function linkAttendance(slots: TodaySlot[], records: AttendanceRecord[]): (TodaySlot & { attendance?: AttendanceRecord })[] {
  const map = new Map<string, AttendanceRecord>()
  for (const r of records) {
    map.set(r.slotId ?? r.id, r)
  }
  return slots.map((s) => ({
    ...s,
    attendance: map.get(s.id) ?? map.get(s.subjectName + s.startTime)
  }))
}

export function getTimetableForDayOnDesktop(
  slots: TimetableSlot[],
  dow: number
): TimetableSlot[] {
  return slots.filter((s) => s.dayOfWeek === dow && s.isActive !== false).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

export interface ValidationError {
  field: string
  message: string
  index?: number
}

export function validateTimetableSlots(slots: TimetableSlot[]): ValidationError[] {
  const errors: ValidationError[] = []
  const seen = new Set<string>()

  slots.forEach((s, i) => {
    if (!s.subjectName) {
      errors.push({ field: 'subjectName', message: 'Every class needs a subject.', index: i })
    }
    if (!s.dayOfWeek || s.dayOfWeek < 0 || s.dayOfWeek > 6) {
      errors.push({ field: 'dayOfWeek', message: 'Day must be Sunday–Saturday.', index: i })
    }
    if (!/^\d{1,2}:\d{2}$/.test(s.startTime)) {
      errors.push({ field: 'startTime', message: 'Invalid start time.', index: i })
    }
    if (!/^\d{1,2}:\d{2}$/.test(s.endTime)) {
      errors.push({ field: 'endTime', message: 'Invalid end time.', index: i })
    } else if (timeToMinutes(s.endTime) <= timeToMinutes(s.startTime)) {
      errors.push({ field: 'endTime', message: 'End time must be after start time.', index: i })
    }
    const key = `${s.dayOfWeek}-${s.startTime}-${s.endTime}`
    if (seen.has(key)) {
      errors.push({ field: 'slot', message: 'Duplicate class (same day & time) detected.', index: i })
    }
    seen.add(key)
  })

  // Overlap detection within the same day
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]!
      const b = slots[j]!
      if (a.dayOfWeek !== b.dayOfWeek) continue
      const aS = timeToMinutes(a.startTime)
      const aE = timeToMinutes(a.endTime)
      const bS = timeToMinutes(b.startTime)
      const bE = timeToMinutes(b.endTime)
      if (aS < bE && bS < aE) {
        errors.push({
          field: 'slot',
          message: `Overlapping classes on ${dayName(a.dayOfWeek)} (${a.subjectName} ${a.startTime} & ${b.subjectName} ${b.startTime}).`,
          index: j
        })
      }
    }
  }

  return errors
}

function dayName(d: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d] ?? ''
}

export function parseTimetableJson(text: string): {
  slots: TimetableSlot[]
  meta: { academicYear: string; year: string; branch: string; section: string; semester: string }
} {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('The file is not valid JSON.')
  }
  const root = data as {
    academicYear?: string
    year?: string
    branch?: string
    section?: string
    semester?: string
    slots?: unknown[]
  }
  if (!root || !Array.isArray(root.slots)) {
    throw new Error('The JSON must contain a "slots" array.')
  }
  const now = new Date().toISOString()
  const slots: TimetableSlot[] = root.slots.map((sRaw, i) => {
    const s = sRaw as Record<string, unknown>
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    }
    const dowRaw = String(s.day ?? '').toLowerCase()
    const dow = dayMap[dowRaw] ?? -1
    if (dow === -1) {
      throw new Error(`Row ${i + 1}: unknown day "${s.day}". Use Monday–Saturday.`)
    }
    if (!s.subjectName && !s.subject) {
      throw new Error(`Row ${i + 1}: missing subject name.`)
    }
    return {
      id: `imp-${Date.now()}-${i}`,
      timetableId: 'pending',
      dayOfWeek: dow,
      startTime: String(s.startTime ?? '09:00'),
      endTime: String(s.endTime ?? '09:50'),
      subjectName: String(s.subjectName ?? s.subject),
      subjectCode: s.subjectCode ? String(s.subjectCode) : undefined,
      faculty: s.faculty ? String(s.faculty) : undefined,
      room: s.room ? String(s.room) : undefined,
      slotType: (String(s.type ?? 'LECTURE').toUpperCase() === 'LAB' ? 'LAB' : 'LECTURE') as TimetableSlot['slotType'],
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
  })
  return {
    slots,
    meta: {
      academicYear: String(root.academicYear ?? '2026-27'),
      year: String(root.year ?? 'I'),
      branch: String(root.branch ?? 'CSE'),
      section: String(root.section ?? 'A'),
      semester: String(root.semester ?? 'I')
    }
  }
}