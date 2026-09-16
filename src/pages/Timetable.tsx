import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpenCheck, Upload, Download, CalendarRange, Plus, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button, Card, EmptyState, Modal, useToast, ConfirmDialog, Badge } from '@/components/ui'
import { WeekdayPill } from '@/components/domain'
import { DAYS, SLOT_TYPES } from '@/data/constants'
import { getActiveTimetable, getSlots, saveTimetable, saveSlot, deleteSlot, bulkSaveSlots, getSpecialDates, saveSpecialDate, deleteSpecialDate, getSubjects, saveSubject } from '@/services/dataService'
import { getTimetableForDayOnDesktop, validateTimetableSlots, parseTimetableJson } from '@/services/timetableEngine'
import { formatTime, timeToMinutes } from '@/utils/date'
import { uid } from '@/utils'
import type { TimetableSlot, SpecialTimetableDate } from '@/types'

const defaultSlot = () => ({
  id: '',
  timetableId: '',
  dayOfWeek: 1,
  startTime: '09:10',
  endTime: '10:00',
  subjectName: '',
  slotType: 'LECTURE' as TimetableSlot['slotType'],
  isActive: true,
  createdAt: '',
  updatedAt: ''
})

export default function TimetablePage() {
  const { profile, settings } = useApp()
  const navigate = useNavigate()
  const [day, setDay] = useState(new Date().getDay())
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [specialDates, setSpecialDates] = useState<SpecialTimetableDate[]>([])
  const [timetableId, setTimetableId] = useState<string | null>(null)
  const [editing, setEditing] = useState<TimetableSlot | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TimetableSlot | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [specialOpen, setSpecialOpen] = useState(false)
  const [newSpecial, setNewSpecial] = useState<SpecialTimetableDate | null>(null)
  const toast = useToast()

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function loadAll() {
    if (!profile) return
    const tt = await getActiveTimetable(profile.id)
    if (tt) {
      setTimetableId(tt.id)
      const all = await getSlots(tt.id)
      setSlots(all)
    } else {
      setTimetableId(null)
      setSlots([])
    }
    setSpecialDates(await getSpecialDates(profile.id))
  }

  const daySlots = useMemo(
    () => getTimetableForDayOnDesktop(slots, day),
    [slots, day]
  )

  const specialForDay = useMemo(() => specialDates.sort((a, b) => a.date.localeCompare(b.date)), [specialDates])

  async function createTimetableIfNeeded(): Promise<string> {
    if (!profile) throw new Error('No profile')
    let tt = await getActiveTimetable(profile.id)
    if (!tt) {
      const now = new Date().toISOString()
      tt = { id: uid('tt'), profileId: profile.id, name: `${profile.year} B.Tech ${profile.branch} ${profile.section} — Sem ${profile.semester}`, isActive: true, createdAt: now, updatedAt: now }
      await saveTimetable(tt)
    }
    return tt.id
  }

  function openNew() {
    if (!timetableId) return
    setIsNew(true)
    setEditing({ ...defaultSlot(), timetableId, dayOfWeek: day })
  }

  function openEdit(slot: TimetableSlot) {
    setIsNew(false)
    setEditing({ ...slot })
  }

  async function saveEditing() {
    if (!editing) return
    if (!editing.subjectName.trim()) {
      toast({ type: 'warning', message: 'Subject name is required.' })
      return
    }
    if (timeToMinutes(editing.endTime) <= timeToMinutes(editing.startTime)) {
      toast({ type: 'warning', message: 'End time must be after start time.' })
      return
    }
    const existing = editing.id ? await getSlots(editing.timetableId).then((l) => l.find((s) => s.id === editing.id)) : undefined
    const now = new Date().toISOString()
    const toSave: TimetableSlot = {
      ...editing,
      id: editing.id || uid('slot'),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    }
    await saveSlot(toSave)
    // Ensure subject exists
    if (profile) {
      const subjects = await getSubjects(profile.id)
      if (!subjects.find((s) => s.name === toSave.subjectName)) {
        await saveSubject({ id: uid('sub'), profileId: profile.id, name: toSave.subjectName, code: toSave.subjectCode ?? '', createdAt: now, updatedAt: now })
      }
    }
    setEditing(null)
    await loadAll()
    toast({ type: 'success', message: 'Class saved.' })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteSlot(deleteTarget.id)
    setDeleteTarget(null)
    await loadAll()
    toast({ type: 'info', message: 'Class deleted.' })
  }

  async function handleImportFile(file: File) {
    if (!profile) return
    try {
      const text = await file.text()
      const parsed = parseTimetableJson(text)
      const ttId = await createTimetableIfNeeded()
      const now = new Date().toISOString()
      const prepared = parsed.slots.map((s) => ({ ...s, id: uid('slot'), timetableId: ttId, createdAt: now, updatedAt: now }))
      const errors = validateTimetableSlots(prepared)
      if (errors.length > 0) {
        toast({ type: 'error', message: errors[0]!.message })
        return
      }
      await bulkSaveSlots(prepared)
      setImportOpen(false)
      await loadAll()
      toast({ type: 'success', message: `Imported ${prepared.length} classes.` })
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Import failed.' })
    }
  }

  async function exportTimetable() {
    if (slots.length === 0) return
    const data = {
      academicYear: profile?.academicYear ?? '2026-27',
      year: profile?.year,
      branch: profile?.branch,
      section: profile?.section,
      semester: profile?.semester,
      slots: slots.map((s) => ({
        day: DAYS[s.dayOfWeek],
        startTime: s.startTime,
        endTime: s.endTime,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        faculty: s.faculty,
        room: s.room,
        type: s.slotType
      }))
    }
    downloadFile(JSON.stringify(data, null, 2), 'griet-timetable.json', 'application/json')
    toast({ type: 'success', message: 'Timetable exported as JSON.' })
  }

  async function saveNewSpecial() {
    if (!newSpecial || !newSpecial.date || !profile) return
    const now = new Date().toISOString()
    const toSave: SpecialTimetableDate = {
      ...newSpecial,
      id: newSpecial.id || uid('spd'),
      profileId: profile.id,
      createdAt: newSpecial.createdAt || now,
      updatedAt: now
    }
    await saveSpecialDate(toSave)
    setSpecialOpen(false)
    await loadAll()
    toast({ type: 'success', message: 'Special day saved.' })
  }

  const [deleteSpecialTarget, setDeleteSpecialTarget] = useState<SpecialTimetableDate | null>(null)

  if (!profile || !settings) {
    return <EmptyState icon={<BookOpenCheck size={28} />} title="No profile yet" action={<Button onClick={() => navigate('/setup')}>Set up profile</Button>} />
  }

  const timeFormat = settings?.timeFormat ?? '12h'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Timetable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Weekly schedule for {profile.section} section</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}><Upload size={15} aria-hidden /></Button>
          <Button variant="secondary" size="sm" onClick={() => void exportTimetable()}><Download size={15} aria-hidden /></Button>
          <Button variant="secondary" size="sm" onClick={() => setSpecialOpen(true)}><CalendarRange size={15} aria-hidden /></Button>
        </div>
      </div>

      {!timetableId ? (
        <Card>
          <EmptyState
            icon={<BookOpenCheck size={30} />}
            title="Your timetable hasn't been added yet."
            description="Import an official/section timetable JSON, or build one manually. GRIET timetables are not pre-bundled."
            action={
              <div className="flex gap-2">
                <Button onClick={async () => {
                  const ttId = await createTimetableIfNeeded()
                  setTimetableId(ttId)
                  toast({ type: 'success', message: 'Timetable created. Add your first class above.' })
                }}>Build manually</Button>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>Import JSON/CSV</Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          {/* Day selector */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <WeekdayPill key={d} dow={d} active={day === d} onClick={() => setDay(d)} />
            ))}
          </div>

          {/* Day schedule */}
          <Card>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{DAYS[day]}</h3>
              {timetableId && <Button variant="ghost" size="sm" onClick={openNew}><Plus size={15} aria-hidden /> Add class</Button>}
            </div>
            <div className="px-4 pb-4 space-y-2">
              {daySlots.length === 0 ? (
                <EmptyState title="No classes on this day" description="Tap “Add class” to populate this day." />
              ) : (
                daySlots.map((s) => (
                  <div key={s.id} className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                    <div className="w-20 shrink-0 text-center">
                      <p className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{formatTime(s.startTime, timeFormat)}</p>
                      <p className="text-[10px] text-slate-400 tabular-nums">{formatTime(s.endTime, timeFormat)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{s.subjectName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge tone={s.slotType === 'LAB' ? 'purple' : 'info'}>{s.slotType}</Badge>
                        {s.room && <span className="text-xs text-slate-400">{s.room}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={`Edit ${s.subjectName}`}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950" aria-label={`Delete ${s.subjectName}`}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Special days */}
          {specialForDay.length > 0 && (
            <Card>
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Special days</h3>
                <Button variant="ghost" size="sm" onClick={() => setSpecialOpen(true)}><Plus size={15} aria-hidden /> Add</Button>
              </div>
              <div className="px-4 pb-4 space-y-2">
                {specialForDay.slice(-5).reverse().map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 py-2 px-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.date} · {s.overrideType.replace(/_/g, ' ')}</p>
                      {s.notes && <p className="text-xs text-slate-500">{s.notes}</p>}
                    </div>
                    <button onClick={() => setDeleteSpecialTarget(s)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Edit/add modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} label={isNew ? 'Add class' : 'Edit class'}>
        {editing && (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500" htmlFor="subject">Subject</label>
              <input id="subject" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={editing.subjectName} onChange={(e) => setEditing({ ...editing, subjectName: e.target.value })} placeholder="Data Structures" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="day">Day</label>
                <select id="day" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={editing.dayOfWeek} onChange={(e) => setEditing({ ...editing, dayOfWeek: Number(e.target.value) })}>
                  {DAYS.map((d, i) => i > 0 && <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="type">Type</label>
                <select id="type" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={editing.slotType} onChange={(e) => setEditing({ ...editing, slotType: e.target.value as TimetableSlot['slotType'] })}>
                  {SLOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="start">Start</label>
                <input id="start" type="time" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={editing.startTime} onChange={(e) => setEditing({ ...editing, startTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="end">End</label>
                <input id="end" type="time" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={editing.endTime} onChange={(e) => setEditing({ ...editing, endTime: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="room">Room</label>
                <input id="room" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={editing.room ?? ''} onChange={(e) => setEditing({ ...editing, room: e.target.value })} placeholder="C-204" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="faculty">Faculty</label>
                <input id="faculty" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={editing.faculty ?? ''} onChange={(e) => setEditing({ ...editing, faculty: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="flex-1" onClick={saveEditing}>{isNew ? 'Add class' : 'Save changes'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Import modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} label="Import timetable">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Import a JSON timetable. Format:
          </p>
          <pre className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-[11px] text-slate-600 dark:text-slate-300 overflow-x-auto">
{`{
  "academicYear": "2026-27",
  "year": "II", "branch": "CSE",
  "section": "A", "semester": "I",
  "slots": [
    { "day": "Monday", "startTime": "09:10",
      "endTime": "10:00", "subjectName":
      "Data Structures", "room": "C-204",
      "type": "LECTURE" }
  ]
}`}
          </pre>
          <label className="block">
            <span className="sr-only">Choose JSON file</span>
            <input type="file" accept=".json,application/json" onChange={(e) => e.target.files?.[0] && void handleImportFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white hover:file:bg-brand-700" />
          </label>
        </div>
      </Modal>

      {/* Special day modal */}
      <Modal open={specialOpen} onClose={() => setSpecialOpen(false)} label="Special timetable day">
        <div className="p-5 space-y-4">
          {!newSpecial && (
            <button
              className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-brand-500"
              onClick={() => setNewSpecial({ id: '', profileId: profile.id, date: '', overrideType: 'SPECIAL_WORKING_DAY', createdAt: '', updatedAt: '' })}
            >
              + Create special day
            </button>
          )}
          {newSpecial && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="spd-date">Date</label>
                <input id="spd-date" type="date" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={newSpecial.date} onChange={(e) => setNewSpecial({ ...newSpecial, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="spd-type">Type</label>
                <select id="spd-type" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={newSpecial.overrideType} onChange={(e) => setNewSpecial({ ...newSpecial, overrideType: e.target.value as SpecialTimetableDate['overrideType'] })}>
                  <option value="SPECIAL_WORKING_DAY">Special working day</option>
                  <option value="HOLIDAY">Holiday / no classes</option>
                  <option value="MAKEUP_CLASS">Makeup class</option>
                  <option value="REPLACE_DAY">Use another day's schedule</option>
                  <option value="EXAM_SCHEDULE">Exam schedule</option>
                </select>
              </div>
              {newSpecial.overrideType === 'REPLACE_DAY' && (
                <div>
                  <label className="text-xs font-medium text-slate-500" htmlFor="spd-replace">Replicate schedule of</label>
                  <select id="spd-replace" className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={newSpecial.replaceDayOfWeek ?? 1} onChange={(e) => setNewSpecial({ ...newSpecial, replaceDayOfWeek: Number(e.target.value) })}>
                    {DAYS.map((d, i) => i > 0 && <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
              {newSpecial.overrideType === 'MAKEUP_CLASS' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">Makeup class details</label>
                  <input className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" placeholder="Subject (e.g. Data Structures)" value={newSpecial.notes ?? ''} onChange={(e) => setNewSpecial({ ...newSpecial, notes: e.target.value })} />
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setNewSpecial(null)}>Cancel</Button>
                <Button className="flex-1" onClick={saveNewSpecial}>Save special day</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete this class?" description={`${deleteTarget?.subjectName} (${deleteTarget?.dayOfWeek ? DAYS[deleteTarget.dayOfWeek] : ''} ${deleteTarget?.startTime}) will be removed from the timetable.`} onConfirm={() => void confirmDelete()} onCancel={() => setDeleteTarget(null)} />
      <ConfirmDialog open={!!deleteSpecialTarget} title="Delete this special day?" onConfirm={() => { if (deleteSpecialTarget) void deleteSpecialDate(deleteSpecialTarget.id).then(async () => { setDeleteSpecialTarget(null); await loadAll() }) }} onCancel={() => setDeleteSpecialTarget(null)} />
    </div>
  )
}

function downloadFile(contents: string, name: string, type: string) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

