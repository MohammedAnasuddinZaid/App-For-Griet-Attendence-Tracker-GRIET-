import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, CheckCheck, BookOpen } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useDashboardData } from '@/hooks/useDashboardData'
import { TodayStatusCard, TodayTimeline } from '@/components/domain'
import { Button, Card, CardHeader, EmptyState, Modal, Skeleton, useToast } from '@/components/ui'
import { findAttendance, upsertAttendance, attendanceForDate } from '@/services/dataService'
import { formatFriendlyDate, todayStr, weekdayLong, getDayOfWeek } from '@/utils/date'
import { ABSENCE_REASONS } from '@/data/constants'
import type { TodaySlot } from '@/services/timetableEngine'

const REASON_KEYS = ABSENCE_REASONS

export default function TodayPage() {
  const { profile, settings, refresh } = useApp()
  const navigate = useNavigate()
  const data = useDashboardData(profile)
  const toast = useToast()
  const [absenceSlot, setAbsenceSlot] = useState<TodaySlot | null>(null)
  const [reason, setReason] = useState('PERSONAL')
  const [note, setNote] = useState('')
  const [markAllOpen, setMarkAllOpen] = useState(false)
  const [dayRecords, setDayRecords] = useState<Map<string, string>>(new Map())

  const today = todayStr()
  const timeFormat = settings?.timeFormat ?? '12h'

  const loadRecords = useCallback(async () => {
    if (!profile) return
    const recs = await attendanceForDate(profile.id, today)
    const map = new Map<string, string>()
    for (const r of recs) {
      const key = `${r.subjectName}${r.timeSlot ?? ''}`
      map.set(key, r.status === 'PRESENT' || r.status === 'ONLINE' ? 'Present' : r.status === 'ABSENT' ? 'Absent' : 'Not held')
    }
    setDayRecords(map)
  }, [profile, today])

  useEffect(() => {
    if (profile) void loadRecords()
  }, [profile, loadRecords, data.todaySlots.length])

  async function mark(slot: TodaySlot, status: 'PRESENT' | 'ABSENT', reasonStr?: string, noteStr?: string) {
    if (!profile) return
    const existing = await findAttendance(profile.id, today, slot.id, slot.subjectName, slot.startTime)
    await upsertAttendance(profile.id, existing, {
      date: today,
      subjectName: slot.subjectName,
      status,
      timeSlot: slot.startTime,
      slotId: slot.id,
      subjectId: slot.subjectId,
      reason: reasonStr,
      note: noteStr,
      isMakeup: slot.isMakeup
    })
    const key = `${slot.subjectName}${slot.startTime}`
    setDayRecords((prev) => new Map(prev).set(key, status === 'PRESENT' ? 'Present' : 'Absent'))
    toast({
      type: 'success',
      message: `${slot.subjectName} marked ${status === 'PRESENT' ? 'present' : 'absent'}.`,
      action: { label: 'Undo', onClick: () => undo(slot) }
    })
    refresh()
  }

  async function undo(slot: TodaySlot) {
    if (!profile) return
    const existing = await findAttendance(profile.id, today, slot.id, slot.subjectName, slot.startTime)
    if (!existing) return
    const status = existing.status === 'PRESENT' ? 'ABSENT' : existing.status === 'ABSENT' ? 'PRESENT' : existing.status
    await upsertAttendance(profile.id, existing, {
      date: today, subjectName: slot.subjectName, status, timeSlot: slot.startTime, slotId: slot.id, subjectId: slot.subjectId
    })
    const key = `${slot.subjectName}${slot.startTime}`
    setDayRecords((prev) => new Map(prev).set(key, status === 'PRESENT' ? 'Present' : 'Absent'))
    refresh()
  }

  async function notHeld(slot: TodaySlot) {
    if (!profile) return
    const existing = await findAttendance(profile.id, today, slot.id, slot.subjectName, slot.startTime)
    await upsertAttendance(profile.id, existing, {
      date: today, subjectName: slot.subjectName, status: 'NOT_HELD', timeSlot: slot.startTime, slotId: slot.id
    })
    const key = `${slot.subjectName}${slot.startTime}`
    setDayRecords((prev) => new Map(prev).set(key, 'Not held'))
    toast({ type: 'info', message: `${slot.subjectName} marked as not held. It won't count in attendance.` })
    refresh()
  }

  function openAbsenceSheet(slot: TodaySlot) {
    setAbsenceSlot(slot)
    setReason('PERSONAL')
    setNote('')
  }

  async function confirmAbsence() {
    if (!absenceSlot || !profile) return
    await mark(absenceSlot, 'ABSENT', reason, note || undefined)
    setAbsenceSlot(null)
  }

  async function markAllPresent() {
    if (!profile) return
    for (const slot of data.todaySlots) {
      const existing = await findAttendance(profile.id, today, slot.id, slot.subjectName, slot.startTime)
      await upsertAttendance(profile.id, existing, { date: today, subjectName: slot.subjectName, status: 'PRESENT', timeSlot: slot.startTime, slotId: slot.id })
    }
    setMarkAllOpen(false)
    await loadRecords()
    refresh()
    toast({ type: 'success', message: `Marked all ${data.todaySlots.length} classes as present.` })
  }

  if (!profile || !settings) {
    return (
      <div>
        <EmptyState icon={<CalendarDays size={28} />} title="No profile set up yet" action={<Button onClick={() => navigate('/setup')}>Set up profile</Button>} />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Today</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{formatFriendlyDate(today)} · {weekdayLong(getDayOfWeek(today))}</p>
        </div>
        {data.todaySlots.length > 0 && !data.todayStatus.isCollegeClosed && (
          <Button variant="secondary" size="sm" onClick={() => setMarkAllOpen(true)}>
            <CheckCheck size={16} aria-hidden /> Mark all
          </Button>
        )}
      </div>

      <TodayStatusCard status={data.todayStatus.status} title={data.todayStatus.title} detail={data.todayStatus.detail} onReview={() => navigate('/calendar')} />

      {data.isLoading && <Skeleton className="h-80" />}

      {!data.isLoading && (
        <>
          {(data.todayStatus.isCollegeClosed || data.todayStatus.status === 'CONFIRMED_HOLIDAY') && (
            <Card>
              <EmptyState
                icon={<BookOpen size={28} />}
                title="No regular classes are scheduled today."
                description={data.todayStatus.detail}
                action={<Button variant="secondary" onClick={() => navigate('/calendar')}>View calendar</Button>}
              />
            </Card>
          )}

          {!data.todayStatus.isCollegeClosed && !data.todayStatus.isExamDay && data.todaySlots.length > 0 && (
            <Card>
              <CardHeader title={`${data.todaySlots.length} class${data.todaySlots.length > 1 ? 'es' : ''} scheduled`} subtitle="Tap PRESENT or ABSENT. Attendance is saved instantly." />
              <div className="px-4 pb-4">
                <TodayTimeline
                  slots={data.todaySlots}
                  statusLabels={Object.fromEntries([...dayRecords])}
                  onMark={(slot, status) => status === 'ABSENT' ? openAbsenceSheet(slot) : mark(slot, 'PRESENT')}
                  onNotHeld={notHeld}
                  timeFormat={timeFormat}
                />
              </div>
            </Card>
          )}

          {!data.todayStatus.isCollegeClosed && !data.todayStatus.isExamDay && data.todaySlots.length === 0 && data.todayStatus.status !== 'WEEKEND' && (
            <Card>
              <EmptyState
                icon={<CalendarDays size={28} />}
                title="No classes scheduled today"
                description="Your weekly timetable has no classes today."
                action={<Button variant="secondary" onClick={() => navigate('/timetable')}>Manage timetable</Button>}
              />
            </Card>
          )}

          {data.todayStatus.isExamDay && (
            <Card>
              <EmptyState
                icon={<BookOpen size={28} />}
                title="Exam period"
                description="No regular timetable classes during examinations."
                action={<Button variant="secondary" onClick={() => navigate('/calendar')}>View calendar</Button>}
              />
            </Card>
          )}
        </>
      )}

      {/* Absence reason sheet */}
      <Modal open={!!absenceSlot} onClose={() => setAbsenceSlot(null)} label="Why were you absent?">
        <div className="p-5 space-y-4">
          {absenceSlot && (
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{absenceSlot.subjectName}</p>
              <p className="text-xs text-slate-500">{absenceSlot.startTime} – {absenceSlot.endTime}</p>
            </div>
          )}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reason</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {REASON_KEYS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${reason === r.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}
                  aria-pressed={reason === r.id}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="note">What happened? (optional)</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Wasn't feeling well."
              className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
            />
            <p className="text-[11px] text-slate-400 mt-1">Private &amp; local by default.</p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setAbsenceSlot(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={confirmAbsence}>Record absence</Button>
          </div>
        </div>
      </Modal>

      {/* Mark all confirmation */}
      <Modal open={markAllOpen} onClose={() => setMarkAllOpen(false)} label="Mark all classes">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Mark all <b>{data.todaySlots.length} classes</b> as present? You can correct individual classes afterwards. Absences are recorded per class.
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {data.todaySlots.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm">
                <span className="truncate">{s.subjectName}</span>
                <span className="text-xs text-slate-400">{s.startTime}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setMarkAllOpen(false)}>Cancel</Button>
            <Button variant="success" className="flex-1" onClick={() => void markAllPresent()}>Mark all present</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}