// Core domain types for GRIET Attendance PWA.

export type EventType =
  | 'HOLIDAY'
  | 'FESTIVAL'
  | 'COLLEGE_CLOSED'
  | 'VACATION'
  | 'SEMESTER_BREAK'
  | 'EXAM'
  | 'MIDTERM'
  | 'INSTRUCTIONAL'
  | 'SPECIAL_EVENT'
  | 'WEEKEND'
  | 'MANUAL_OVERRIDE'
  | 'UNKNOWN'

export type CalendarSource =
  | 'GRIET_ACADEMIC_CALENDAR'
  | 'TELANGANA_STATE_CALENDAR'
  | 'USER_OVERRIDE'
  | 'USER_ADDED'
  | 'SPECIAL_TIMETABLE'

export type CalendarStatus =
  | 'INSTRUCTIONAL_DAY'
  | 'GRIET_EVENT'
  | 'HOLIDAY_CANDIDATE'
  | 'CONFIRMED_HOLIDAY'
  | 'WEEKEND'
  | 'CONFLICT'
  | 'UNCERTAIN'

export interface CalendarEvent {
  id: string
  date: string // YYYY-MM-DD, timezone-safe (Asia/Kolkata)
  title: string
  description?: string
  eventType: EventType
  source: CalendarSource
  sourcePriority: number
  affectsAttendance: boolean
  isCollegeClosed?: boolean
  isInstructionalDay?: boolean
  isExamDay?: boolean
  isVacation?: boolean
  isManualOverride?: boolean
  officialStatus?: string
  userOverrideStatus?: string
  createdAt: string
  updatedAt: string
}

