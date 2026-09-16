import { describe, it, expect } from 'vitest'
import {
  computeSummary,
  maxSafeAbsences,
  classesNeeded,
  afterAttending,
  afterMissing,
  project,
  isTargetReachable,
  maxPossiblePercentage,
  computeSubjectStats,
  classifySubjectRisk,
  computeHealthLevel
} from '@/services/attendanceEngine'
import type { AttendanceRecord } from '@/types'

function rec(over: Partial<AttendanceRecord> & Pick<AttendanceRecord, 'status'>): AttendanceRecord {
  return {
    id: 'r1',
    profileId: 'p1',
    date: '2026-01-05',
    subjectName: 'Maths',
    slotId: 's1',
    timeSlot: '09:00',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
    ...over
  }
}

describe('computeSummary', () => {
  it('counts each status and excludes NOT_HELD / CANCELLED from conducted', () => {
    const records = [
      rec({ status: 'PRESENT' }),
      rec({ id: 'r2', status: 'PRESENT' }),
      rec({ id: 'r3', status: 'ABSENT' }),
      rec({ id: 'r4', status: 'EXCUSED' }),
      rec({ id: 'r5', status: 'CANCELLED' }),
      rec({ id: 'r6', status: 'NOT_HELD' })
    ]
    const s = computeSummary(records)
    expect(s.present).toBe(2)
    expect(s.absent).toBe(1)
    expect(s.excused).toBe(1)
    expect(s.cancelled).toBe(1)
    expect(s.notHeld).toBe(1)
    // conducted = present + absent + excused when excused included
    expect(s.conducted).toBe(4)
    expect(s.percentage).toBeCloseTo(2 / 4 * 100)
  })

  it('does not count ONLINE as a separate bucket and treats it as present', () => {
    const s = computeSummary([rec({ status: 'ONLINE' }), rec({ id: 'r7', status: 'PRESENT' })])
    expect(s.present).toBe(2)
    expect(s.conducted).toBe(2)
  })

  it('can exclude excused from conducted when configured', () => {
    const s = computeSummary([rec({ status: 'PRESENT' }), rec({ id: 'r8', status: 'EXCUSED' })], { includeExcused: false })
    expect(s.conducted).toBe(1)
    expect(s.percentage).toBe(100)
  })

  it('returns percentage null and zeros for empty records', () => {
    const s = computeSummary([])
    expect(s.percentage).toBeNull()
    expect(s.conducted).toBe(0)
  })
})

describe('maxSafeAbsences', () => {
  it('returns the maximum additional absences that keep P/(C+x) >= target', () => {
    expect(maxSafeAbsences(40, 50, 75)).toBe(3)
    // verify boundary: 40/(50+4) would drop below 75
    expect(40 / 54 * 100).toBeLessThan(75)
  })

  it('returns 0 when already exactly at target', () => {
    expect(maxSafeAbsences(30, 40, 75)).toBe(0)
  })

  it('returns 0 when below target', () => {
    expect(maxSafeAbsences(30, 50, 75)).toBe(0)
  })

  it('returns Infinity when target is 0', () => {
    expect(maxSafeAbsences(10, 10, 0)).toBe(Infinity)
  })
})

describe('classesNeeded', () => {
  it('computes consecutive classes to attend to reach target', () => {
    // P=32, C=50, T=75% -> N = ceil((0.75*50 - 32)/0.25) = ceil(5.5/0.25) = 22
    expect(classesNeeded(32, 50, 75)).toBe(22)
    // verify: (32+22)/(50+22) = 75%
    expect((32 + 22) / (50 + 22) * 100).toBeCloseTo(75)
  })

  it('returns 0 when already at or above target', () => {
    expect(classesNeeded(40, 50, 75)).toBe(0)
  })

  it('returns Infinity when target is 100 and any class is missed', () => {
    expect(classesNeeded(39, 40, 100)).toBe(Infinity)
  })
})

describe('projection functions', () => {
  const summary = { profileId: 'p1', present: 30, conducted: 40, absent: 10, excused: 0, cancelled: 0, notHeld: 0, percentage: 75 }

  it('afterAttending projects added present and conducted', () => {
    const r = afterAttending(summary, 4)
    expect(r.projectedPresent).toBe(34)
    expect(r.projectedConducted).toBe(44)
    expect(r.projectedPercentage).toBeCloseTo(34 / 44 * 100)
  })

  it('afterMissing projects added conducted only', () => {
    const r = afterMissing(summary, 4)
    expect(r.projectedPresent).toBe(30)
    expect(r.projectedConducted).toBe(44)
    expect(r.projectedPercentage).toBeCloseTo(30 / 44 * 100)
  })

  it('project handles mixed scenarios', () => {
    const r = project(summary, 4, 2)
    expect(r.projectedPresent).toBe(34)
    expect(r.projectedConducted).toBe(46)
    expect(r.projectedPercentage).toBeCloseTo(34 / 46 * 100)
  })

  it('returns null percentage when nothing conducted', () => {
    const r = project({ ...summary, present: 0, conducted: 0, absent: 0 }, 0, 0)
    expect(r.projectedPercentage).toBeNull()
  })
})

