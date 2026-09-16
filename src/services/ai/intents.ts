// Intent detection — deterministic, rule-based (no model required).
// The AI interprets; deterministic tools/math remain authoritative.
import type { AiIntent } from '@/types'

interface Rule {
  intent: AiIntent
  patterns: RegExp[]
}

const RULES: Rule[] = [
  {
    intent: 'GET_CURRENT_ATTENDANCE',
    patterns: [
      /\b(my |my overall |my current |my present )?(attendance|percentage)\b/i,
      /\bwhat (is|are|am|'s)? .{0,40}(attendance|percentage)/i,
      /\bhow many (classes )?(have|could|did) i attended/i,
      /\battendance %\b/i,
      /\bwhere do i stand\b/i
    ]
  },
  {
    intent: 'GET_SUBJECT_ATTENDANCE',
    patterns: [
      /\b(subject|per|marks?|course).*(attendance|percent)/i,
      /\battendance.*(in|for) .*\b(subject)/i,
      /\b(attendance|percentage).*\b(in|for|of|at)\b/i
    ]
  },
  {
    intent: 'COMPARE_SUBJECTS',
    patterns: [/\b(compare|versus|vs\.?|ranking|rank|best subject|worst subject|highest|lowest)\b/i]
  },
  {
    intent: 'ATTENDANCE_TREND',
    patterns: [/\b(trend|improving|improved|declining|dropped|increased|decreased|progress)\b/i]
  },
  {
    intent: 'ATTENDANCE_TARGET',
    patterns: [/\b(reach|maintain|hit|achieve|stay .* above|keep .* at|target)\b.*\b(\d+|75|80|85|90|95)%?\b/i]
  },
  {
    intent: 'RECOVERY_CALCULATION',
    patterns: [/\b(how many|need|required).*(classes|classes? to reach|attend)\b/i, /\brecover(y)?\b/i, /\bget back (to|above)\b/i]
  },
  {
    intent: 'MAXIMUM_ABSENCE',
    patterns: [/\b(how many classes (can|may) i (miss|skip|bunk)|safe absences|room for|can i miss|without .* dropping|additional absences)\b/i]
  },
  {
    intent: 'WHAT_IF',
    patterns: [/\bwhat if\b/i, /\bwhat happens if\b/i, /\bsimulate\b/i, /\bsuppose\b/i, /\bscenario\b/i]
  },
  {
    intent: 'DATE_RANGE_PLAN',
    patterns: [/\b(until|till|by|up to)\b/i, /\b(from .* to|between)\b/i]
  },
  {
    intent: 'FUTURE_PLAN',
    patterns: [/\bplan\b/i, /\bschedule\b/i, /\bcannot attend (on |next |this |that )?/i, /\bcan't attend\b/i, /\bmiss .*(friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/i, /\bunavailable\b/i]
  },
  {
    intent: 'CONSTRAINT_PLAN',
    patterns: [/\bcan't attend\b/i, /\bcannot attend\b/i, /\bmiss(ed)? (every|all )?(mondays|fridays|tuesdays|wednesdays|thursdays|saturdays)\b/i]
  },
  {
    intent: 'SUBJECT_PLAN',
    patterns: [/\b(subject|per|course|subject-wise|mathematics|physics|os|ds|networks|lab).*(plan|target|reduce|improve|recover)/i]
  },
  {
    intent: 'OVERALL_PLAN',
    patterns: [/\b(overall|all subjects|whole semester)\b/i]
  },
  {
    intent: 'HOLIDAY_IMPACT',
    patterns: [/\bholiday\b/i, /\bclosed\b/i, /\bfestival\b/i, /\bvacation\b/i]
  },
  {
    intent: 'CLASS_CANCELLATION_IMPACT',
    patterns: [/\bcancel(l?ed)?\b/i, /\bnot held\b/i, /\bno class\b/i]
  },
  {
    intent: 'MAKEUP_CLASS_IMPACT',
    patterns: [/\b(makeup|make-up|special class)\b/i]
  },
  {
    intent: 'SEMESTER_FORECAST',
    patterns: [/\b(end of semester|semester end|forecast|projected|projection|will i.reach|expected)\b/i]
  },
  {
    intent: 'PROGRESS_REPORT',
    patterns: [/\b(report|progress report|summary report|generate.*report)\b/i]
  },
  {
    intent: 'ATTENDANCE_HISTORY',
    patterns: [/\b(history|past|previous|show my .*attendance)\b/i]
  },
  {
    intent: 'ABSENCE_HISTORY',
    patterns: [/\b(absences|absent|missed classes|absence summary)\b/i]
  },
  {
    intent: 'CALENDAR_QUERY',
    patterns: [/\b(calendar|tomorrow|today|next week|this week|working day|classes? today)\b/i]
  },
  {
    intent: 'TIMETABLE_QUERY',
    patterns: [/\b(timetable|schedule|periods?|classes? (today|tomorrow|on))\b/i]
  },
  {
    intent: 'APP_HELP',
    patterns: [/\b(help|how do i|how to|what can you do|features?|offline|backup|export|import)\b/i]
  },
  {
    intent: 'EXPLAIN_ATTENDANCE',
    patterns: [/\b(explain|why (is|did|does)|calculate|how is .*calculated|formula)\b/i]
  }
]

const UNSUPPORTED_PATTERNS = [
  /\b(what is your name|who made you|joke|song|weather|movie|food recipe)\b/i,
  /\b(download|torrent|password? for)\b/i
]

export function detectIntent(message: string): AiIntent {
  if (UNSUPPORTED_PATTERNS.some((p) => p.test(message))) return 'UNSUPPORTED'
  const trimmed = message.trim()
  if (!trimmed) return 'AMBIGUOUS'

  // Simple percentage-only question
  if (/^[\d%.\s]+$/.test(trimmed) || /\b\d{2}(\.\d+)?%?\b/.test(trimmed) && !RULES.some((r) => r.intent !== 'GET_CURRENT_ATTENDANCE' && r.patterns.some((p) => p.test(trimmed)))) {
    // treat "72%" alone as current attendance check
  }

  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(trimmed))) return rule.intent
  }
  return 'GENERAL_KNOWLEDGE'
}

