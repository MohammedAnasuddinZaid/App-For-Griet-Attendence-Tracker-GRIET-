import { useEffect, useMemo, useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Trash2, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button, Card, EmptyState, Modal, useToast, ConfirmDialog, Badge } from '@/components/ui'
import { resolveCalendarDate, STATUS_META, type CalendarResolution } from '@/services/calendarEngine'
import { getCalendarEvents, getOverrides, saveOverride, deleteOverride, attendanceForDate, getSpecialDates } from '@/services/dataService'
import { getMonthDays, formatFriendlyDate } from '@/utils/date'
import { uid } from '@/utils'
import { cn } from '@/utils/cn'
import type { CalendarEvent, CalendarOverride, AttendanceRecord, SpecialTimetableDate, CalendarStatus } from '@/types'

function statusTone(status: CalendarStatus): 'success' | 'warning' | 'danger' | 'info' | 'holiday' | 'exam' | 'special' | 'neutral' {
  switch (status) {
    case 'INSTRUCTIONAL_DAY': return 'success'
    case 'GRIET_EVENT': return 'info'
    case 'HOLIDAY_CANDIDATE': return 'special'
    case 'CONFIRMED_HOLIDAY': return 'holiday'
    case 'WEEKEND': return 'neutral'
    case 'CONFLICT':
    case 'UNCERTAIN': return 'warning'
    default: return 'neutral'
  }
}