describe('isTargetReachable / maxPossiblePercentage', () => {
  it('is reachable when attending all remaining classes clears the target', () => {
    const summary = { profileId: 'p1', present: 30, conducted: 40, absent: 10, excused: 0, cancelled: 0, notHeld: 0, percentage: 75 }
    expect(isTargetReachable(summary, 75, 10)).toBe(true)
    expect(maxPossiblePercentage(summary, 10)).toBeCloseTo(40 / 50 * 100)
  })

  it('is unreachable when even attending everything stays below target', () => {
    const summary = { profileId: 'p1', present: 30, conducted: 50, absent: 20, excused: 0, cancelled: 0, notHeld: 0, percentage: 60 }
    expect(isTargetReachable(summary, 75, 5)).toBe(false)
  })

  it('is unreachable with zero remaining classes below target', () => {
    const summary = { profileId: 'p1', present: 30, conducted: 50, absent: 20, excused: 0, cancelled: 0, notHeld: 0, percentage: 60 }
    expect(isTargetReachable(summary, 75, 0)).toBe(false)
  })
})

describe('computeSubjectStats', () => {
  it('computes per-subject stats and stores null-safe maxima', () => {
    const records = [
      rec({ subjectName: 'Maths', status: 'PRESENT' }),
      rec({ id: 'a', subjectName: 'Maths', status: 'PRESENT' }),
      rec({ id: 'b', subjectName: 'Maths', status: 'PRESENT' }),
      rec({ id: 'c', subjectName: 'Maths', status: 'PRESENT' }),
      rec({ id: 'd', subjectName: 'Maths', status: 'ABSENT' })
    ]
    const s = computeSubjectStats(records, 75, { 'Maths': 10 })
    expect(s.subjectName).toBe('Maths')
    expect(s.conducted).toBe(5)
    expect(s.present).toBe(4)
    expect(s.percentage).toBe(80)
    expect(s.classesNeeded).toBe(0)
    expect(s.maxSafeAbsences).toBe(0)
  })
})

describe('classifySubjectRisk', () => {
  it('flags at-risk subjects below target but within 10 points', () => {
    expect(classifySubjectRisk('Maths', { present: 7, conducted: 10 }, 75, null)).toBe('AT_RISK')
  })

  it('flags critical subjects more than 10 points below target', () => {
    expect(classifySubjectRisk('Maths', { present: 6, conducted: 10 }, 75, null)).toBe('CRITICAL')
  })

  it('flags subjects at or just above target as WATCH', () => {
    // 6/8 = 75% exactly at target -> WATCH
    expect(classifySubjectRisk('Maths', { present: 6, conducted: 8 }, 75, null)).toBe('WATCH')
    // 8/10 = 80% one step above target -> SAFE
    expect(classifySubjectRisk('Maths', { present: 8, conducted: 10 }, 75, null)).toBe('SAFE')
  })

  it('returns SAFE when no classes conducted', () => {
    expect(classifySubjectRisk('Maths', { present: 0, conducted: 0 }, 75, null)).toBe('SAFE')
  })
})

describe('computeHealthLevel', () => {
  it('reports CRITICAL beyond 10 points below target', () => {
    expect(computeHealthLevel({ percentage: 63, target: 75, maxSafeAbsences: 0, belowTarget: true })).toBe('CRITICAL')
  })

  it('reports AT_RISK between 5 and 10 points below target', () => {
    expect(computeHealthLevel({ percentage: 69, target: 75, maxSafeAbsences: 1, belowTarget: true })).toBe('AT_RISK')
  })

  it('reports WATCH slightly below target', () => {
    expect(computeHealthLevel({ percentage: 73, target: 75, maxSafeAbsences: 3, belowTarget: true })).toBe('WATCH')
  })

  it('reports HEALTHY when comfortably above target', () => {
    expect(computeHealthLevel({ percentage: 92, target: 75, maxSafeAbsences: 10, belowTarget: false })).toBe('HEALTHY')
  })

  it('reports HEALTHY when no data yet', () => {
    expect(computeHealthLevel({ percentage: null, target: 75, maxSafeAbsences: null, belowTarget: false })).toBe('HEALTHY')
  })
})