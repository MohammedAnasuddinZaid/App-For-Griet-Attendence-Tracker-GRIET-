import { useEffect, useMemo, useState, useCallback } from 'react'
import type { StudentProfile, AppSettings, AttendanceRecord, TimetableSlot, SpecialTimetableDate, CalendarEvent, CalendarOverride, SubjectStats } from '@/types'
import {
  getAttendanceByProfile, getActiveTimetable, getSlots, getSpecialDates,
  getCalendarEvents, getOverrides, getSettings, ensureDefaultSettings
} from '@/services/dataService'
import { computeSummary, computeHealthLevel, maxSafeAbsences, classesNeeded } from '@/services/attendanceEngine'
import { resolveCalendarDate } from '@/services/calendarEngine'
import { generateDailySchedule, detectClassPosition, type TodaySlot } from '@/services/timetableEngine'
import { countRemainingClasses, generateInsights, evaluateConfidence, forecast, computeAllSubjectStats } from '@/services/analyticsEngine'
import { todayStr, addDays } from '@/utils/date'

export interface DashboardData {
  profile: StudentProfile | null
  settings: AppSettings | null
  records: AttendanceRecord[]
  slots: TimetableSlot[]
  specialDates: SpecialTimetableDate[]
  events: CalendarEvent[]
  overrides: CalendarOverride[]
  summary: ReturnType<typeof computeSummary>
  subjectStats: SubjectStats[]
  maxSafe: number | null
  classesNeeded: number | null
  health: string
  todayStatus: ReturnType<typeof resolveCalendarDate>
  todaySlots: TodaySlot[]
  classPosition: ReturnType<typeof detectClassPosition>
  remainingCount: number
  remainingBySubject: Record<string, number>
  insights: ReturnType<typeof generateInsights>
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  forecastData: ReturnType<typeof forecast>
  isLoading: boolean
  refresh: () => void
}

const empty: DashboardData = {
  profile: null,
  settings: null,
  records: [],
  slots: [],
  specialDates: [],
  events: [],
  overrides: [],
  summary: { profileId: '', conducted: 0, present: 0, absent: 0, excused: 0, cancelled: 0, notHeld: 0, percentage: null },
  subjectStats: [],
  maxSafe: null,
  classesNeeded: null,
  health: 'HEALTHY',
  todayStatus: { date: '', status: 'INSTRUCTIONAL_DAY', title: '', detail: '', sources: [], conflict: false, isCollegeClosed: false, isInstructionalDay: true, isExamDay: false },
  todaySlots: [],
  classPosition: { previous: null, current: null, next: null },
  remainingCount: 0,
  remainingBySubject: {},
  insights: [],
  confidence: 'LOW',
  forecastData: { scenarios: [], remainingClasses: 0, confidence: 'LOW' },
  isLoading: true,
  refresh: () => {}
}

export function useDashboardData(profile: StudentProfile | null): DashboardData {
  const [state, setState] = useState<DashboardData>(empty)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile) {
        setState((p) => (p.profile === null ? p : { ...empty, refresh }))
        return
      }
      setState((prev) => ({ ...prev, isLoading: true }))
      try {
        const [records, timetable, specialDates, events, overrides, settings] = await Promise.all([
          getAttendanceByProfile(profile.id),
          getActiveTimetable(profile.id),
          getSpecialDates(profile.id),
          getCalendarEvents(),
          getOverrides(),
          getSettings(profile.id).then((s) => (s ?? ensureDefaultSettings(profile.id)))
        ])

        const slots = timetable ? await getSlots(timetable.id) : []
        const target = settings?.attendanceTarget ?? 75
        const summary = computeSummary(records)

        const today = todayStr()
        const endDate = addDays(today, 120)
        const remaining = timetable
          ? countRemainingClasses(slots, specialDates, events, overrides.map((o) => ({ date: o.date, toStatus: o.toStatus })), endDate, today)
          : { count: 0, bySubject: {}, firstDate: null, lastDate: null, dates: [] }

        const subjectStats = computeAllSubjectStats(records, target, remaining.bySubject)
        const maxSafe = maxSafeAbsences(summary.present, summary.conducted, target)
        const classesNeededForTarget = classesNeeded(summary.present, summary.conducted, target)
        const belowTarget = summary.percentage !== null && summary.percentage < target
        const health = computeHealthLevel({
          percentage: summary.percentage,
          target,
          maxSafeAbsences: maxSafe,
          belowTarget
        })

        const todayStatus = resolveCalendarDate(today, events, overrides.map((o) => ({ date: o.date, title: o.title, toStatus: o.toStatus })))
        const todaySlots = generateDailySchedule(slots, specialDates, today)
        const classPosition = detectClassPosition(todaySlots)

        const confidence = evaluateConfidence(slots, slots)

        const insights = generateInsights({
          summary,
          target,
          subjects: subjectStats,
          maxSafe,
          classesNeeded: classesNeededForTarget === Infinity ? null : classesNeededForTarget,
          trendDelta: null,
          remainingClasses: remaining.count,
          lowestSubject: subjectStats[0],
          health
        })

        const forecastData = forecast(summary, remaining.count, confidence)

        if (!cancelled) {
          setState({
            profile,
            settings,
            records,
            slots,
            specialDates,
            events,
            overrides,
            summary,
            subjectStats,
            maxSafe,
            classesNeeded: classesNeededForTarget === Infinity ? null : classesNeededForTarget,
            health,
            todayStatus,
            todaySlots,
            classPosition,
            remainingCount: remaining.count,
            remainingBySubject: remaining.bySubject,
            insights,
            confidence,
            forecastData,
            isLoading: false,
            refresh
          })
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load dashboard data:', err)
          setState((prev) => ({ ...prev, isLoading: false, refresh }))
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [profile, profile?.id, tick, refresh])

  return useMemo(() => ({ ...state, refresh }), [state, refresh])
}