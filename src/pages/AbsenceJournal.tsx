import { useEffect, useMemo, useState } from 'react'
import { ScrollText, Search, CalendarDays, Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button, Card, Badge, EmptyState, Modal, useToast, ConfirmDialog } from '@/components/ui'
import { getAbsences, saveAbsence, deleteAbsence, deleteAttendanceRecord } from '@/services/dataService'
import { ABSENCE_REASONS } from '@/data/constants'
import { todayStr, formatFriendlyDate, getDayOfWeek } from '@/utils/date'
import { cn } from '@/utils/cn'
import type { AbsenceRecord, AbsenceReason } from '@/types'

type Period = 'all' | 'month' | 'semester'

function streamSort(a: string, b: string): number { return a.localeCompare(b) }

function semesterRange(academicYear: string, semester: string): [string, string] {
  const [a, b] = academicYear.split('-')
  const y1 = (a ?? '').length === 4 ? Number(a) : 2000 + Number(a ?? 0)
  const y2 = (b ?? '').length === 4 ? Number(b) : 2000 + Number(b ?? 0)
  if (semester === 'I') return [`${y1}-06-01`, `${y1}-12-31`]
  return [`${y2}-01-01`, `${y2}-07-31`]
}

export default function AbsenceJournalPage() {
  const { profile } = useApp()
  const toast = useToast()

  const [absences, setAbsences] = useState<AbsenceRecord[]>([])
  const [period, setPeriod] = useState<Period>('semester')
  const [subjectFilter, setSubjectFilter] = useState('__all__')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<AbsenceRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AbsenceRecord | null>(null)

  const today = todayStr()

  useEffect(() => {
    if (!profile) return
    getAbsences(profile.id).then(setAbsences)
  }, [profile, profile?.id])

  const subjects = useMemo(() => {
    const set = new Set<string>()
    for (const a of absences) if (a.subjectName) set.add(a.subjectName)
    return [...set].sort()
  }, [absences])

  const filtered = useMemo(() => {
    const [semStart] = profile ? semesterRange(profile.academicYear, profile.semester) : ['', '']
    const monthStart = today.slice(0, 8) + '01'
    const q = query.trim().toLowerCase()
    return absences
      .filter((a) => {
        if (period === 'month' && a.date < monthStart) return false
        if (period === 'semester' && (a.date < semStart)) return false
        if (subjectFilter !== '__all__' && a.subjectName !== subjectFilter) return false
        if (q && !(a.subjectName.toLowerCase().includes(q) || (a.note ?? '').toLowerCase().includes(q) || a.date.includes(q))) return false
        return true
      })
      .sort((a, b) => streamSort(b.date, a.date))
  }, [absences, period, subjectFilter, query, today, profile])

  const stats = useMemo(() => {
    const total = absences.length
    const monthStart = today.slice(0, 8) + '01'
    const [semStart] = profile ? semesterRange(profile.academicYear, profile.semester) : ['', '']
    const thisMonth = absences.filter((a) => a.date >= monthStart).length
    const thisSemester = absences.filter((a) => a.date >= semStart).length
    const byReason = new Map<string, number>()
    for (const a of absences) byReason.set(a.reason, (byReason.get(a.reason) ?? 0) + 1)
    const byDOW = new Map<number, number>()
    for (const a of absences) byDOW.set(getDayOfWeek(a.date), (byDOW.get(getDayOfWeek(a.date)) ?? 0) + 1)
    const bySubject = new Map<string, number>()
    for (const a of absences) bySubject.set(a.subjectName, (bySubject.get(a.subjectName) ?? 0) + 1)
    const mostAbsentDOW = [...byDOW.entries()].sort((a, b) => b[1] - a[1])[0]
    const mostAbsentSubject = [...bySubject.entries()].sort((a, b) => b[1] - a[1])[0]
    return { total, thisMonth, thisSemester, byReason, mostAbsentDOW, mostAbsentSubject }
  }, [absences, today, profile])

  async function saveEdit() {
    if (!editing) return
    const now = new Date().toISOString()
    await saveAbsence({ ...editing, updatedAt: now })
    setEditing(null)
    setAbsences(await getAbsences(profile!.id))
    toast({ type: 'success', message: 'Absence updated.' })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteAbsence(deleteTarget.id)
    if (deleteTarget.attendanceRecordId) {
      await deleteAttendanceRecord(deleteTarget.attendanceRecordId).catch(() => {})
    }
    setDeleteTarget(null)
    setAbsences(await getAbsences(profile!.id))
    toast({ type: 'info', message: 'Absence removed.' })
  }

  if (!profile) return <EmptyState icon={<ScrollText size={28} />} title="No profile yet" />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Absence Journal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">A record of every class you missed</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wide font-medium text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wide font-medium text-slate-400">This month</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{stats.thisMonth}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wide font-medium text-slate-400">This semester</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{stats.thisSemester}</p>
        </Card>
      </div>

      {(stats.mostAbsentDOW || stats.mostAbsentSubject) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Most missed {stats.mostAbsentDOW && <strong className="text-slate-700 dark:text-slate-200">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][stats.mostAbsentDOW[0]] ?? ''}</strong>}
          {stats.mostAbsentSubject && <> · most absent subject: <strong className="text-slate-700 dark:text-slate-200">{stats.mostAbsentSubject[0]}</strong></>}
        </p>
      )}

      {/* Reason breakdown */}
      {stats.byReason.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ABSENCE_REASONS.map((r) => {
            const count = stats.byReason.get(r.id) ?? 0
            if (count === 0) return null
            const pct = Math.round((count / stats.total) * 100)
            return <Badge key={r.id} tone="neutral" className="px-3 py-1">{r.label}: {count} <span className="text-slate-400">· {pct}%</span></Badge>
          })}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {([['semester', 'Semester'], ['month', 'Month'], ['all', 'All']] as [Period, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setPeriod(id)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors', period === id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400')}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subject, date, note…" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm" />
          </div>
        </div>
        {subjects.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal size={13} className="text-slate-400" aria-hidden />
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs">
              <option value="__all__">All subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card><EmptyState icon={<ScrollText size={24} />} title={absences.length === 0 ? 'No absences recorded' : 'Nothing matches your filters'} description={absences.length === 0 ? 'Every absent class you mark on the Today tab appears here.' : 'Try changing the filters above.'} /></Card>
      ) : (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 h-10 w-10 shrink-0">
                <CalendarDays size={16} className="text-slate-500" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{a.subjectName}</p>
                <p className="text-xs text-slate-400">{formatFriendlyDate(a.date, { weekday: true })} {a.period ? `· ${a.period}` : ''}</p>
                {(a.reason || a.note) && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={a.reason === 'SICK' ? 'warning' : a.reason === 'EMERGENCY' ? 'danger' : a.reason === 'COLLEGE_ACTIVITY' ? 'info' : 'neutral'}>{reasonLabel(a.reason)}</Badge>
                    {a.note && <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.note}</span>}
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing(a)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit absence"><Pencil size={15} /></button>
                <button onClick={() => setDeleteTarget(a)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500" aria-label="Delete absence"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} label="Edit absence">
        {editing && (
          <div className="p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{editing.subjectName}</p>
            <div>
              <label className="text-xs font-medium text-slate-500" htmlFor="abs-reason">Reason</label>
              <select id="abs-reason" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={editing.reason} onChange={(e) => setEditing({ ...editing, reason: e.target.value as AbsenceReason })}>
                {ABSENCE_REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500" htmlFor="abs-note">Note (optional)</label>
              <textarea id="abs-note" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={editing.note ?? ''} onChange={(e) => setEditing({ ...editing, note: e.target.value })} rows={3} placeholder="e.g. Doctor's appointment" />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => void saveEdit()}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this absence?"
        description="The absence record and its attendance entry will be removed."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function reasonLabel(reason: AbsenceReason): string {
  return ABSENCE_REASONS.find((r) => r.id === reason)?.label ?? reason
}