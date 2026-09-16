// Timezone-safe date utilities. Application timezone: Asia/Kolkata.
// Never use new Date("YYYY-MM-DD") blindly — it can shift the local date.

export const APP_TZ = 'Asia/Kolkata'

export function formatDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1)
}

export function todayStr(): string {
  return formatDateLocal(new Date())
}

export function addDays(dateStr: string, days: number): string {
  const d = toDateString(dateStr)
  d.setDate(d.getDate() + days)
  return formatDateLocal(d)
}

export function addMonths(dateStr: string, months: number): string {
  const d = toDateString(dateStr)
  d.setMonth(d.getMonth() + months)
  return formatDateLocal(d)
}

export function daysBetween(a: string, b: string): number {
  const start = toDateString(a).getTime()
  const end = toDateString(b).getTime()
  return Math.round((end - start) / 86400000)
}

export function isSameOrBefore(a: string, b: string): boolean {
  return a <= b
}

export function isSameOrAfter(a: string, b: string): boolean {
  return a >= b
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr()
}

export function getDayOfWeek(dateStr: string): number {
  return toDateString(dateStr).getDay()
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

export function getYearDescription(dateStr: string): string {
  return dateStr.slice(0, 4)
}

export function formatFriendlyDate(dateStr: string, opts?: { weekday?: boolean; year?: boolean }): string {
  const d = toDateString(dateStr)
  const weekday = opts?.weekday !== false
  const year = opts?.year ?? false
  const wd = d.toLocaleDateString('en-IN', { weekday: 'long' })
  const rest = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    ...(year ? { year: 'numeric' } : {})
  })
  return weekday ? `${wd}, ${rest}` : rest
}

export function formatShortDate(dateStr: string): string {
  const d = toDateString(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatMonthYear(monthKey: string): string {
  const d = toDateString(`${monthKey}-01`)
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function weekdayShort(dayOfWeek: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek] ?? ''
}

export function weekdayLong(dayOfWeek: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek] ?? ''
}

export function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { hour: h ?? 0, minute: m ?? 0 }
}

export function timeToMinutes(timeStr: string): number {
  const { hour, minute } = parseTime(timeStr)
  return hour * 60 + minute
}

export function minutesToTime(minutes: number): string {
  const clamp = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(clamp / 60)
  const m = clamp % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTime12(timeStr: string): string {
  const { hour, minute } = parseTime(timeStr)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`
}

export function formatTime(timeStr: string, fmt: '12h' | '24h' = '12h'): string {
  return fmt === '24h' ? timeStr : formatTime12(timeStr)
}

export function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(dateStr + 'T00:00:00')
  return !Number.isNaN(d.getTime())
}

export function isValidTime(timeStr: string): boolean {
  if (!/^\d{1,2}:\d{2}$/.test(timeStr)) return false
  const { hour, minute } = parseTime(timeStr)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

export function getMonthDays(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number)
  const days = new Date(y ?? 0, (m ?? 1), 0).getDate()
  const out: string[] = []
  for (let d = 1; d <= days; d++) {
    out.push(`${monthKey}-${String(d).padStart(2, '0')}`)
  }
  return out
}

export function getWeekDates(startOfWeek: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i))
}

export function startOfWeek(dateStr: string): string {
  const d = toDateString(dateStr)
  const dow = d.getDay()
  d.setDate(d.getDate() - dow)
  return formatDateLocal(d)
}

export function startOfMonth(dateStr: string): string {
  return dateStr.slice(0, 8) + '01'
}

export function currentAcademicSemester(): { semester: string; phrase: string } {
  const year = new Date().getFullYear()
  // AY boundary: July (new academic year). Semester I roughly Jul-Dec, II Jan-Jun.
  const month = new Date().getMonth() // 0-based
  if (month >= 6) {
    return { semester: 'I', phrase: `${year}-${String(year + 1).slice(2)} Semester I` }
  }
  return { semester: 'II', phrase: `${year - 1}-${String(year).slice(2)} Semester II` }
}

export function academicYearLabel(): string {
  const year = new Date().getFullYear()
  const month = new Date().getMonth()
  if (month >= 6) return `${year}-${String(year + 1).slice(2)}`
  return `${year - 1}-${String(year).slice(2)}`
}