export default function CalendarPage() {
  const { profile } = useApp()
  const toast = useToast()
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const [monthKey, setMonthKey] = useState(() => new Date().toISOString().slice(0, 7))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [overrides, setOverrides] = useState<CalendarOverride[]>([])
  const [specialDates, setSpecialDates] = useState<SpecialTimetableDate[]>([])
  const [dayRecords, setDayRecords] = useState<AttendanceRecord[]>([])
  const [deleteTarget, setDeleteTarget] = useState<CalendarOverride | null>(null)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const [ev, ov, sp] = await Promise.all([getCalendarEvents(), getOverrides(), getSpecialDates(profile.id)])
      setEvents(ev)
      setOverrides(ov)
      setSpecialDates(sp)
    })()
  }, [profile, profile?.id, tick])

  const monthDates = useMemo(() => getMonthDays(monthKey), [monthKey])

  const monthResolutions = useMemo(() => {
    const map = new Map<string, CalendarResolution>()
    for (const d of monthDates) {
      map.set(d, resolveCalendarDate(d, events, overrides.map((o) => ({ date: o.date, title: o.title, toStatus: o.toStatus }))))
    }
    return map
  }, [monthDates, events, overrides])

  const selectedRes = selectedDate ? monthResolutions.get(selectedDate) ?? null : null

  useEffect(() => {
    if (!profile || !selectedDate) { setDayRecords([]); return }
    attendanceForDate(profile.id, selectedDate).then(setDayRecords)
  }, [profile, profile?.id, selectedDate, tick])

  const conflicts = useMemo(() => Array.from(monthResolutions.entries())
    .filter(([, r]) => r.conflict)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, res]) => ({ date, res })), [monthResolutions])

  const presentCount = dayRecords.filter((r) => r.status === 'PRESENT' || r.status === 'ONLINE').length
  const absentCount = dayRecords.filter((r) => r.status === 'ABSENT').length

  const existingOverrideForDay = selectedDate ? overrides.find((o) => o.date === selectedDate) : undefined

  async function saveQuickOverride(toStatus: string, title: string) {
    if (!selectedDate || !selectedRes) return
    const now = new Date().toISOString()
    const toSave: CalendarOverride = {
      id: existingOverrideForDay?.id ?? uid('ovr'),
      date: selectedDate,
      fromStatus: selectedRes.status,
      toStatus,
      title,
      description: `Marked as ${toStatus} via calendar override.`,
      createdAt: existingOverrideForDay?.createdAt ?? now,
      updatedAt: now
    }
    await saveOverride(toSave)
    toast({ type: 'success', message: toStatus.includes('HOLIDAY') ? 'Marked as holiday.' : 'Marked as working day.' })
    refresh()
  }

  async function confirmDeleteOverride() {
    if (!deleteTarget) return
    await deleteOverride(deleteTarget.id)
    setDeleteTarget(null)
    refresh()
    toast({ type: 'info', message: 'Override removed.' })
  }

  function prevMonth() {
    const [y, m] = monthKey.split('-').map(Number)!
    const d = new Date((y ?? 2026), (m ?? 1) - 2, 1)
    setMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  function nextMonth() {
    const [y, m] = monthKey.split('-').map(Number)!
    const d = new Date((y ?? 2026), m ?? 1, 1)
    setMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const monthLabel = new Date(monthKey + '-01T12:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  if (!profile) return <EmptyState icon={<CalendarDays size={28} />} title="No profile set up yet" />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Academic schedule, holidays & overrides</p>
        </div>
        {monthKey !== currentMonthKey && (
          <Button variant="ghost" size="sm" onClick={() => setMonthKey(currentMonthKey)}>Today</Button>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="Previous month">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{monthLabel}</h2>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="Next month">
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Month grid */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{d}</div>
          ))}
        </div>
        {(() => {
          const leadDow = monthDates[0] ? new Date(monthDates[0] + 'T12:00:00').getDay() : 0
          const lead = Array.from({ length: leadDow }, (_, i) => `lead-${i}`)
          return (
            <div className="grid grid-cols-7">
              {lead.map((l) => <div key={l} className="aspect-square" />)}
              {monthDates.map((date) => {
                const res = monthResolutions.get(date)
                const isToday = date === new Date().toISOString().slice(0, 10)
                const isSelected = date === selectedDate
                const meta = res ? STATUS_META[res.status] : null
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'aspect-square flex flex-col items-center justify-center text-sm relative transition-colors',
                      isToday ? 'bg-brand-50/60 dark:bg-brand-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
                      isSelected && 'ring-2 ring-inset ring-brand-500 z-10'
                    )}
                  >
                    <span className={cn(
                      'font-medium tabular-nums',
                      isToday ? 'font-bold text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200'
                    )}>
                      {date.split('-')[2]}
                    </span>
                    {meta && (
                      <span className="mt-0.5 size-1.5 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
                    )}
                  </button>
                )
              })}
            </div>
          )
        })()}
      </Card>

      {/* Conflict cards */}
      {conflicts.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle size={13} aria-hidden /> {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} in {monthLabel}
          </h3>
          {conflicts.map(({ date, res }) => (
            <Card key={date} className="p-4 border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatFriendlyDate(date, { weekday: true })}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{res.detail}</p>
                  {res.conflictDetails && (
                    <ul className="mt-2 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {res.conflictDetails.map((d, i) => <li key={i}>• {d}</li>)}
                    </ul>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" onClick={() => setSelectedDate(date)}>Resolve</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Selected day detail */}
      {selectedRes && selectedDate && (
        <Modal open={!!selectedDate} onClose={() => setSelectedDate(null)} label="Day detail">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatFriendlyDate(selectedDate, { weekday: true, year: true })}</p>
                <Badge tone={statusTone(selectedRes.status)} className="mt-1.5">
                  {STATUS_META[selectedRes.status]?.label ?? selectedRes.status}
                </Badge>
              </div>
              <button onClick={() => setSelectedDate(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X size={18} /></button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedRes.detail}</p>

            {selectedRes.sources.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Sources</h4>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {selectedRes.sources.map((s, i) => (
                    <li key={i} className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" aria-hidden />{s.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRes.conflict && selectedRes.conflictDetails && (
              <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-3">
                <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1"><AlertTriangle size={12} aria-hidden /> Conflict details</h4>
                <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                  {selectedRes.conflictDetails.map((d, i) => <li key={i}>• {d}</li>)}
                </ul>
              </div>
            )}

            {/* Attendance for the day */}
            <div className="rounded-xl bg-slate-50/60 dark:bg-slate-800/40 p-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Your attendance</h4>
              {dayRecords.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500">No classes marked.</p>
              ) : (
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{presentCount} present</span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{absentCount} absent</span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span>{dayRecords.length} total</span>
                </div>
              )}
            </div>

            {/* Special timetable date */}
            {(() => {
              const spd = specialDates.find((s) => s.date === selectedDate)
              if (!spd) return null
              return (
                <div className="rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/60 dark:border-pink-900/40 p-3">
                  <h4 className="text-xs font-semibold text-pink-700 dark:text-pink-300">Special timetable day</h4>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{spd.overrideType.replace(/_/g, ' ').toLowerCase()} · {spd.notes ?? '—'}</p>
                </div>
              )
            })()}

            {/* Override actions */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Your adjustment</h4>
              {existingOverrideForDay ? (
                <div className="flex items-center justify-between rounded-xl bg-slate-50/60 dark:bg-slate-800/40 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{existingOverrideForDay.title}</p>
                    <p className="text-xs text-slate-400">{existingOverrideForDay.toStatus}</p>
                  </div>
                  <button onClick={() => setDeleteTarget(existingOverrideForDay)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {!selectedRes.isCollegeClosed && selectedRes.status !== 'WEEKEND' && (
                    <>
                      <Button size="sm" onClick={() => void saveQuickOverride('HOLIDAY', 'Holiday (manual)')} className="bg-purple-600 hover:bg-purple-700">
                        <CalendarDays size={14} aria-hidden /> Mark holiday
                      </Button>
                      <Button size="sm" onClick={() => void saveQuickOverride('WORKING_DAY', 'Working day (manual)')} className="bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 size={14} aria-hidden /> Mark working
                      </Button>
                      </>
                    )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this override?"
        description={`Remove your adjustment for ${deleteTarget?.date}? The day will revert to its original status.`}
        onConfirm={() => void confirmDeleteOverride()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}