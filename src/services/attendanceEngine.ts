// Attendance calculation engine.
// Pure, deterministic functions. Never use rounded display values
// for calculations — always use raw integer counts.
import type { AttendanceRecord, AttendanceSummary, SubjectStats, RiskLevel, HealthLevel } from '@/types'

// Core formula conducteds:
//   conducted = present + absent + excused
//   NOT_HELD / CANCELLED never increase conducted count.
export type ConductedFilter = {
  includeExcused: boolean
}

export function computeSummary(
  records: AttendanceRecord[],
  filter: ConductedFilter = { includeExcused: true }
): AttendanceSummary {
  let present = 0
  let absent = 0
  let excused = 0
  let cancelled = 0
  let notHeld = 0

  for (const r of records) {
    switch (r.status) {
      case 'PRESENT':
      case 'ONLINE':
        present++
        break
      case 'ABSENT':
        absent++
        break
      case 'EXCUSED':
        excused++
        break
      case 'CANCELLED':
        cancelled++
        break
      case 'NOT_HELD':
        notHeld++
        break
      default:
        break
    }
  }

  const conducted = present + absent + (filter.includeExcused ? excused : 0)
  const percentage = conducted > 0 ? present / conducted * 100 : null

  return {
    profileId: records[0]?.profileId ?? '',
    present,
    absent,
    excused,
    cancelled,
    notHeld,
    conducted,
    percentage
  }
}

// Maximum additional absences x such that P / (C + x) >= T
// x <= P/T - C, floor appropriately. target is a fraction (0.75).
export function maxSafeAbsences(present: number, conducted: number, targetPct: number): number | null {
  if (targetPct <= 0) return Infinity
  if (targetPct >= 100) return 0
  const t = targetPct / 100
  const x = present / t - conducted
  const floorX = Math.floor(x + 1e-9)
  // verify boundary
  return Math.max(0, floorX)
}

// Classes to attend N such that (P+N)/(C+N) >= T
// N >= (T*C - P)/(1-T)
export function classesNeeded(present: number, conducted: number, targetPct: number): number | null {
  if (targetPct >= 100) {
    return conducted > present ? Infinity : 0
  }
  if (targetPct <= 0) return 0
  const t = targetPct / 100
  const num = t * conducted - present
  if (num <= 0) return 0
  const denom = 1 - t
  const n = Math.ceil(num / denom - 1e-9)
  return Math.max(0, n)
}

export interface ScenarioResult {
  projectedPresent: number
  projectedConducted: number
  projectedPercentage: number | null
}

// Project after attending n future classes.
export function afterAttending(summary: AttendanceSummary, n: number): ScenarioResult {
  return {
    projectedPresent: summary.present + n,
    projectedConducted: summary.conducted + n,
    projectedPercentage: n === 0 ? summary.percentage : (summary.present + n) / (summary.conducted + n) * 100
  }
}

// Project after missing n future classes (all become conducted absences).
export function afterMissing(summary: AttendanceSummary, n: number): ScenarioResult {
  return {
    projectedPresent: summary.present,
    projectedConducted: summary.conducted + n,
    projectedPercentage: n === 0 ? summary.percentage : summary.present / (summary.conducted + n) * 100
  }
}

// Mixed scenario: attend a, miss b.
export function project(summary: AttendanceSummary, attend: number, miss: number): ScenarioResult {
  const projectedConducted = summary.conducted + attend + miss
  const projectedPresent = summary.present + attend
  return {
    projectedPresent,
    projectedConducted,
    projectedPercentage: projectedConducted > 0 ? projectedPresent / projectedConducted * 100 : null
  }
}

export function remainingToReachTarget(
  summary: AttendanceSummary,
  targetPct: number
): number | null {
  return classesNeeded(summary.present, summary.conducted, targetPct)
}

