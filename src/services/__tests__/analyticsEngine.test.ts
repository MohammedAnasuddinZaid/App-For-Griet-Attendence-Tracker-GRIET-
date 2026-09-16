import { describe, it, expect } from 'vitest'
import { countRemainingClasses, evaluateConfidence, forecast, monthlySummaries } from '@/services/analyticsEngine'
import type { TimetableSlot, CalendarEvent, AttendanceRecord } from '@/types'

function slot(over: Partial<TimetableSlot> & { id: string; dayOfWeek: number }): TimetableSlot {
  return {
    timetableId: 'tt1',
    startTime: '09:00',
    endTime: '09:50',
    subjectName: 'Maths',
    slotType: 'LECTURE',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over
  }
}

function event(date: string, title: string, closed: boolean): CalendarEvent {
  return {
    id: 'ev-' + date,
    date,
    title,
    eventType: 'HOLIDAY',
    source: 'GRIET_ACADEMIC_CALENDAR',
    sourcePriority: 2,
    affectsAttendance: true,
    isCollegeClosed: closed,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

// Week of Mon 2026-01-05 through Fri 2026-01-09 (all instructional by default).
const mondaySlots = [slot({ id: 'm1', dayOfWeek: 1 }), slot({ id: 'm2', dayOfWeek: 1 })]
const otherDays = [2, 3, 4, 5].map((d) => slot({ id: `d${d}`, dayOfWeek: d }))
const allSlots = [...mondaySlots, ...otherDays]

describe('countRemainingClasses', () => {
  it('counts every scheduled class across instructional days', () => {
    const res = countRemainingClasses(allSlots, [], [], [], '2026-01-09', '2026-01-05')
    expect(res.count).toBe(2 + 4)
    expect(res.firstDate).toBe('2026-01-05')
    expect(res.lastDate).toBe('2026-01-09')
  })

  it('excludes days where GRIET is closed', () => {
    const res = countRemainingClasses(allSlots, [], [event('2026-01-07', 'GRIET closed', true)], [], '2026-01-09', '2026-01-05')
    expect(res.count).toBe(2 + 3)
    expect(res.dates).not.toContain('2026-01-07')
  })

  it('excludes weekends even when schedules exist', () => {
    const weekendSlot = [slot({ id: 'sat1', dayOfWeek: 6 })]
    const res = countRemainingClasses(weekendSlot, [], [], [], '2026-01-10', '2026-01-05')
    expect(res.count).toBe(0)
  })
})

describe('evaluateConfidence', () => {
  it('returns LOW with no timetable data', () => {
    expect(evaluateConfidence([], [])).toBe('LOW')
  })

  it('returns HIGH when enough days and classes are covered', () => {
    const full = [1, 2, 3, 4, 5].flatMap((d) => [
      slot({ id: `d${d}a`, dayOfWeek: d }),
      slot({ id: `d${d}b`, dayOfWeek: d }),
      slot({ id: `d${d}c`, dayOfWeek: d }),
      slot({ id: `d${d}d`, dayOfWeek: d })
    ])
    expect(evaluateConfidence(full, full)).toBe('HIGH')
  })

  it('returns MEDIUM for a partial timetable', () => {
    const partial = [1, 2, 3].flatMap((d) => [
      slot({ id: `x${d}a`, dayOfWeek: d }),
      slot({ id: `x${d}b`, dayOfWeek: d }),
      slot({ id: `x${d}c`, dayOfWeek: d })
    ])
    expect(evaluateConfidence(partial, partial)).toBe('MEDIUM')
  })
})

describe('forecast', () => {
  it('projects the best-case (attend everything) scenario', () => {
    const summary = { profileId: 'p1', present: 30, conducted: 40, absent: 10, excused: 0, cancelled: 0, notHeld: 0, percentage: 75 }
    const res = forecast(summary, 10, 'HIGH')
    expect(res.remainingClasses).toBe(10)
    expect(res.scenarios[0]?.projectedPercentage).toBeCloseTo(40 / 50 * 100)
    expect(res.scenarios[0]?.label).toBe('Attend 100% everything')
  })
})

describe('monthlySummaries', () => {
  it('groups records by month and reports present/conducted', () => {
    const base = { profileId: 'p1', subjectName: 'Maths', slotId: 's', timeSlot: '09:00', createdAt: 'x', updatedAt: 'x' }
    const records: AttendanceRecord[] = [
      { ...base, id: 'a', date: '2026-01-05', status: 'PRESENT' },
      { ...base, id: 'b', date: '2026-01-06', status: 'ABSENT' },
      { ...base, id: 'c', date: '2026-02-02', status: 'PRESENT' }
    ]
    const rows = monthlySummaries(records)
    expect(rows).toHaveLength(2)
    const jan = rows.find((r) => r.monthKey === '2026-01')
    expect(jan?.present).toBe(1)
    expect(jan?.conducted).toBe(2)
  })
})