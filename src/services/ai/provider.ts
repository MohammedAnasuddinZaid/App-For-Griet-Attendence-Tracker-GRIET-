// AI provider abstraction. The application never depends on a single vendor.
// Current default provider: deterministic local assistant (no model required).
// Future: OpenAICompatibleProvider, CloudAIProvider, LocalModelProvider.
import type { AiProvider, AiResponse, AiChatRequest, AiIntent, AiResponseType, AiToolResult } from '@/types'

export interface AiToolContext extends AiToolResult {
  profileId: string
  name: string
  attendance: {
    present: number
    conducted: number
    percentage: number | null
    absent: number
  }
  target: number
  subjects: { name: string; percentage: number | null; classesNeeded: number | null; maxSafeAbsences: number | null }[]
  maxSafeAbsences: number | null
  classesNeeded: number | null
  nearestClass?: { subject: string; startTime: string }
  todaySchedule: { subject: string; startTime: string; endTime: string }[]
}

const RETRYABLE_MSG = 'Please try again in a moment.'

function typed(response: AiResponse): AiResponse {
  return response
}

const MockProvider: AiProvider = {
  kind: 'LocalDeterministicAssistant',
  isConfigured: () => true,
  isAvailable: () => true,
  async chat(request: AiChatRequest): Promise<AiResponse> {
    const ctx = request.context.toolResults?.[0] as AiToolContext | undefined
    const intent = request.context.intent ?? 'GENERAL_KNOWLEDGE'
    return respond(intent, ctx ?? fallbackCtx())
  }
}

function fallbackCtx(): AiToolContext {
  return {
    profileId: '',
    name: 'student',
    attendance: { present: 0, conducted: 0, percentage: null, absent: 0 },
    target: 75,
    subjects: [],
    maxSafeAbsences: null,
    classesNeeded: null,
    todaySchedule: []
  }
}

