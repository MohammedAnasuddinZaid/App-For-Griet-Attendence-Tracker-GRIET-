import { describe, it, expect } from 'vitest'
import {
  generateDailySchedule,
  detectClassPosition,
  validateTimetableSlots,
  sortSlots,
  parseTimetableJson,
  type TodaySlot
} from '@/services/timetableEngine'
import type { TimetableSlot, SpecialTimetableDate } from '@/types'

function slot(over: Partial<TimetableSlot> & { id: string; dayOfWeek: number; startTime: string; endTime: string; subjectName: string }): TimetableSlot {
  return {
    timetableId: 'tt1',
    slotType: 'LECTURE',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over
  }
}

function specialDate(over: Partial<SpecialTimetableDate> & { overrideType: SpecialTimetableDate['overrideType'] }): SpecialTimetableDate {
  return {
    id: 'sp1',
    profileId: 'p1',
    date: '2026-01-05',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over
  }
}

// 2026-01-05 is a Monday (dayOfWeek 1). 2026-01-06 is Tuesday (2).
describe('generateDailySchedule', () => {
  const slots = [
    slot({ id: 'mon1', dayOfWeek: 1, startTime: '09:00', endTime: '09:50', subjectName: 'Maths' }),
    slot({ id: 'mon2', dayOfWeek: 1, startTime: '10:00', endTime: '10:50', subjectName: 'Physics' }),
    slot({ id: 'tue1', dayOfWeek: 2, startTime: '09:00', endTime: '09:50', subjectName: 'Chemistry' })
  ]

  it('returns only the slots for the matching weekday on a normal day', () => {
    const day = generateDailySchedule(slots, [], '2026-01-05')
    expect(day.map((s) => s.id).sort()).toEqual(['mon1', 'mon2'])
    expect(day.every((s) => s.isMakeupOverride === false && s.isSpecial === false)).toBe(true)
  })

  it('removes all classes on REMOVE_CLASSES override', () => {
    const day = generateDailySchedule(slots, [specialDate({ overrideType: 'REMOVE_CLASSES' })], '2026-01-05')
    expect(day).toHaveLength(0)
  })

  it('returns an empty day on HOLIDAY override', () => {
    const day = generateDailySchedule(slots, [specialDate({ overrideType: 'HOLIDAY' })], '2026-01-05')
    expect(day).toHaveLength(0)
  })

  it('replaces the day with another weekday when REPLACE_DAY is set', () => {
    const day = generateDailySchedule(slots, [specialDate({ overrideType: 'REPLACE_DAY', replaceDayOfWeek: 2 })], '2026-01-05')
    expect(day.map((s) => s.id)).toEqual(['tue1-2026-01-05'])
    expect(day[0]?.isMakeupOverride).toBe(true)
    expect(day[0]?.isSpecial).toBe(true)
  })

  it('keeps base classes and adds extra slots on ADD_CLASSES', () => {
    const day = generateDailySchedule(
      slots,
      [specialDate({
        overrideType: 'ADD_CLASSES',
        slots: [{ startTime: '14:00', endTime: '14:50', subjectName: 'Extra Lab', slotType: 'LAB' }]
      })],
      '2026-01-05'
    )
    expect(day).toHaveLength(3)
    const extra = day.find((s) => s.subjectName === 'Extra Lab')
    expect(extra?.isMakeupOverride).toBe(true)
    expect(extra?.isSpecial).toBe(true)
  })
})

describe('detectClassPosition', () => {
  const slots: TodaySlot[] = [
    { ...slot({ id: 'a', dayOfWeek: 1, startTime: '09:00', endTime: '09:50', subjectName: 'Maths' }), isMakeupOverride: false, isSpecial: false },
    { ...slot({ id: 'b', dayOfWeek: 1, startTime: '10:00', endTime: '10:50', subjectName: 'Physics' }), isMakeupOverride: false, isSpecial: false }
  ]

  it('detects the current class when within its window', () => {
    const pos = detectClassPosition(slots, 9 * 60 + 20)
    expect(pos.current?.id).toBe('a')
    expect(pos.next?.id).toBe('b')
  })

  it('detects next class before the first class starts', () => {
    const pos = detectClassPosition(slots, 8 * 60 + 30)
    expect(pos.current).toBeNull()
    expect(pos.next?.id).toBe('a')
  })

  it('moves to the next class at its exact start time', () => {
    const pos = detectClassPosition(slots, 10 * 60)
    expect(pos.current?.id).toBe('b')
    expect(pos.previous?.id).toBe('a')
  })

  it('tracks the last class as previous after it ends', () => {
    const pos = detectClassPosition(slots, 12 * 60)
    expect(pos.current).toBeNull()
    expect(pos.next).toBeNull()
    expect(pos.previous?.id).toBe('b')
  })
})

