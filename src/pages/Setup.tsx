import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, GraduationCap, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button, useToast } from '@/components/ui'
import { GRIET_BRANCHES, YEARS, SEMESTERS, ACADEMIC_YEARS, DEFAULT_SECTIONS } from '@/data/constants'
import { saveProfile, ensureDefaultSettings, bulkSaveCalendarEvents, clearCalendarSource } from '@/services/dataService'
import { getGrietSeedEvents } from '@/data/grietCalendar'
import { getTelanganaHolidaySeedEvents } from '@/data/telanganaCalendar'
import { currentAcademicSemester } from '@/utils/date'
import { uid } from '@/utils'
import type { StudentProfile } from '@/types'
import { cn } from '@/utils/cn'

const STEPS = ['Welcome', 'Your name', 'Year', 'Branch', 'Section', 'Term', 'Review']

export default function SetupPage() {
  const { setProfile, setTheme, profiles } = useApp()
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [year, setYear] = useState<string | null>(null)
  const [branch, setBranch] = useState<string | null>(null)
  const [section, setSection] = useState('')
  const [customSection, setCustomSection] = useState('')
  const [customBranchInput, setCustomBranchInput] = useState('')
  const [customBranches, setCustomBranches] = useState<string[]>([])
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0] ?? '2026-27')
  const [semester, setSemester] = useState(currentAcademicSemester().semester)
  const [semesterLocked, setSemesterLocked] = useState(false)

  const suggestedSem = currentAcademicSemester().semester
  if (!semesterLocked && semester !== suggestedSem) setSemester(suggestedSem)

  const allSections = [...new Set([...DEFAULT_SECTIONS, ...(customSection ? [customSection] : []), ...(section ? [section] : [])])]
  const allBranches = [...GRIET_BRANCHES.map((b) => b.label), ...customBranches]

  const canContinue =
    step === 1 ? name.trim().length >= 2
    : step === 2 ? year !== null
    : step === 3 ? branch !== null
    : step === 4 ? section !== ''
    : step === 5 ? academicYear !== '' && semester !== ''
    : true

  async function finishSetup() {
    if (!name.trim() || !year || !branch || !section) return
    setBusy(true)
    try {
      const now = new Date().toISOString()
      const profile: StudentProfile = {
        id: uid('prof'),
        name: name.trim(),
        year,
        branch,
        section,
        academicYear,
        semester,
        createdAt: now,
        updatedAt: now
      }

      await saveProfile(profile)
      await ensureDefaultSettings(profile.id)

      // Seed academic calendar for this year + semester (idempotent, deduped).
      await clearCalendarSource('GRIET_ACADEMIC_CALENDAR')
      await bulkSaveCalendarEvents(getGrietSeedEvents(year, semester))
      // Telangana state candidates are global, non-confirmed sources.
      await bulkSaveCalendarEvents(getTelanganaHolidaySeedEvents())

      // Apply system theme unless user already chose otherwise
      setTheme('system')

      setProfile(profile)
      await new Promise((r) => setTimeout(r, 250))
      toast({ type: 'success', message: `Welcome, ${name.trim()}! Your profile is ready.` })
      navigate('/', { replace: true })
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Could not save your profile.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-slate-950 bg-grid-pattern">
      <div className="w-full max-w-lg px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto flex items-center justify-center">
            <div className="size-14 rounded-2xl bg-brand-600 shadow-elevated flex items-center justify-center text-white font-black text-2xl">G</div>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">GRIET Attendance</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Offline-first attendance tracker for GRIET students</p>
        </div>

        <div className="card p-6">
          {/* Progress */}
          <div className="mb-5 flex items-center gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-800')} />
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (canContinue) setStep(step + 1) }} className="space-y-5">
            {step === 0 && (
              <div className="animate-fade-in space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Track your attendance the smart way</h2>
                <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2.5"><Sparkles size={16} className="mt-0.5 shrink-0 text-brand-500" aria-hidden /><span>Live attendance math: how safe you are and how many classes you can miss.</span></li>
                  <li className="flex items-start gap-2.5"><GraduationCap size={16} className="mt-0.5 shrink-0 text-brand-500" aria-hidden /><span>GRIET academic calendar + Telangana holiday candidates, verified by you.</span></li>
                  <li className="flex items-start gap-2.5"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-500" aria-hidden /><span>100% offline-first. Everything stays on this device.</span></li>
                </ul>
                {profiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    I already have a profile
                  </button>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-in space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">What should we call you?</h2>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anasuddin Zaid"
                    maxLength={60}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm"
                  />
                </div>
                <p className="text-xs text-slate-400">Used only inside this app on your device.</p>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Which year are you in?</h2>
                <div className="grid grid-cols-4 gap-2">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={cn('rounded-xl border py-4 text-lg font-bold transition-colors',
                        year === y ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-300')}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your branch</h2>
                <div className="grid grid-cols-2 gap-2">
                  {allBranches.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBranch(b)}
                      className={cn('rounded-xl border px-3 py-3 text-sm font-semibold transition-colors',
                        branch === b ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-300')}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <input
                  value={customBranchInput}
                  onChange={(e) => setCustomBranchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customBranchInput.trim()) {
                      e.preventDefault()
                      const v = customBranchInput.trim().toUpperCase().replace(/\s+/g, '-')
                      if (!customBranches.includes(v) && !GRIET_BRANCHES.some((b) => b.label === v)) {
                        setCustomBranches([...customBranches, v])
                        setBranch(v)
                      }
                      setCustomBranchInput('')
                    }
                  }}
                  placeholder="Branch not listed? Type it + Enter"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
                />
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your section</h2>
                <div className="grid grid-cols-4 gap-2">
                  {allSections.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSection(s)}
                      className={cn('rounded-xl border py-3 text-base font-bold transition-colors',
                        section === s ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-300')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  value={customSection}
                  onChange={(e) => setCustomSection(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customSection.trim()) {
                      e.preventDefault()
                      setSection(customSection.trim())
                    }
                  }}
                  placeholder="Add a section like I or CSE-A, then press Enter"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
                />
              </div>
            )}

            {step === 5 && (
              <div className="animate-fade-in space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Academic term</h2>
                <div>
                  <label className="text-xs font-medium text-slate-500" htmlFor="ay">Academic year</label>
                  <select id="ay" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                    {ACADEMIC_YEARS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500" htmlFor="sem">Semester</label>
                  <div className="mt-1 flex items-center gap-2">
                    <select id="sem" className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm" value={semester} onChange={(e) => setSemester(e.target.value)}>
                      {SEMESTERS.map((s) => <option key={s} value={s}>{s} semester</option>)}
                    </select>
                    {suggestedSem && (
                      <button
                        type="button"
                        onClick={() => { setSemester(suggestedSem); setSemesterLocked(true) }}
                        className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        Suggest {suggestedSem}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400">Your GRIET academic calendar events will be loaded for this term. Telangana holidays are shown as candidates you verify.</p>
              </div>
            )}

            {step === 6 && (
              <div className="animate-fade-in space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">All set — review</h2>
                <dl className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 space-y-2 text-sm">
                  {[
                    ['Name', name.trim() || '—'],
                    ['Class', year && branch ? `${year} B.Tech · ${branch} · Sec ${section}` : '—'],
                    ['Academic year', academicYear],
                    ['Semester', semester]
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                      <dd className="font-semibold text-slate-800 dark:text-slate-100 text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs leading-relaxed text-slate-400">
                  This is a student-built, independent tool. It is <strong>not</strong> an official GRIET service. All data is stored only on this device.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={15} aria-hidden /> Back</Button>
              ) : <span aria-hidden />}
              {step < STEPS.length - 1 ? (
                <Button type="button" disabled={!canContinue} onClick={() => setStep(step + 1)}>
                  Continue <ArrowRight size={15} aria-hidden />
                </Button>
              ) : (
                <Button type="button" disabled={!canContinue || busy} onClick={() => void finishSetup()} className="px-5">
                  <Check size={15} aria-hidden /> {busy ? 'Setting up…' : 'Finish setup'}
                </Button>
              )}
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Built by Mohammed Anasuddin Zaid — not affiliated with or endorsed by GRIET.
        </p>
      </div>
    </div>
  )
}