import { useState } from 'react'
import { Settings, Download, Trash2, Moon, Sun, Monitor, Shield, Bell, BellRing, HardDrive, User, Clock, CheckCircle2, Target } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button, Card, Badge, EmptyState, useToast, ConfirmDialog } from '@/components/ui'
import {
  saveProfile, clearCalendarSource, bulkSaveCalendarEvents,
  exportBackup, validateBackup, importBackup, attendanceToCsv, getAttendanceByProfile
} from '@/services/dataService'
import { getGrietSeedEvents } from '@/data/grietCalendar'
import { getTelanganaHolidaySeedEvents } from '@/data/telanganaCalendar'
import { requestNotificationPermission, sendTestNotification } from '@/services/notifications'
import { db } from '@/db'
import { GRIET_BRANCHES } from '@/data/constants'
import { cn } from '@/utils/cn'
import type { BackupData, StudentProfile } from '@/types'

const APP_VERSION = '1.0.0'

function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 px-5 pt-4 pb-2">
        <div className="mt-0.5 size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">{icon}</div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{title}</h3>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-5 pb-5 space-y-3">{children}</div>
    </Card>
  )
}

export default function SettingsPage() {
  const { profile, setProfile, settings, updateSettings, theme, setTheme, refresh } = useApp()
  const toast = useToast()

  const [busy, setBusy] = useState(false)
  const [importData, setImportData] = useState<BackupData | null>(null)
  const [importName, setImportName] = useState('')
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)

  // Profile editing
  const [name, setName] = useState(profile?.name ?? '')
  const [year, setYear] = useState(profile?.year ?? 'I')
  const [branch, setBranch] = useState(profile?.branch ?? 'CSE')
  const [section, setSection] = useState(profile?.section ?? 'A')
  const [semester, setSemester] = useState(profile?.semester ?? 'I')
  const [academicYear, setAcademicYear] = useState(profile?.academicYear ?? '2026-27')

  if (!profile || !settings) {
    return <EmptyState icon={<Settings size={28} />} title="No profile yet" />
  }

  async function saveProfileChanges() {
    if (!profile) return
    if (!name.trim()) { toast({ type: 'warning', message: 'Name cannot be empty.' }); return }
    setBusy(true)
    try {
      const updated: StudentProfile = { ...profile, id: profile.id, name: name.trim(), year, branch, section, semester, academicYear, updatedAt: new Date().toISOString() }
      await saveProfile(updated)
      setProfile(updated)
      toast({ type: 'success', message: 'Profile updated.' })
    } catch {
      toast({ type: 'error', message: 'Failed to save.' })
    } finally {
      setBusy(false)
    }
  }

  async function reseedCalendar() {
    setBusy(true)
    try {
      await clearCalendarSource('GRIET_ACADEMIC_CALENDAR')
      await bulkSaveCalendarEvents(getGrietSeedEvents(year, semester))
      await bulkSaveCalendarEvents(getTelanganaHolidaySeedEvents())
      refresh()
      toast({ type: 'success', message: 'Calendar reloaded for ' + year + ' ' + semester + ' semester.' })
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Reseed failed.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleExportBackup() {
    if (!profile) return
    setBusy(true)
    try {
      const data = await exportBackup(profile.id)
      downloadFile(JSON.stringify(data, null, 2), `griet-attendance-backup-${profile.id.slice(-6)}.json`, 'application/json')
      toast({ type: 'success', message: 'Backup exported.' })
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Export failed.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleExportCsv() {
    if (!profile) return
    setBusy(true)
    try {
      const records = await getAttendanceByProfile(profile.id)
      if (records.length === 0) { toast({ type: 'warning', message: 'No attendance records to export.' }); return }
      downloadFile(attendanceToCsv(records), `griet-attendance-${profile.id.slice(-6)}.csv`, 'text/csv')
      toast({ type: 'success', message: 'Attendance exported as CSV.' })
    } catch {
      toast({ type: 'error', message: 'CSV export failed.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      const result = validateBackup(parsed)
      if (!result.ok) { toast({ type: 'error', message: result.error ?? 'Invalid backup file.' }); return }
      setImportData(result.backup!)
      setImportName(file.name)
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Could not read file.' })
    }
  }

  async function applyImport(mode: 'merge' | 'replace') {
    if (!importData || !profile) return
    setBusy(true)
    try {
      const result = await importBackup(importData, mode)
      toast({ type: 'success', message: `Import complete: ${result.added} added, ${result.updated} updated (${importData.attendance?.length ?? 0} attendance, ${importData.subjects?.length ?? 0} subjects).` })
      setImportData(null)
      setImportName('')
      refresh()
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Import failed.' })
    } finally {
      setBusy(false)
    }
  }

  async function deleteAllData() {
    setBusy(true)
    try {
      await db.reset()
      setProfile(null)
      setDeleteAllConfirm(false)
      toast({ type: 'info', message: 'All data deleted. You will be taken to set up.' })
      window.location.replace('/')
    } catch {
      toast({ type: 'error', message: 'Failed to delete all data.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Settings size={20} className="text-slate-500" aria-hidden />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Preferences, data & privacy</p>
        </div>
      </div>

      {/* Profile */}
      <Section icon={<User size={18} />} title="Your profile" description="Basic information stored locally on this device.">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="s-name">Name</label>
            <input id="s-name" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="s-section">Section</label>
            <input id="s-section" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={section} onChange={(e) => setSection(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="s-year">Year</label>
            <select id="s-year" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
              {['I', 'II', 'III', 'IV'].map((y) => <option key={y} value={y}>{y} year</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="s-branch">Branch</label>
            <select id="s-branch" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={branch} onChange={(e) => setBranch(e.target.value)}>
              {GRIET_BRANCHES.map((b) => <option key={b.label} value={b.label}>{b.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="s-ay">Academic year</label>
            <select id="s-ay" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              {['2026-27', '2025-26', '2027-28'].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="s-sem">Semester</label>
            <select id="s-sem" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={semester} onChange={(e) => setSemester(e.target.value)}>
              {['I', 'II'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <Button size="sm" disabled={busy} onClick={() => void saveProfileChanges()}>Save profile</Button>
      </Section>

      {/* Academic calendar */}
      <Section icon={<Clock size={18} />} title="Academic calendar" description="Automatically loaded for your year/semester at setup. Re-seed after updating your profile year/semester.">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          GRIET events are taken from the published 2026-27 academic calendar (verifiable in any prospectus).
          Telangana state holidays are treated as candidates — the app never automatically treats them as official closures.
        </p>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => void reseedCalendar()}>
          <Download size={14} aria-hidden /> Reload calendar for {year} sem {semester}
        </Button>
      </Section>

      {/* Targets */}
      <Section icon={<Target size={18} />} title="Attendance target" description="Your personal target percentage used for health status, insights and plans.">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <input type="range" min={0} max={100} step={5} value={settings.attendanceTarget} onChange={(e) => updateSettings({ attendanceTarget: Number(e.target.value) })} className="w-full accent-brand-600" />
          </div>
          <p className="text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400 w-16 text-right">{settings.attendanceTarget}%</p>
        </div>
        <p className="text-[11px] text-slate-400">This is your personal planning indicator, not an official GRIET minimum.</p>
      </Section>

      {/* Notifications */}
      <Section icon={<Bell size={18} />} title="Notifications" description="Optional, OS-level reminders about classes and attendance.">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-700 dark:text-slate-200">Enable notifications</span>
          <button
            onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
            className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', settings.notificationsEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600')}
            role="switch"
            aria-checked={settings.notificationsEnabled}
          >
            <span className={cn('inline-block size-4 transform rounded-full bg-white transition-transform', settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1')} />
          </button>
        </div>
        {settings.notificationsEnabled && (
          <div className="space-y-2">
            {([
              ['nextClass', 'Next class reminder'],
              ['attendanceWarnings', 'Attendance warnings']
            ] as ['nextClass' | 'attendanceWarnings', string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{label}</span>
                  <button
                    onClick={() => updateSettings({ notificationPreferences: { ...settings.notificationPreferences, [key]: !settings.notificationPreferences[key] } })}
                    className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', settings.notificationPreferences[key] ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600')}
                    role="switch"
                    aria-checked={settings.notificationPreferences[key]}
                  >
                    <span className={cn('inline-block size-3.5 transform rounded-full bg-white transition-transform', settings.notificationPreferences[key] ? 'translate-x-4.5' : 'translate-x-1')} />
                  </button>
                </div>
              ))}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-700 dark:text-slate-200">Remind before class</span>
              <select className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs" value={settings.notificationPreferences.reminderMinutes} onChange={(e) => updateSettings({ notificationPreferences: { ...settings.notificationPreferences, reminderMinutes: Number(e.target.value) as 5 | 10 | 15 | 30 } })}>
                {[5, 10, 15, 30].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <Button variant="ghost" size="sm" onClick={async () => { const r = await requestNotificationPermission(); toast({ type: r === 'granted' ? 'success' : 'warning', message: r === 'granted' ? 'Permission granted.' : 'Permission ' + r + '. Notifications require OS-level permission.' }) }}>
              <BellRing size={14} aria-hidden /> Request permission
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { const r = await sendTestNotification(settings); toast({ type: r.ok ? 'success' : 'warning', message: r.message }) }}>
              <Bell size={14} aria-hidden /> Send test notification
            </Button>
          </div>
        )}
      </Section>

      {/* Data & Backup */}
      <Section icon={<HardDrive size={18} />} title="Data & backup" description="Import and export your data. Everything stays on this device.">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleExportBackup()}>
            <Download size={14} aria-hidden /> Export backup
          </Button>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleExportCsv()}>
            <Download size={14} aria-hidden /> Export CSV
          </Button>
        </div>

        <div>
          <label className="block">
            <span className="sr-only">Import backup JSON</span>
            <input type="file" accept=".json,application/json" onChange={(e) => e.target.files?.[0] && void handleImportFile(e.target.files[0])} className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-white file:text-xs hover:file:bg-brand-700 file:font-semibold" />
          </label>
          {importData && (
            <div className="mt-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Preview: {importName}</p>
              <div className="mt-1 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div><p className="font-bold text-slate-800 dark:text-slate-100">{importData.profile?.name ?? '—'}</p><p className="text-slate-400">student</p></div>
                <div><p className="font-bold text-slate-800 dark:text-slate-100">{importData.attendance?.length ?? 0}</p><p className="text-slate-400">attendance records</p></div>
                <div><p className="font-bold text-slate-800 dark:text-slate-100">{importData.timetableSlots?.length ?? 0}</p><p className="text-slate-400">timetable slots</p></div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" disabled={busy} onClick={() => void applyImport('merge')}>Merge</Button>
                <Button variant="danger" size="sm" disabled={busy} onClick={() => void applyImport('replace')}>Replace all</Button>
                <Button variant="ghost" size="sm" onClick={() => setImportData(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button variant="danger" size="sm" onClick={() => setDeleteAllConfirm(true)}><Trash2 size={14} aria-hidden /> Delete all data</Button>
          <p className="mt-1 text-[11px] text-slate-400">Irreversible. This clears every profile, timetable, and record on this device.</p>
        </div>
      </Section>

      {/* Appearance */}
      <Section icon={<Moon size={18} />} title="Appearance" description="Choose between light, dark, or system default theme.">
        <div className="flex gap-2">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Monitor }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value as 'light' | 'dark' | 'system'); updateSettings({ theme: value as 'light' | 'dark' | 'system' }) }}
              className={cn('flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors',
                theme === value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700')}
            >
              <Icon size={14} aria-hidden /> {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Privacy & About */}
      <Section icon={<Shield size={18} />} title="Privacy & about" description="Where your data lives.">
        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> All data is stored in your browser's IndexedDB. Nothing is uploaded.</li>
          <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> The calendar is seeded from the published GRIET 2026-27 calendar and verified Telangana holiday candidates.</li>
          <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> State holidays are never automatically treated as official closures — you verify them.</li>
          <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> Attendance percentages and budgets are computed exactly from your inputs; no rounding errors.</li>
        </ul>

        <div className="pt-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">GRIET Attendance</p>
            <Badge tone="info">v{APP_VERSION}</Badge>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Built by Mohammed Anasuddin Zaid. This is an independent, student-built utility. It is <strong>not</strong> affiliated with, endorsed by, or officially connected to Gokaraju Rangaraju Institute of Engineering and Technology (GRIET).
          </p>
        </div>
      </Section>

      <ConfirmDialog
        open={deleteAllConfirm}
        title="Delete all data?"
        description="This removes every profile, timetable, attendance record, and setting on this device. It cannot be undone."
        confirmLabel="Delete everything"
        onConfirm={() => void deleteAllData()}
        onCancel={() => setDeleteAllConfirm(false)}
      />
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