describe('sortSlots', () => {
  it('orders slots chronologically', () => {
    const slots: TodaySlot[] = [
      { ...slot({ id: 'late', dayOfWeek: 1, startTime: '14:00', endTime: '14:50', subjectName: 'C' }), isMakeupOverride: false, isSpecial: false },
      { ...slot({ id: 'early', dayOfWeek: 1, startTime: '08:30', endTime: '09:20', subjectName: 'A' }), isMakeupOverride: false, isSpecial: false },
      { ...slot({ id: 'mid', dayOfWeek: 1, startTime: '09:30', endTime: '10:20', subjectName: 'B' }), isMakeupOverride: false, isSpecial: false }
    ]
    expect(sortSlots(slots).map((s) => s.id)).toEqual(['early', 'mid', 'late'])
  })
})

describe('validateTimetableSlots', () => {
  it('rejects invalid start time and end-before-start', () => {
    const errors = validateTimetableSlots([
      slot({ id: 'x', dayOfWeek: 1, startTime: '25:00', endTime: '09:10', subjectName: 'Maths' }),
      slot({ id: 'y', dayOfWeek: 1, startTime: '10:00', endTime: '09:10', subjectName: 'Physics' })
    ])
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })

  it('rejects duplicate slots on the same day and time', () => {
    const errors = validateTimetableSlots([
      slot({ id: 'x', dayOfWeek: 1, startTime: '09:00', endTime: '09:50', subjectName: 'Maths' }),
      slot({ id: 'y', dayOfWeek: 1, startTime: '09:00', endTime: '09:50', subjectName: 'Physics' })
    ])
    expect(errors.some((e) => e.field === 'slot')).toBe(true)
  })

  it('rejects overlapping classes on the same day', () => {
    const errors = validateTimetableSlots([
      slot({ id: 'x', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', subjectName: 'Maths' }),
      slot({ id: 'y', dayOfWeek: 1, startTime: '09:30', endTime: '10:30', subjectName: 'Physics' })
    ])
    expect(errors.some((e) => e.message.includes('Overlapping'))).toBe(true)
  })

  it('accepts a valid, non-overlapping timetable', () => {
    const errors = validateTimetableSlots([
      slot({ id: 'x', dayOfWeek: 1, startTime: '09:00', endTime: '09:50', subjectName: 'Maths' }),
      slot({ id: 'y', dayOfWeek: 1, startTime: '10:00', endTime: '10:50', subjectName: 'Physics' })
    ])
    expect(errors).toEqual([])
  })
})

describe('parseTimetableJson', () => {
  it('parses a valid timetable JSON payload', () => {
    const parsed = parseTimetableJson(JSON.stringify({
      academicYear: '2026-27',
      branch: 'CSE',
      section: 'A',
      slots: [
        { day: 'Monday', subjectName: 'Maths', startTime: '09:00', endTime: '09:50', room: 'B-101' },
        { day: 'Tuesday', subject: 'Physics', type: 'LAB', startTime: '14:00', endTime: '15:40' }
      ]
    }))
    expect(parsed.slots).toHaveLength(2)
    expect(parsed.slots[0]?.subjectName).toBe('Maths')
    expect(parsed.slots[1]?.slotType).toBe('LAB')
    expect(parsed.slots[1]?.subjectName).toBe('Physics')
  })

  it('throws on unknown day names', () => {
    expect(() => parseTimetableJson(JSON.stringify({ slots: [{ day: 'Funday', subjectName: 'X' }] }))).toThrow(/unknown day/)
  })

  it('throws on missing subject', () => {
    expect(() => parseTimetableJson(JSON.stringify({ slots: [{ day: 'Monday' }] }))).toThrow(/missing subject/)
  })
})