export function extractTarget(message: string): number | null {
  const m = message.match(/(\d{2,3})(?:\.\d+)?\s*%/g)
  if (!m) return null
  const val = Number(m[m.length - 1]!.replace('%', '').replace('.', ''))
  if (val >= 50 && val <= 100) return val
  // handle "half" style
  const m2 = message.match(/(\d{2,3}(?:\.\d+)?)\s*%/g)
  if (m2) {
    const parsed = Number(m2[m2.length - 1]!.replace('%', ''))
    if (parsed >= 50 && parsed <= 100) return parsed
  }
  return null
}

export function extractNumber(message: string): number | null {
  const m = message.match(/(\d+)\s*(classes|class|days?|periods?)/i)
  if (m) return Number(m[1])
  const m2 = message.match(/\b(\d{1,2})\b/)
  if (m2) return Number(m2[1])
  return null
}

export function extractWeekday(message: string): number | null {
  const days: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
  }
  const m = message.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i)
  if (!m) return null
  return days[m[1]!.toLowerCase()] ?? null
}

export function extractSubjectName(message: string, subjects: { name: string }[]): string | null {
  const lower = message.toLowerCase()
  for (const s of subjects) {
    const words = s.name.toLowerCase()
    if (lower.includes(words) || words.split(/\s+/).some((w) => w.length > 3 && lower.includes(w))) {
      return s.name
    }
  }
  return null
}

export function extractDate(message: string): string | null {
  // today / tomorrow
  if (/\btoday\b/i.test(message)) return todayIso()
  if (/\btomorrow\b/i.test(message) || /\bnext day\b/i.test(message)) return addDaysIso(1)
  // "this Monday", "next Monday", "Friday"
  return null
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDaysIso(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}