function respond(intent: AiIntent, ctx: AiToolContext): AiResponse {
  const name = ctx.name || 'student'
  const pct = ctx.attendance.percentage
  const target = ctx.target

  switch (intent) {
    case 'GET_CURRENT_ATTENDANCE': {
      if (pct === null) {
        return typed({ type: 'TEXT', intent, text: `You haven't recorded any attendance yet, ${name}. Add your timetable and mark your first class to start tracking.` })
      }
      return typed({
        type: 'CALCULATION',
        intent,
        text: `Your current attendance is **${pct.toFixed(1)}%** — ${ctx.attendance.present} present out of ${ctx.attendance.conducted} conducted classes.`,
        data: [ctx]
      })
    }
    case 'GET_SUBJECT_ATTENDANCE': {
      if (ctx.subjects.length === 0) return typed({ type: 'TEXT', intent, text: 'No subject attendance recorded yet.' })
      const s = ctx.subjects[0]!
      return typed({
        type: 'CALCULATION',
        intent,
        text: `${s.name}: ${s.percentage === null ? 'no records' : s.percentage.toFixed(1) + '%'}.`,
        data: ctx.subjects
      })
    }
    case 'COMPARE_SUBJECTS': {
      if (ctx.subjects.length < 2) return typed({ type: 'TEXT', intent, text: 'Add attendance for at least two subjects to compare them.' })
      const sorted = [...ctx.subjects].sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
      const lines = sorted.map((s, i) => `${i + 1}. ${s.name} — ${s.percentage === null ? 'N/A' : s.percentage.toFixed(1) + '%'}`)
      return typed({ type: 'TABLE', intent, text: `Your subject attendance ranking:\n${lines.join('\n')}`, data: sorted })
    }
    case 'ATTENDANCE_TARGET':
    case 'RECOVERY_CALCULATION': {
      if (pct === null) return typed({ type: 'TEXT', intent, text: 'Record some attendance first, then I can calculate recovery.' })
      if (pct >= target) {
        return typed({
          type: 'CALCULATION',
          intent,
          text: `You're already above your ${target}% target at **${pct.toFixed(1)}%**. ${ctx.maxSafeAbsences !== null ? `You can afford up to ${ctx.maxSafeAbsences} additional absences while staying at/above ${target}%.` : ''}`
        })
      }
      const needed = ctx.classesNeeded
      if (needed === null) {
        return typed({
          type: 'CALCULATION',
          intent,
          text: `You're at ${pct.toFixed(1)}%, below your ${target}% target. It may not be possible to recover with the currently scheduled remaining classes.`
        })
      }
      return typed({
        type: 'CALCULATION',
        intent,
        text: `To reach ${target}%, attend the next **${needed} consecutive conducted classes**. You are currently at ${pct.toFixed(1)}%.`
      })
    }
    case 'MAXIMUM_ABSENCE': {
      if (pct === null) return typed({ type: 'TEXT', intent, text: 'Record some attendance first.' })
      if (ctx.maxSafeAbsences === null) {
        return typed({ type: 'TEXT', intent, text: 'You are below your target — add attendance records and timetable future classes for exact planning.' })
      }
      return typed({
        type: 'CALCULATION',
        intent,
        text: `Maximum additional absences while remaining at your ${target}% target: **${ctx.maxSafeAbsences}**${ctx.maxSafeAbsences === 0 ? ' (any absence drops you below target)' : ''}.`
      })
    }
    case 'WHAT_IF': {
      if (pct === null) return typed({ type: 'TEXT', intent, text: 'No attendance data yet to simulate.' })
      const n = 1
      const attend = (ctx.attendance.present + n) / (ctx.attendance.conducted + n) * 100
      const miss = ctx.attendance.present / (ctx.attendance.conducted + n) * 100
      return typed({
        type: 'CALCULATION',
        intent,
        text: `If you attend the next ${n} class: **${attend.toFixed(1)}%**. If you miss it: **${miss.toFixed(1)}%**.`,
        data: [{ current: pct, attendNext1: attend, missNext1: miss }]
      })
    }
    case 'SEMESTER_FORECAST': {
      if (pct === null) return typed({ type: 'TEXT', intent, text: 'No attendance data to forecast from.' })
      return typed({
        type: 'TEXT',
        intent,
        text: `Based on your current ${pct.toFixed(1)}%, open **Statistics → Forecast** for semester-end projections. Forecast confidence depends on how complete your timetable is.`
      })
    }
    case 'PROGRESS_REPORT': {
      const subjects = ctx.subjects.length > 0 ? `\n${ctx.subjects.map((s) => `• ${s.name}: ${s.percentage === null ? 'N/A' : s.percentage.toFixed(1) + '%'}`).join('\n')}` : ''
      return typed({
        type: 'REPORT',
        intent,
        text: `**Attendance Report — ${name}**\nOverall: ${pct === null ? 'N/A' : pct.toFixed(1) + '%'} (${ctx.attendance.present}/${ctx.attendance.conducted})\nTarget: ${target}%${subjects}\n\nGenerated by GRIET Attendance (student-built utility).`
      })
    }
    case 'FUTURE_PLAN':
    case 'CONSTRAINT_PLAN':
    case 'DATE_RANGE_PLAN': {
      return typed({
        type: 'WARNING',
        intent,
        text: `I can build a day-by-day attendance plan from your timetable and calendar. Set up your schedule first, then use **Statistics → Planner** to generate an exact, verified plan.`
      })
    }
    case 'HOLIDAY_IMPACT': {
      return typed({
        type: 'TEXT',
        intent,
        text: `Holidays do not count as absences. Use the **Calendar** tab to check each day's status and confirm whether a source marks it a GRIET closure or just a state holiday candidate.`
      })
    }
    case 'CLASS_CANCELLATION_IMPACT': {
      return typed({
        type: 'TEXT',
        intent,
        text: `A cancelled/not-held class never affects your attendance percentage — it is removed from the conducted count. Mark it **NOT HELD** to keep your math accurate.`
      })
    }
    case 'MAKEUP_CLASS_IMPACT': {
      return typed({
        type: 'TEXT',
        intent,
        text: `Makeup classes count toward attendance when marked conducted. Add one via **Timetable → Special day → Makeup class**.`
      })
    }
    case 'CALENDAR_QUERY':
    case 'TIMETABLE_QUERY': {
      if (ctx.nearestClass) {
        return typed({
          type: 'TEXT',
          intent,
          text: `Your next class is **${ctx.nearestClass.subject} at ${formatT(ctx.nearestClass.startTime)}**. You have ${ctx.todaySchedule.length} class(es) scheduled today.`
        })
      }
      return typed({ type: 'TEXT', intent, text: 'No upcoming classes found in your timetable for now.' })
    }
    case 'EXPLAIN_ATTENDANCE': {
      return typed({
        type: 'TEXT',
        intent,
        text: `Attendance = present ÷ conducted × 100. Cancelled/not-held classes never enter the conducted count. Present = ${ctx.attendance.present}, conducted = ${ctx.attendance.conducted}, so ${pct === null ? 'no data yet' : `percentage = ${pct.toFixed(2)}% for the current scope.`}`
      })
    }
    case 'ATTENDANCE_HISTORY':
    case 'ABSENCE_HISTORY': {
      return typed({
        type: 'TEXT',
        intent,
        text: `Open the **Absence Journal** (under Statistics/Attendance) for your complete history — date, subject, period, reason and private notes.`
      })
    }
    case 'APP_HELP': {
      return typed({
        type: 'TEXT',
        intent,
        text: `GRIET Attendance (built by Mohammed Anasuddin Zaid) tracks attendance, timetable and academic calendar fully offline. Ask about your attendance, targets, absences, holidays, future classes or reports.`
      })
    }
    case 'GENERAL_KNOWLEDGE': {
      return typed({
        type: 'TEXT',
        intent,
        text: 'I focus on attendance, timetable, calendar and attendance-planning questions. Try “What is my attendance?”, “How many classes do I need for 75%?” or “Plan my attendance until October 20.”'
      })
    }
    case 'AMBIGUOUS': {
      return typed({ type: 'CLARIFICATION', intent, text: 'Could you clarify? For example: “What is my attendance?” or “How many classes do I need to reach 75%?”' })
    }
    case 'UNSUPPORTED':
    default: {
      return typed({
        type: 'ERROR',
        intent: 'UNSUPPORTED',
        text: 'That question is outside my attendance and academic-schedule scope.'
      })
    }
  }
}

function formatT(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const suffix = (h ?? 0) >= 12 ? 'PM' : 'AM'
  const h12 = (h ?? 0) % 12 === 0 ? 12 : (h ?? 0) % 12
  return `${h12}:${String(m ?? 0).padStart(2, '0')} ${suffix}`
}

export function getDefaultAiProvider(): AiProvider {
  return MockProvider
}

export function getAiProviders(): { id: string; label: string; kind: string }[] {
  return [
    { id: 'local', label: 'Local assistant (offline, deterministic)', kind: MockProvider.kind },
    { id: 'openai', label: 'OpenAI-compatible (coming later)', kind: 'OpenAICompatibleProvider' }
  ]
}

export async function chatWithAi(request: AiChatRequest): Promise<AiResponse> {
  const provider = getDefaultAiProvider()
  if (!provider.isAvailable()) {
    return {
      type: 'ERROR',
      text: RETRYABLE_MSG,
      requiresAction: true
    }
  }
  try {
    return await provider.chat(request)
  } catch {
    return {
      type: 'ERROR',
      text: `The assistant couldn't respond right now. ${RETRYABLE_MSG}`,
      requiresAction: true
    }
  }
}

export { RETRYABLE_MSG }
export type AiResponseTypeExport = AiResponseType