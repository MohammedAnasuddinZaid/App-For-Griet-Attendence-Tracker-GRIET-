import Dexie, { type Table } from 'dexie'
import type {
  StudentProfile,
  Subject,
  Timetable,
  TimetableSlot,
  SpecialTimetableDate,
  AttendanceRecord,
  AbsenceRecord,
  CalendarEvent,
  CalendarOverride,
  AppSettings,
  AttendancePlan,
  AiInteraction,
  NotificationPreference,
  AiConversation,
  AiMessage,
  AiMemoryEntry
} from '@/types'

export const DB_SCHEMA_VERSION = 3

class GrietAttendanceDB extends Dexie {
  profiles!: Table<StudentProfile, string>
  subjects!: Table<Subject, string>
  timetables!: Table<Timetable, string>
  timetableSlots!: Table<TimetableSlot, string>
  specialTimetableDates!: Table<SpecialTimetableDate, string>
  attendance!: Table<AttendanceRecord, string>
  absences!: Table<AbsenceRecord, string>
  calendarEvents!: Table<CalendarEvent, string>
  calendarOverrides!: Table<CalendarOverride, string>
  settings!: Table<AppSettings, string>
  attendancePlans!: Table<AttendancePlan, string>
  aiInteractions!: Table<AiInteraction, string>
  notificationPreferences!: Table<NotificationPreference, string>
  aiConversations!: Table<AiConversation, string>
  aiMessages!: Table<AiMessage, string>
  aiMemory!: Table<AiMemoryEntry, string>
  auditLog!: Table<{ id: string; timestamp: string; action: string; detail?: string }>

  constructor() {
    super('griet-attendance')
    this.version(1).stores({
      profiles: 'id, name, year, branch, section, academicYear',
      subjects: 'id, profileId, name, code',
      timetables: 'id, profileId, isActive',
      timetableSlots: 'id, timetableId, dayOfWeek, [timetableId+dayOfWeek]',
      specialTimetableDates: 'id, profileId, date',
      attendance: 'id, profileId, date, subjectId, [profileId+date], [profileId+subjectId]',
      absences: 'id, profileId, date, subjectName, reason',
      calendarEvents: 'id, date, eventType, source, [date+source]',
      calendarOverrides: 'id, date',
      settings: 'id, profileId',
      attendancePlans: 'id, profileId',
      aiInteractions: 'id, profileId, timestamp, intent'
    })
    this.version(2).stores({
      profiles: 'id, name, year, branch, section, academicYear',
      subjects: 'id, profileId, name, code',
      timetables: 'id, profileId, isActive',
      timetableSlots: 'id, timetableId, dayOfWeek, [timetableId+dayOfWeek]',
      specialTimetableDates: 'id, profileId, date',
      attendance: 'id, profileId, date, subjectId, [profileId+date], [profileId+subjectId]',
      absences: 'id, profileId, date, subjectName, reason',
      calendarEvents: 'id, date, eventType, source, [date+source]',
      calendarOverrides: 'id, date',
      settings: 'id, profileId',
      attendancePlans: 'id, profileId',
      aiInteractions: 'id, profileId, timestamp, intent',
      notificationPreferences: 'id, profileId, category',
      aiConversations: 'id, profileId, createdAt',
      aiMessages: 'id, conversationId, profileId, createdAt, role',
      aiMemory: 'id, profileId, key'
    })
    this.version(3).stores({
      profiles: 'id, name, year, branch, section, academicYear',
      subjects: 'id, profileId, name, code',
      timetables: 'id, profileId, isActive',
      timetableSlots: 'id, timetableId, dayOfWeek, [timetableId+dayOfWeek]',
      specialTimetableDates: 'id, profileId, date',
      attendance: 'id, profileId, date, subjectId, [profileId+date], [profileId+subjectId]',
      absences: 'id, profileId, date, subjectName, reason',
      calendarEvents: 'id, date, eventType, source, [date+source]',
      calendarOverrides: 'id, date',
      settings: 'id, profileId',
      attendancePlans: 'id, profileId',
      aiInteractions: 'id, profileId, timestamp, intent',
      notificationPreferences: 'id, profileId, category',
      aiConversations: 'id, profileId, createdAt',
      aiMessages: 'id, conversationId, profileId, createdAt, role',
      aiMemory: 'id, profileId, key',
      auditLog: 'id, timestamp, action'
    })
  }

  async reset() {
    await this.transaction('rw', this.tables, async () => {
      await Promise.all(this.tables.map((t) => t.clear()))
    })
  }
}

export const db = new GrietAttendanceDB()

export async function dbHealth(): Promise<{ ok: boolean; message: string }> {
  try {
    await db.profiles.count()
    return { ok: true, message: 'Database is healthy.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Unknown database error.' }
  }
}