export interface CalendarOverride {
  id: string
  date: string
  fromStatus: string
  toStatus: string
  title: string
  description?: string
  reason?: string
  createdAt: string
  updatedAt: string
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'CANCELLED' | 'NOT_HELD' | 'ONLINE' | 'UNKNOWN'

export type SlotType = 'LECTURE' | 'LAB' | 'TUTORIAL' | 'ACTIVITY' | 'FREE' | 'OTHER'
export type TimetableOverrideType = 'REPLACE_DAY' | 'ADD_CLASSES' | 'REMOVE_CLASSES' | 'COLLEGE_EVENT' | 'SPECIAL_WORKING_DAY' | 'HOLIDAY' | 'EXAM_SCHEDULE' | 'MAKEUP_CLASS'

export interface StudentProfile {
  id: string
  name: string
  year: string // I, II, III, IV
  branch: string
  section: string
  academicYear: string // 2026-27
  semester: string // I, II
  createdAt: string
  updatedAt: string
}

export interface Subject {
  id: string
  profileId: string
  name: string
  code: string
  faculty?: string
  color?: string
  credits?: number
  isLab?: boolean
  createdAt: string
  updatedAt: string
}

export interface Timetable {
  id: string
  profileId: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TimetableSlot {
  id: string
  timetableId: string
  dayOfWeek: number // 0=Sun...6=Sat
  startTime: string // HH:mm 24h
  endTime: string
  subjectId?: string
  subjectName: string
  subjectCode?: string
  faculty?: string
  room?: string
  slotType: SlotType
  periodNumber?: number
  isLab?: boolean
  labGroup?: string
  isActive: boolean
  isMakeup?: boolean
  createdAt: string
  updatedAt: string
}

export interface SpecialTimetableDate {
  id: string
  profileId: string
  date: string
  overrideType: TimetableOverrideType
  replaceDayOfWeek?: number
  timetableId?: string
  notes?: string
  slots?: Array<{
    startTime: string
    endTime: string
    subjectName: string
    faculty?: string
    room?: string
    slotType: SlotType
  }>
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  id: string
  profileId: string
  date: string
  subjectId?: string
  subjectName: string
  slotId?: string
  timeSlot?: string
  status: AttendanceStatus
  reason?: string // absence reason key
  note?: string // free text absence note
  isMakeup?: boolean
  createdAt: string
  updatedAt: string
}

export type AbsenceReason = 'SICK' | 'PERSONAL' | 'FAMILY' | 'TRAVEL' | 'EMERGENCY' | 'COLLEGE_ACTIVITY' | 'OTHER'

export interface AbsenceRecord {
  id: string
  profileId: string
  date: string
  subjectName: string
  period?: string
  reason: AbsenceReason
  note?: string
  attendanceRecordId?: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  id: string
  profileId: string
  attendanceTarget: number // default 75
  excusedBehavior: 'EXCLUDE' | 'COUNT_AS_PRESENT' | 'COUNT_AS_ABSENT'
  theme: 'light' | 'dark' | 'system'
  timeFormat: '12h' | '24h'
  dateFormat: 'friendly' | 'iso'
  notificationsEnabled: boolean
  notificationPreferences: {
    nextClass: boolean
    dailySummary: boolean
    holiday: boolean
    specialClasses: boolean
    attendanceWarnings: boolean
    reminderMinutes: 5 | 10 | 15 | 30
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  thresholds: {
    critical: number
    danger: number
    minimum: number
    good: number
    excellent: number
  }
  privacyMode: boolean
  createdAt: string
  updatedAt: string
}

export interface AttendancePlan {
  id: string
  profileId: string
  title: string
  constraints: unknown
  snapshot: unknown
  target: number
  createdAt: string
  updatedAt: string
}

export interface AiInteraction {
  id: string
  profileId: string
  timestamp: string
  question: string
  intent: string
  summary: string
  subjectRef?: string
  dateRef?: string
  calculation?: string
  conversationId?: string
  pinned?: boolean
}

export interface NotificationPreference {
  id: string
  profileId: string
  category: string
  subjectId?: string
  lastSentAt?: string
  updatedAt: string
}

// ---------- Derived / calculation types ----------

export interface SubjectStats {
  subjectId?: string
  subjectName: string
  conducted: number
  present: number
  absent: number
  excused: number
  percentage: number | null
  target: number
  classesNeeded: number | null
  maxSafeAbsences: number | null
  risk: RiskLevel
}

export type RiskLevel =
  | 'EXCELLENT'
  | 'SAFE'
  | 'WATCH'
  | 'AT_RISK'
  | 'CRITICAL'
  | 'UNRECOVERABLE'

export type HealthLevel = 'HEALTHY' | 'WATCH' | 'AT_RISK' | 'CRITICAL'

export interface AttendanceSummary {
  profileId: string
  conducted: number
  present: number
  absent: number
  excused: number
  cancelled: number
  notHeld: number
  percentage: number | null
}

export interface AttendanceStatsResult {
  summary: AttendanceSummary
  subjects: SubjectStats[]
  target: number
  classesNeeded: number | null
  maxSafeAbsences: number | null
  health: HealthLevel
}

export interface ForecastScenario {
  label: string
  attendanceRate: number
  projectedPercentage: number | null
}

export interface ForecastResult {
  scenarios: ForecastScenario[]
  remainingClasses: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface BackupData {
  format: 'griet-attendance-backup'
  version: number
  exportedAt: string
  appVersion: string
  profile?: StudentProfile
  subjects?: Subject[]
  timetable?: Timetable[]
  timetableSlots?: TimetableSlot[]
  specialDates?: SpecialTimetableDate[]
  attendance?: AttendanceRecord[]
  absences?: AbsenceRecord[]
  calendarEvents?: CalendarEvent[]
  calendarOverrides?: CalendarOverride[]
  settings?: AppSettings[]
  aiInteractions?: AiInteraction[]
}

// ---------- Auth / Sync abstraction ----------

export interface AuthUser {
  id: string
  name?: string
  isGuest: boolean
}

export interface AuthProvider {
  readonly kind: string
  getCurrentUser(): Promise<AuthUser | null>
  isAuthenticated(): Promise<boolean>
  signOut(): Promise<void>
}

export type SyncStatus = 'LOCAL_ONLY' | 'SYNCING' | 'SYNCED' | 'OFFLINE' | 'ERROR' | 'CONFLICT'

export interface SyncProvider {
  connect(): Promise<void>
  disconnect(): Promise<void>
  pushChanges(): Promise<void>
  pullChanges(): Promise<void>
  sync(): Promise<void>
  getSyncStatus(): SyncStatus
}

// ---------- AI subsystem types ----------

export type AiIntent =
  | 'GET_CURRENT_ATTENDANCE'
  | 'GET_SUBJECT_ATTENDANCE'
  | 'COMPARE_SUBJECTS'
  | 'EXPLAIN_ATTENDANCE'
  | 'ATTENDANCE_TREND'
  | 'ATTENDANCE_TARGET'
  | 'RECOVERY_CALCULATION'
  | 'MAXIMUM_ABSENCE'
  | 'FUTURE_PLAN'
  | 'DATE_RANGE_PLAN'
  | 'CONSTRAINT_PLAN'
  | 'SUBJECT_PLAN'
  | 'OVERALL_PLAN'
  | 'WHAT_IF'
  | 'HOLIDAY_IMPACT'
  | 'CLASS_CANCELLATION_IMPACT'
  | 'MAKEUP_CLASS_IMPACT'
  | 'SEMESTER_FORECAST'
  | 'PROGRESS_REPORT'
  | 'ATTENDANCE_HISTORY'
  | 'ABSENCE_HISTORY'
  | 'CALENDAR_QUERY'
  | 'TIMETABLE_QUERY'
  | 'DATA_QUERY'
  | 'APP_HELP'
  | 'GENERAL_KNOWLEDGE'
  | 'AMBIGUOUS'
  | 'UNSUPPORTED'

export type AiResponseType =
  | 'TEXT'
  | 'CALCULATION'
  | 'PLAN'
  | 'REPORT'
  | 'TABLE'
  | 'WARNING'
  | 'CLARIFICATION'
  | 'ERROR'
  | 'ACTION_CONFIRMATION'

export interface AiToolResult {
  [key: string]: unknown
}

export interface AiResponse {
  type: AiResponseType
  text: string
  data?: AiToolResult[]
  intent?: AiIntent
  requiresAction?: boolean
  planId?: string
}

export interface AiProvider {
  readonly kind: string
  isConfigured(): boolean
  isAvailable(): boolean
  chat(request: AiChatRequest): Promise<AiResponse>
}

export interface AiChatRequest {
  conversationId?: string
  message: string
  context: {
    profileId?: string
    intent?: AiIntent
    conversationSummary?: string
    toolResults?: AiToolResult[]
    preferences?: unknown
  }
}

export interface AiConversation {
  id: string
  profileId: string
  title: string
  createdAt: string
  updatedAt: string
  pinned?: boolean
}

export interface AiMessage {
  id: string
  conversationId: string
  profileId: string
  role: 'user' | 'assistant'
  content: string
  intent?: AiIntent
  responseType?: AiResponseType
  toolResults?: string
  createdAt: string
}

export interface AiMemoryEntry {
  id: string
  profileId: string
  key: string
  value: unknown
  updatedAt: string
}