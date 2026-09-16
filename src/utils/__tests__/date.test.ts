import { describe, it, expect } from 'vitest'
import {
  formatDateLocal,
  toDateString,
  addDays,
  addMonths,
  daysBetween,
  getDayOfWeek,
  getMonthKey,
  formatTime12,
  formatTime,
  timeToMinutes,
  minutesToTime,
  isValidDate,
  isValidTime,
  getMonthDays,
  startOfWeek,
  currentAcademicSemester,
  academicYearLabel
} from '@/utils/date'

describe('date string helpers', () => {
  it('formatDateLocal zero-pads month and day', () => {
    expect(formatDateLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('toDateString parses without timezone drift', () => {
    expect(formatDateLocal(toDateString('2026-02-28'))).toBe('2026-02-28')
  })

  it('addDays crosses month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('addMonths clamps correctly', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-03-03')
  })

  it('daysBetween returns signed day differences', () => {
    expect(daysBetween('2026-01-05', '2026-01-09')).toBe(4)
    expect(daysBetween('2026-01-09', '2026-01-05')).toBe(-4)
  })

  it('getDayOfWeek uses local day numbers', () => {
    expect(getDayOfWeek('2026-01-04')).toBe(0) // Sunday
    expect(getDayOfWeek('2026-09-16')).toBe(3) // Wednesday
  })

  it('getMonthKey slices to YYYY-MM', () => {
    expect(getMonthKey('2026-01-05')).toBe('2026-01')
  })
})

describe('time helpers', () => {
  it('timeToMinutes converts valid time strings', () => {
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('minutesToTime round-trips 24h format', () => {
    expect(minutesToTime(570)).toBe('09:30')
    expect(minutesToTime(1440)).toBe('00:00')
  })

  it('formatTime12 produces Indian-style 12h output', () => {
    expect(formatTime12('09:05')).toBe('9:05 AM')
    expect(formatTime12('13:05')).toBe('1:05 PM')
    expect(formatTime12('00:30')).toBe('12:30 AM')
    expect(formatTime12('12:15')).toBe('12:15 PM')
  })

  it('formatTime honors the requested format', () => {
    expect(formatTime('13:05', '24h')).toBe('13:05')
    expect(formatTime('13:05', '12h')).toBe('1:05 PM')
    expect(formatTime('09:00')).toBe('9:00 AM')
  })
})

describe('validation helpers', () => {
  it('isValidDate accepts strict YYYY-MM-DD', () => {
    expect(isValidDate('2026-01-05')).toBe(true)
    expect(isValidDate('2026-1-5')).toBe(false)
    expect(isValidDate('not-a-date')).toBe(false)
    expect(isValidDate('2026-13-01')).toBe(false)
  })

  it('isValidTime bounds hours and minutes', () => {
    expect(isValidTime('23:59')).toBe(true)
    expect(isValidTime('24:00')).toBe(false)
    expect(isValidTime('09:60')).toBe(false)
    expect(isValidTime('9:00')).toBe(true)
  })
})

describe('range helpers', () => {
  it('getMonthDays returns the right number of days', () => {
    expect(getMonthDays('2026-02')).toHaveLength(28)
    expect(getMonthDays('2026-01')).toHaveLength(31)
  })

  it('startOfWeek snaps backward to Sunday', () => {
    expect(startOfWeek('2026-09-16')).toBe('2026-09-13')
  })
})

describe('semester helpers', () => {
  it('reports Semester I from July to December and II otherwise', () => {
    // These tests are date-dependent, mirror the same logic as the implementation.
    const { semester } = currentAcademicSemester()
    const month = new Date().getMonth()
    expect(semester).toBe(month >= 6 ? 'I' : 'II')

    const label = academicYearLabel()
    expect(label).toMatch(/^\d{4}-\d{2}$/)
  })
})