import { describe, it, expect } from 'vitest'
import { resolveCalendarDate } from '@/services/calendarEngine'
import type { CalendarEvent } from '@/types'

function evt(over: Partial<CalendarEvent> & { date: string; title: string }): CalendarEvent {
  return {
    ...over,
    id: over.id ?? 'e1',
    eventType: over.eventType ?? 'HOLIDAY',
    source: over.source ?? 'GRIET_ACADEMIC_CALENDAR',
    sourcePriority: over.sourcePriority ?? 2,
    affectsAttendance: over.affectsAttendance ?? false,
    createdAt: over.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: over.updatedAt ?? '2026-01-01T00:00:00.000Z'
  }
}

// Fixtures (weekdays verified):
// 2026-01-03 = Saturday, 2026-01-04 = Sunday,
// 2026-01-05 = Monday, 2026-01-06 = Tuesday, 2026-01-07 = Wednesday,
// 2026-01-26 = Monday, 2026-09-16 = Wednesday.

describe('resolveCalendarDate priority', () => {
  it('returns a normal instructional day when no sources apply', () => {
    const res = resolveCalendarDate('2026-09-16', [])
    expect(res.status).toBe('INSTRUCTIONAL_DAY')
    expect(res.isInstructionalDay).toBe(true)
    expect(res.isCollegeClosed).toBe(false)
    expect(res.conflict).toBe(false)
  })

  it('returns WEEKEND on Saturday with no other sources', () => {
    const res = resolveCalendarDate('2026-01-03', [])
    expect(res.status).toBe('WEEKEND')
    expect(res.isInstructionalDay).toBe(false)
  })

  it('returns HOLIDAY_CANDIDATE for a Telangana state holiday on a weekday', () => {
    const res = resolveCalendarDate('2026-01-26', [
      evt({ date: '2026-01-26', title: 'Republic Day', source: 'TELANGANA_STATE_CALENDAR', sourcePriority: 4 })
    ])
    expect(res.status).toBe('HOLIDAY_CANDIDATE')
    expect(res.isCollegeClosed).toBe(false)
    expect(res.isInstructionalDay).toBe(false)
  })

  it('treats GRIET academic closure as CONFIRMED_HOLIDAY', () => {
    const res = resolveCalendarDate('2026-01-26', [
      evt({ date: '2026-01-26', title: 'GRIET holiday', isCollegeClosed: true, affectsAttendance: true })
    ])
    expect(res.status).toBe('CONFIRMED_HOLIDAY')
    expect(res.isCollegeClosed).toBe(true)
    expect(res.isInstructionalDay).toBe(false)
  })

  it('marks exam periods as closed with isExamDay', () => {
    const res = resolveCalendarDate('2026-01-07', [
      evt({ date: '2026-01-07', title: 'Mid-term exams', eventType: 'EXAM', isCollegeClosed: true, isExamDay: true, affectsAttendance: false })
    ])
    expect(res.status).toBe('CONFIRMED_HOLIDAY')
    expect(res.isExamDay).toBe(true)
    expect(res.isCollegeClosed).toBe(true)
  })

  it('marks vacation as a semester break closure', () => {
    const res = resolveCalendarDate('2026-09-16', [
      evt({ date: '2026-09-16', title: 'Winter break', eventType: 'VACATION', isVacation: true, isCollegeClosed: true, affectsAttendance: false })
    ])
    expect(res.status).toBe('CONFIRMED_HOLIDAY')
    expect(res.isCollegeClosed).toBe(true)
  })

  it('reports a CONFLICT when GRIET says instructional but state lists a candidate', () => {
    const res = resolveCalendarDate('2026-01-26', [
      evt({ date: '2026-01-26', title: 'Republic Day', source: 'TELANGANA_STATE_CALENDAR', sourcePriority: 4 }),
      evt({ date: '2026-01-26', title: 'Instructional period', isInstructionalDay: true, affectsAttendance: true, eventType: 'INSTRUCTIONAL' })
    ])
    expect(res.status).toBe('CONFLICT')
    expect(res.conflict).toBe(true)
    expect(res.conflictDetails?.length).toBeGreaterThan(0)
  })

  it('surfaces non-closure academic events as GRIET_EVENT', () => {
    const res = resolveCalendarDate('2026-01-07', [
      evt({ date: '2026-01-07', title: 'Induction day', eventType: 'SPECIAL_EVENT', affectsAttendance: false })
    ])
    expect(res.status).toBe('GRIET_EVENT')
    expect(res.isInstructionalDay).toBe(false)
  })
})

describe('user overrides', () => {
  it('a holiday override beats every calendar source', () => {
    const res = resolveCalendarDate('2026-01-26',
      [
        evt({ date: '2026-01-26', title: 'GRIET holiday', isCollegeClosed: true, affectsAttendance: true }),
        evt({ date: '2026-01-26', title: 'Republic Day', source: 'TELANGANA_STATE_CALENDAR', sourcePriority: 4 })
      ],
      [{ date: '2026-01-26', title: 'My trip', toStatus: 'holiday' }]
    )
    expect(res.status).toBe('CONFIRMED_HOLIDAY')
    expect(res.isCollegeClosed).toBe(true)
  })

  it('a working-day override keeps the day instructional despite a state candidate', () => {
    const res = resolveCalendarDate('2026-01-26',
      [evt({ date: '2026-01-26', title: 'Republic Day', source: 'TELANGANA_STATE_CALENDAR', sourcePriority: 4 })],
      [{ date: '2026-01-26', title: 'Working day', toStatus: 'working' }]
    )
    expect(res.status).toBe('INSTRUCTIONAL_DAY')
    expect(res.isInstructionalDay).toBe(true)
  })
})