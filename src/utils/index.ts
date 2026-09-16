export function uid(prefix = ''): string {
  const part =
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
  return prefix ? `${prefix}-${part}` : part
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function pct(present: number, conducted: number): number | null {
  if (conducted <= 0) return null
  return Math.round((present / conducted) * 1000) / 10
}

export function safeDivide(a: number, b: number): number | null {
  if (b === 0) return null
  return a / b
}

export function isNumeric(n: unknown): n is number {
  return typeof n === 'number' && !Number.isNaN(n)
}

export function formatPct(p: number | null | undefined): string {
  if (p === null || p === undefined || Number.isNaN(p)) return 'N/A'
  const r = round1(p)
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}