// Maximum possible final percentage if ALL remaining classes (n) are attended.
export function maxPossiblePercentage(summary: AttendanceSummary, remainingClasses: number): number | null {
  return remainingClasses > 0 || summary.conducted > 0
    ? (summary.present + remainingClasses) / (summary.conducted + remainingClasses) * 100
    : null
}

// Whether a target is reachable given remaining scheduled classes.
export function isTargetReachable(
  summary: AttendanceSummary,
  targetPct: number,
  remainingClasses: number
): boolean {
  const max = maxPossiblePercentage(summary, remainingClasses)
  if (max === null) return targetPct <= 0
  return max >= targetPct - 1e-9
}

// Risk classification (app-generated planning indicator, NOT official).
// Purely based on measurable data.
export function classifySubjectRisk(
  _subjectName: string,
  stats: { present: number; conducted: number },
  target: number,
  remainingClasses: number | null,
  fallbackFromPct?: number | null
): RiskLevel {
  const pct = stats.conducted > 0 ? stats.present / stats.conducted * 100 : null
  if (pct === null) return 'SAFE'
  const effective = pct ?? fallbackFromPct ?? pct
  if (!isTargetReachable({ present: stats.present, conducted: stats.conducted, absent: 0, excused: 0, cancelled: 0, notHeld: 0, percentage: null, profileId: '' }, target, remainingClasses ?? 999999)) {
    if (remainingClasses !== null && remainingClasses < 999999) return 'UNRECOVERABLE'
  }
  if (effective >= target + 15) return 'EXCELLENT'
  if (effective >= target + 5) return 'SAFE'
  if (effective >= target) return 'WATCH'
  if (effective >= target - 10) return 'AT_RISK'
  return 'CRITICAL'
}

export function computeSubjectStats(
  records: AttendanceRecord[],
  target: number,
  remainingBySubject: Record<string, number> = {}
): SubjectStats {
  const summary = computeSummary(records)
  const remaining = remainingBySubject[records[0]?.subjectName ?? ''] ?? null
  const maxSafe = maxSafeAbsences(summary.present, summary.conducted, target)
  const needed = classesNeeded(summary.present, summary.conducted, target)
  const risk = classifySubjectRisk(records[0]?.subjectName ?? '', summary, target, remaining)

  return {
    subjectId: records[0]?.subjectId,
    subjectName: records[0]?.subjectName ?? 'Unknown',
    conducted: summary.conducted,
    present: summary.present,
    absent: summary.absent,
    excused: summary.excused,
    percentage: summary.percentage,
    target,
    classesNeeded: needed === Infinity ? null : needed,
    maxSafeAbsences: maxSafe === Infinity ? null : maxSafe,
    risk
  }
}

export function computeHealthLevel(stats: {
  percentage: number | null
  target: number
  maxSafeAbsences: number | null
  belowTarget: boolean
}): HealthLevel {
  if (stats.percentage === null) return 'HEALTHY'
  const gap = stats.percentage - stats.target
  if (stats.belowTarget) {
    if (gap <= -10) return 'CRITICAL'
    if (gap <= -5) return 'AT_RISK'
    return 'WATCH'
  }
  if (gap >= 15) return 'HEALTHY'
  if (gap >= 7) return 'HEALTHY'
  if (gap >= 3) return 'WATCH'
  if (stats.maxSafeAbsences !== null && stats.maxSafeAbsences <= 2) return 'AT_RISK'
  return 'WATCH'
}

export function pctChange(fromPct: number | null, toPct: number | null): number | null {
  if (fromPct === null || toPct === null) return null
  return toPct - fromPct
}

// Efficient grouping helper (avoids multiple passes where possible)
export function groupBySubject(records: AttendanceRecord[]): Map<string, AttendanceRecord[]> {
  const map = new Map<string, AttendanceRecord[]>()
  for (const r of records) {
    const key = r.subjectName
    const arr = map.get(key)
    if (arr) arr.push(r)
    else map.set(key, [r])
  }
  return map
}