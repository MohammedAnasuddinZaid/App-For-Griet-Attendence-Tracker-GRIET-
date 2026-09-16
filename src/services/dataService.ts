// Data service — all indexed operations against Dexie.
import { db } from '@/db'
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
  AiConversation,
  AiMessage,
  BackupData
} from '@/types'
import { uid } from '@/utils'

// ---------- Profiles ----------

export async function getAllProfiles(): Promise<StudentProfile[]> {
  return db.profiles.toArray()
}

export async function getActiveProfiles(): Promise<StudentProfile[]> {
  const all = await getAllProfiles()
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveProfile(profile: StudentProfile) {
  const now = new Date().toISOString()
  const exists = await db.profiles.get(profile.id)
  await db.profiles.put({
    ...profile,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
}

export async function deleteProfile(id: string) {
  await db.transaction('rw', [db.profiles, db.subjects, db.timetables, db.timetableSlots,
    db.specialTimetableDates, db.attendance, db.absences, db.settings, db.timetables], async () => {
    await db.profiles.delete(id)
    await db.subjects.where('profileId').equals(id).delete()
    const tts = await db.timetables.where('profileId').equals(id).toArray()
    for (const tt of tts) {
      await db.timetableSlots.where('timetableId').equals(tt.id).delete()
    }
    await db.timetables.where('profileId').equals(id).delete()
    await db.specialTimetableDates.where('profileId').equals(id).delete()
    await db.attendance.where('profileId').equals(id).delete()
    await db.absences.where('profileId').equals(id).delete()
    await db.settings.where('profileId').equals(id).delete()
  })
}

// ---------- Subjects ----------

export async function getSubjects(profileId: string): Promise<Subject[]> {
  return db.subjects.where('profileId').equals(profileId).toArray()
}

export async function saveSubject(subject: Subject) {
  const now = new Date().toISOString()
  const exists = await db.subjects.get(subject.id)
  await db.subjects.put({
    ...subject,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
  return subject
}

export async function bulkSaveSubjects(items: Subject[]) {
  if (items.length === 0) return
  await db.subjects.bulkPut(items)
}

export async function deleteSubject(id: string) {
  await db.subjects.delete(id)
}

// ---------- Timetable ----------

export async function getActiveTimetable(profileId: string): Promise<Timetable | undefined> {
  return db.timetables.where('profileId').equals(profileId).and((t) => t.isActive).first()
}

export async function getAllTimetables(profileId: string): Promise<Timetable[]> {
  return db.timetables.where('profileId').equals(profileId).toArray()
}

export async function saveTimetable(tt: Timetable) {
  const now = new Date().toISOString()
  const exists = await db.timetables.get(tt.id)
  await db.timetables.put({
    ...tt,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
}

export async function getSlots(timetableId: string): Promise<TimetableSlot[]> {
  return db.timetableSlots.where('timetableId').equals(timetableId).toArray()
}

export async function saveSlot(slot: TimetableSlot) {
  const now = new Date().toISOString()
  const exists = await db.timetableSlots.get(slot.id)
  await db.timetableSlots.put({
    ...slot,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
}

export async function bulkSaveSlots(items: TimetableSlot[]) {
  if (items.length === 0) return
  await db.timetableSlots.bulkPut(items)
}

export async function deleteSlot(id: string) {
  await db.timetableSlots.delete(id)
}

export async function deleteTimetable(id: string) {
  await db.transaction('rw', [db.timetables, db.timetableSlots], async () => {
    await db.timetables.delete(id)
    await db.timetableSlots.where('timetableId').equals(id).delete()
  })
}

// ---------- Special timetable dates ----------

export async function getSpecialDates(profileId: string): Promise<SpecialTimetableDate[]> {
  return db.specialTimetableDates.where('profileId').equals(profileId).toArray()
}

export async function saveSpecialDate(special: SpecialTimetableDate) {
  const now = new Date().toISOString()
  const exists = await db.specialTimetableDates.get(special.id)
  await db.specialTimetableDates.put({
    ...special,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
}

export async function deleteSpecialDate(id: string) {
  await db.specialTimetableDates.delete(id)
}

// ---------- Attendance ----------

export async function getAttendanceByProfile(profileId: string): Promise<AttendanceRecord[]> {
  return db.attendance.where('profileId').equals(profileId).toArray()
}

export async function attendanceForDate(profileId: string, date: string): Promise<AttendanceRecord[]> {
  return db.attendance.where('[profileId+date]').equals([profileId, date]).toArray()
}

// Unique logical key: date + slotId (falls back to date + subjectName + startTime)
export async function findAttendance(
  profileId: string,
  date: string,
  slotId?: string,
  subjectName?: string,
  timeSlot?: string
): Promise<AttendanceRecord | undefined> {
  const dayRecs = await attendanceForDate(profileId, date)
  if (slotId) {
    return dayRecs.find((r) => r.slotId === slotId)
  }
  return dayRecs.find((r) => r.subjectName === subjectName && r.timeSlot === timeSlot)
}

export async function upsertAttendance(
  profileId: string,
  existing: AttendanceRecord | undefined,
  data: Pick<AttendanceRecord, 'date' | 'subjectName' | 'status' | 'timeSlot' | 'slotId' | 'subjectId' | 'reason' | 'note' | 'isMakeup'>
): Promise<AttendanceRecord> {
  const now = new Date().toISOString()
  const record: AttendanceRecord = {
    id: existing?.id ?? uid('att'),
    profileId,
    date: data.date,
    subjectName: data.subjectName,
    status: data.status,
    timeSlot: data.timeSlot,
    slotId: data.slotId,
    subjectId: data.subjectId,
    reason: data.reason,
    note: data.note,
    isMakeup: data.isMakeup,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  }
  await db.attendance.put(record)

  // Absence journal side-effect
  if (data.status === 'ABSENT') {
    const existingAbsence = existing
      ? await db.absences.where('attendanceRecordId').equals(existing.id).first()
      : undefined
    await db.absences.put({
      id: existingAbsence?.id ?? uid('abs'),
      profileId,
      date: data.date,
      subjectName: data.subjectName,
      period: data.timeSlot,
      reason: (data.reason ?? 'OTHER') as AbsenceRecord['reason'],
      note: data.note,
      attendanceRecordId: record.id,
      createdAt: existingAbsence?.createdAt ?? now,
      updatedAt: now
    })
  } else if (existing && existing.status === 'ABSENT') {
    await db.absences.where('attendanceRecordId').equals(existing.id).delete()
  }

  return record
}

export async function deleteAttendanceRecord(id: string) {
  await db.transaction('rw', [db.attendance, db.absences], async () => {
    await db.absences.where('attendanceRecordId').equals(id).delete()
    await db.attendance.delete(id)
  })
}

export async function bulkSaveAttendance(items: AttendanceRecord[]) {
  if (items.length === 0) return
  await db.attendance.bulkPut(items)
}

// ---------- Absence journal ----------

export async function getAbsences(profileId: string): Promise<AbsenceRecord[]> {
  return db.absences.where('profileId').equals(profileId).toArray()
}

export async function saveAbsence(record: AbsenceRecord) {
  const now = new Date().toISOString()
  const exists = await db.absences.get(record.id)
  await db.absences.put({
    ...record,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
  return record
}

export async function deleteAbsence(id: string) {
  await db.absences.delete(id)
}

// ---------- Attendance CSV export ----------

export function attendanceToCsv(records: AttendanceRecord[]): string {
  const header = ['Date', 'Subject', 'Period', 'Status', 'Reason', 'Note']
  const lines = [header.join(',')]
  for (const r of records) {
    lines.push([
      r.date,
      csvField(r.subjectName),
      csvField(r.timeSlot ?? ''),
      r.status,
      csvField(r.reason ?? ''),
      csvField(r.note ?? '')
    ].join(','))
  }
  return lines.join('\n')
}

function csvField(value: string): string {
  if (!/["',\n]/.test(value)) return value
  return `"${value.replace(/"/g, '""')}"`
}

// ---------- Calendar ----------

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  return db.calendarEvents.toArray()
}

export async function getCalendarEventsForYear(year: number): Promise<CalendarEvent[]> {
  const start = `${year}-01-01`
  const end = `${year}-12-31`
  return db.calendarEvents
    .toArray()
    .then((arr) => arr.filter((e) => e.date >= start && e.date <= end))
}

export async function getCalendarEventsForYr(year: string): Promise<CalendarEvent[]> {
  const [y1, y2] = year.split('-').map((p) => (p.length === 2 ? 2000 + Number(p) : Number(p)))
  const start = `${y1}-06-01`
  const end = `${y2}-07-31`
  return db.calendarEvents.toArray().then((arr) => arr.filter((e) => e.date >= start && e.date <= end))
}

export async function bulkSaveCalendarEvents(items: CalendarEvent[]) {
  if (items.length === 0) return
  // Dedupe by date+source priority, newest wins otherwise
  const now = new Date().toISOString()
  const existing = await db.calendarEvents.toArray()
  const merged = new Map<string, CalendarEvent>()
  for (const e of existing) {
    merged.set(e.id, e)
  }
  for (const item of items) {
    const existingSameDateGriet = item.source === 'GRIET_ACADEMIC_CALENDAR' && merged.get(`griet-${item.date}`)
    if (existingSameDateGriet && existingSameDateGriet.sourcePriority === 2) continue
    merged.set(item.id, { ...item, createdAt: now, updatedAt: now })
  }
  await db.calendarEvents.bulkPut([...merged.values()])
}

export async function clearCalendarSource(source: 'GRIET_ACADEMIC_CALENDAR' | 'TELANGANA_STATE_CALENDAR') {
  await db.calendarEvents.where('source').equals(source).delete()
}

export async function deleteOverridesFromDate(date: string) {
  // also delete a user event on that date
  await db.calendarOverrides.where('date').equals(date).delete()
}

export async function saveCalendarEvent(event: CalendarEvent) {
  const now = new Date().toISOString()
  const exists = await db.calendarEvents.get(event.id)
  await db.calendarEvents.put({
    ...event,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
}

export async function deleteCalendarEvent(id: string) {
  await db.calendarEvents.delete(id)
}

export async function getOverrides(): Promise<CalendarOverride[]> {
  return db.calendarOverrides.toArray()
}

export async function getOverridesForDate(date: string): Promise<CalendarOverride[]> {
  return db.calendarOverrides.where('date').equals(date).toArray()
}

export async function saveOverride(override: CalendarOverride) {
  const now = new Date().toISOString()
  const exists = await db.calendarOverrides.get(override.id)
  await db.calendarOverrides.put({
    ...override,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
}

export async function deleteOverride(id: string) {
  await db.calendarOverrides.delete(id)
}

// ---------- Settings ----------

export async function getSettings(profileId: string): Promise<AppSettings | undefined> {
  return db.settings.where('profileId').equals(profileId).first()
}

export async function saveSettings(setting: AppSettings) {
  const now = new Date().toISOString()
  const exists = await db.settings.get(setting.id)
  await db.settings.put({
    ...setting,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
}

export async function ensureDefaultSettings(profileId: string): Promise<AppSettings> {
  const existing = await getSettings(profileId)
  if (existing) return existing
  const defaults: AppSettings = {
    id: uid('set'),
    profileId,
    attendanceTarget: 75,
    excusedBehavior: 'EXCLUDE',
    theme: 'system',
    timeFormat: '12h',
    dateFormat: 'friendly',
    notificationsEnabled: false,
    notificationPreferences: {
      nextClass: false,
      dailySummary: false,
      holiday: false,
      specialClasses: false,
      attendanceWarnings: false,
      reminderMinutes: 10
    },
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
    thresholds: {
      critical: 65,
      danger: 75,
      minimum: 80,
      good: 90,
      excellent: 95
    },
    privacyMode: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  await saveSettings(defaults)
  return defaults
}

// ---------- Plans & AI ----------

export async function savePlan(plan: AttendancePlan) {
  const now = new Date().toISOString()
  const exists = await db.attendancePlans.get(plan.id)
  await db.attendancePlans.put({
    ...plan,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
}

export async function getPlans(profileId: string): Promise<AttendancePlan[]> {
  return db.attendancePlans.where('profileId').equals(profileId).toArray()
}

export async function deletePlan(id: string) {
  await db.attendancePlans.delete(id)
}

export async function saveAiInteraction(interaction: AiInteraction) {
  await db.aiInteractions.put(interaction)
}

export async function getAiInteractions(profileId: string): Promise<AiInteraction[]> {
  return db.aiInteractions.where('profileId').equals(profileId).reverse().sortBy('timestamp')
}

export async function deleteAiInteraction(id: string) {
  await db.aiInteractions.delete(id)
}

export async function clearAiHistory(profileId: string) {
  await db.aiInteractions.where('profileId').equals(profileId).delete()
}

// ---------- AI conversations & messages ----------

export async function getAiConversations(profileId: string): Promise<AiConversation[]> {
  const arr = await db.aiConversations.where('profileId').equals(profileId).toArray()
  return arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveAiConversation(conversation: AiConversation) {
  const now = new Date().toISOString()
  const exists = await db.aiConversations.get(conversation.id)
  await db.aiConversations.put({
    ...conversation,
    createdAt: exists?.createdAt ?? now,
    updatedAt: now
  })
}

export async function getAiConversation(id: string): Promise<AiConversation | undefined> {
  return db.aiConversations.get(id)
}

export async function saveAiMessage(message: AiMessage) {
  await db.aiMessages.put(message)
  const conv = await db.aiConversations.get(message.conversationId)
  if (conv) await db.aiConversations.put({ ...conv, updatedAt: new Date().toISOString() })
}

export async function getAiMessages(conversationId: string): Promise<AiMessage[]> {
  const arr = await db.aiMessages.where('conversationId').equals(conversationId).toArray()
  return arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function deleteAiConversation(id: string) {
  await db.transaction('rw', [db.aiConversations, db.aiMessages, db.aiInteractions], async () => {
    await db.aiConversations.delete(id)
    await db.aiMessages.where('conversationId').equals(id).delete()
  })
}

export async function clearAiConversations(profileId: string) {
  const conversations = await getAiConversations(profileId)
  await db.transaction('rw', [db.aiConversations, db.aiMessages], async () => {
    for (const c of conversations) {
      await db.aiMessages.where('conversationId').equals(c.id).delete()
    }
    await db.aiConversations.where('profileId').equals(profileId).delete()
  })
}

export async function audit(action: string, detail?: string) {
  await db.auditLog.add({ id: uid('aud'), timestamp: new Date().toISOString(), action, detail })
}

export async function getAuditLog(): Promise<{ id: string; timestamp: string; action: string; detail?: string }[]> {
  return db.auditLog.orderBy('timestamp').reverse().limit(200).toArray()
}

export async function clearAuditLog() {
  await db.auditLog.clear()
}

// ---------- Backup ----------

export async function exportBackup(profileId: string): Promise<BackupData> {
  const profile = await db.profiles.get(profileId)
  const subjects = await getSubjects(profileId)
  const timetable = await getAllTimetables(profileId)
  const slots: TimetableSlot[] = []
  for (const tt of timetable) {
    slots.push(...(await getSlots(tt.id)))
  }
  const specialDates = await getSpecialDates(profileId)
  const attendance = await getAttendanceByProfile(profileId)
  const absences = await db.absences.where('profileId').equals(profileId).toArray()
  const calendarEvents = await getCalendarEvents()
  const calendarOverrides = await getOverrides()
  const settings = await db.settings.where('profileId').equals(profileId).toArray()
  const aiInteractions = await getAiInteractions(profileId)

  return {
    format: 'griet-attendance-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    profile,
    subjects,
    timetable,
    timetableSlots: slots,
    specialDates,
    attendance,
    absences,
    calendarEvents,
    calendarOverrides,
    settings,
    aiInteractions
  }
}

export function validateBackup(data: unknown): { ok: boolean; error?: string; backup?: BackupData } {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'The backup file is invalid.' }
  }
  const b = data as BackupData
  if (b.format !== 'griet-attendance-backup') {
    return { ok: false, error: 'This file is not a GRIET Attendance backup.' }
  }
  if (typeof b.version !== 'number' || b.version < 1) {
    return { ok: false, error: 'This backup version is not supported.' }
  }
  if (b.profile && typeof b.profile.name !== 'string') {
    return { ok: false, error: 'The backup profile is corrupted.' }
  }
  if (Array.isArray(b.attendance) && b.attendance.some((a) => typeof a.date !== 'string')) {
    return { ok: false, error: 'The backup contains invalid attendance records.' }
  }
  return { ok: true, backup: b }
}

export interface MergeResult {
  added: number
  updated: number
  summary: string
}

// Deterministic merge: same ID → newer updatedAt wins. No silent duplicates.
export async function importBackup(
  backup: BackupData,
  mode: 'replace' | 'merge'
): Promise<MergeResult> {
  let added = 0
  let updated = 0

  if (!backup.profile) {
    throw new Error('Backup contains no profile.')
  }
  const targetId = backup.profile.id

  if (mode === 'replace') {
    await db.transaction('rw', [db.profiles, db.subjects, db.timetables, db.timetableSlots,
      db.specialTimetableDates, db.attendance, db.absences, db.settings, db.attendancePlans,
      db.aiInteractions, db.calendarEvents, db.calendarOverrides], async () => {
      await Promise.all([
        db.profiles.clear(),
        db.subjects.clear(),
        db.timetables.clear(),
        db.timetableSlots.clear(),
        db.specialTimetableDates.clear(),
        db.attendance.clear(),
        db.absences.clear(),
        db.settings.clear(),
        db.attendancePlans.clear(),
        db.aiInteractions.clear(),
        db.calendarOverrides.clear()
      ])
    })
  }

  // Profile
  const existingProfile = await db.profiles.get(targetId)
  const pNow = new Date().toISOString()
  await db.profiles.put({
    ...backup.profile,
    createdAt: existingProfile?.createdAt ?? backup.profile.createdAt ?? pNow,
    updatedAt: pNow
  })

  // Subjects
  for (const s of backup.subjects ?? []) {
    const existing = await db.subjects.get(s.id)
    const newer = existing && existing.updatedAt > s.updatedAt ? existing : s
    await db.subjects.put(newer)
    if (existing) updated++
    else added++
  }

  // Timetables
  for (const tt of backup.timetable ?? []) {
    const existing = await db.timetables.get(tt.id)
    const newer = existing && existing.updatedAt > tt.updatedAt ? existing : tt
    await db.timetables.put(newer)
    if (existing) updated++
    else added++
  }

  // Slots
  for (const s of backup.timetableSlots ?? []) {
    const existing = await db.timetableSlots.get(s.id)
    const newer = existing && existing.updatedAt > s.updatedAt ? existing : s
    await db.timetableSlots.put(newer)
    if (existing) updated++
    else added++
  }

  // Attendance (dedupe by unique logical key, not just id)
  const existingAtt = await db.attendance.toArray()
  const attMap = new Map<string, AttendanceRecord>()
  for (const e of existingAtt) attMap.set(e.id, e)
  for (const r of backup.attendance ?? []) {
    const existing = attMap.get(r.id)
    if (existing && existing.updatedAt <= r.updatedAt) {
      attMap.set(r.id, r)
      updated++
      continue
    }
    if (!existing) {
      attMap.set(r.id, r)
      added++
    }
  }
  await db.attendance.bulkPut([...attMap.values()])

  // Absences
  for (const a of backup.absences ?? []) {
    const existing = await db.absences.get(a.id)
    const newer = existing && existing.updatedAt > a.updatedAt ? existing : a
    await db.absences.put(newer)
    if (existing) updated++
    else added++
  }

  // Calendar events
  const existingEvents = await db.calendarEvents.toArray()
  const evMap = new Map<string, CalendarEvent>()
  for (const e of existingEvents) evMap.set(e.id, e)
  for (const e of backup.calendarEvents ?? []) {
    const existing = evMap.get(e.id)
    const newer = existing && existing.updatedAt > e.updatedAt ? existing : e
    evMap.set(newer.id, newer)
    if (existing) updated++
    else added++
  }
  await db.calendarEvents.bulkPut([...evMap.values()])

  // Calendar overrides
  for (const o of backup.calendarOverrides ?? []) {
    const existing = await db.calendarOverrides.get(o.id)
    const newer = existing && existing.updatedAt > o.updatedAt ? existing : o
    await db.calendarOverrides.put(newer)
    if (existing) updated++
    else added++
  }

  // Settings
  for (const s of backup.settings ?? []) {
    const existing = await db.settings.get(s.id)
    const newer = existing && existing.updatedAt > s.updatedAt ? existing : s
    await db.settings.put(newer)
    if (existing) updated++
    else added++
  }

  // AI interactions
  for (const i of backup.aiInteractions ?? []) {
    const existing = await db.aiInteractions.get(i.id)
    if (!existing) {
      await db.aiInteractions.put(i)
      added++
    }
  }

  await audit('backup-imported', `mode=${mode} added=${added} updated=${updated}`)
  return {
    added,
    updated,
    summary: `Imported ${backup.attendance?.length ?? 0} attendance records, ${backup.subjects?.length ?? 0} subjects, ${backup.timetableSlots?.length ?? 0} timetable slots, ${backup.calendarOverrides?.length ?? 0} calendar overrides.`
  }
}

export const getTodaySlotsCache = new Map<string, TimetableSlot[]>()

export function cacheTodaySlots(timetableId: string, slots: TimetableSlot[]) {
  getTodaySlotsCache.set(timetableId, slots)
  // keep bounded
  if (getTodaySlotsCache.size > 20) {
    const keys = [...getTodaySlotsCache.keys()]
    for (let i = 0; i < keys.length - 10; i++) {
      getTodaySlotsCache.delete(keys[i]!)
    }
  }
}

export function cachedTodaySlots(timetableId: string): TimetableSlot[] | undefined {
  return getTodaySlotsCache.get(timetableId)
}