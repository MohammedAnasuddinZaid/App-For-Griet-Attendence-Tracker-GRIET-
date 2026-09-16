// AI orchestrator: intents + tools + verified results + explanation.
// The orchestrator NEVER computes attendance math itself — it delegates to
// the deterministic engines and explains their verified output.
import type { AiIntent, AiResponse, AiChatRequest, AiToolResult } from '@/types'
import { detectIntent, extractTarget } from './intents'
import { chatWithAi } from './provider'
import type { StudentProfile, AppSettings } from '@/types'
import { getAttendanceByProfile, getActiveTimetable, getSlots, getSpecialDates, getCalendarEvents, getOverrides } from '@/services/dataService'
import { computeSummary, classesNeeded, maxSafeAbsences } from '@/services/attendanceEngine'
import { generateDailySchedule, detectClassPosition } from '@/services/timetableEngine'
import { resolveCalendarDate } from '@/services/calendarEngine'
import { todayStr } from '@/utils/date'
import { computeAllSubjectStats, countRemainingClasses } from '@/services/analyticsEngine'
import { uid } from '@/utils'

export interface AssistantContext {
  profile: StudentProfile
  settings: AppSettings
}

export async function buildToolContext(profile: StudentProfile): Promise<AiToolResult> {
  const profileId = profile.id
  const [records, timetable, slots, specialDates, events, overrides] = await Promise.all([
    getAttendanceByProfile(profileId),
    getActiveTimetable(profileId),
    (async () => {
      const tt = await getActiveTimetable(profileId)
      return tt ? getSlots(tt.id) : []
    })(),
    getSpecialDates(profileId),
    getCalendarEvents(),
    getOverrides()
  ])

  const summary = computeSummary(records)
  const target = 75
  const remaining = timetable ? countRemainingClasses(slots, specialDates, events, overrides.map((o) => ({ date: o.date, toStatus: o.toStatus, title: o.title })), endOfSemester()) : { count: 0, bySubject: {} }
  const subjectStats = computeAllSubjectStats(records, target, {})
  const today = todayStr()
  const daySlots = generateDailySchedule(slots, specialDates, today)
  const pos = detectClassPosition(daySlots)
  const dayStatus = resolveCalendarDate(today, events, overrides.map((o) => ({ date: o.date, title: o.title, toStatus: o.toStatus })))

  const subjectList = subjectStats.map((s) => ({
    name: s.subjectName,
    percentage: s.percentage,
    classesNeeded: s.classesNeeded,
    maxSafeAbsences: s.maxSafeAbsences
  }))

  return {
    profileId,
    name: profile.name,
    attendance: { present: summary.present, conducted: summary.conducted, percentage: summary.percentage, absent: summary.absent },
    target,
    subjects: subjectList,
    maxSafeAbsences: maxSafeAbsences(summary.present, summary.conducted, target),
    classesNeeded: classesNeeded(summary.present, summary.conducted, target),
    remainingClasses: remaining.count,
    nearestClass: pos.next ? { subject: pos.next.subjectName, startTime: pos.next.startTime } : undefined,
    todaySchedule: daySlots.map((s) => ({ subject: s.subjectName, startTime: s.startTime, endTime: s.endTime })),
    todayStatus: dayStatus
  }
}

function endOfSemester(): string {
  const now = new Date()
  const m = now.getMonth()
  if (m >= 6) return `${now.getFullYear()}-12-31`
  return `${now.getFullYear()}-06-30`
}

export async function processAiMessage(
  message: string,
  profile: StudentProfile,
  conversationId?: string
): Promise<{ response: AiResponse; intent: AiIntent }> {
  const intent = detectIntent(message)
  const ctx = await buildToolContext(profile)

  const request: AiChatRequest = {
    conversationId,
    message,
    context: {
      profileId: profile.id,
      intent,
      toolResults: [ctx],
      preferences: { target: extractTarget(message) }
    }
  }

  const response = await chatWithAi(request)
  return { response, intent }
}

export { uid }