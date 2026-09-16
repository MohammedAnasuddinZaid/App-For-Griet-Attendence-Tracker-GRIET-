import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { X, CheckCircle2, Info, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

// ---------- Button ----------

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
}

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700',
  ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700'
}

export function Button({ variant = 'primary', size = 'md', full, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' && 'px-3 h-8 text-xs',
        size === 'md' && 'px-4 h-10 text-sm',
        size === 'lg' && 'px-5 h-12 text-base',
        full && 'w-full',
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  )
}

// ---------- Card ----------

export function Card({ className, children, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800',
        onClick && 'cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, right, className }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between px-5 pt-4 pb-2', className)}>
      <div className="min-w-0">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

// ---------- Badge ----------

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'holiday' | 'exam' | 'special' | 'purple'

const BADGE_TONES: Record<BadgeTone, string> = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  holiday: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  exam: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300',
  special: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300',
  purple: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
}

export function Badge({ tone = 'neutral', children, className, dot }: { tone?: BadgeTone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium', BADGE_TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

// ---------- Progress ----------

export function Progress({ value, max, tone = 'auto', className }: { value: number; max?: number; tone?: 'auto' | 'success' | 'warning' | 'danger'; className?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : Math.min(100, value)
  const color =
    tone !== 'auto'
      ? tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-red-500'
      : pct >= 80 ? 'bg-emerald-500'
        : pct >= 65 ? 'bg-amber-500'
          : 'bg-red-500'
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ---------- EmptyState ----------

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
      {icon && <div className="mb-3 text-slate-400 dark:text-slate-500">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ---------- ErrorState ----------

export function ErrorState({ title = 'Something went wrong in this section.', onRetry }: { title?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
      <AlertTriangle className="mb-3 text-red-400" size={28} aria-hidden />
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

// ---------- Skeleton ----------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/70', className)} />
}

// ---------- Snackbar / Toast system ----------

type ToastType = 'success' | 'info' | 'warning' | 'error'
interface Toast {
  id: number
  type: ToastType
  message: string
  action?: { label: string; onClick: () => void }
}

const ToastCtx = createContext<{ toast: (t: Omit<Toast, 'id'>) => void }>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500)
  }

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[90] space-y-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => <ToastView key={t.id} toast={t} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />)}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx).toast
}

const TOAST_STYLE: Record<ToastType, { icon: ReactNode; cls: string }> = {
  success: { icon: <CheckCircle2 size={18} />, cls: 'text-emerald-600 dark:text-emerald-400' },
  info: { icon: <Info size={18} />, cls: 'text-sky-600 dark:text-sky-400' },
  warning: { icon: <AlertTriangle size={18} />, cls: 'text-amber-600 dark:text-amber-400' },
  error: { icon: <AlertCircle size={18} />, cls: 'text-red-600 dark:text-red-400' }
}

function ToastView({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const s = TOAST_STYLE[toast.type]
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-elevated px-4 py-3 animate-scale-in">
      <span className={s.cls}>{s.icon}</span>
      <p className="flex-1 text-sm text-slate-800 dark:text-slate-100">{toast.message}</p>
      {toast.action && (
        <button onClick={() => { toast.action?.onClick(); onDismiss() }} className="text-sm font-semibold text-brand-600 dark:text-brand-400">
          {toast.action.label}
        </button>
      )}
      <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  )
}

// ---------- BottomSheet / Dialog ----------

export function Modal({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label?: string }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute bottom-0 md:top-0 md:right-0 md:bottom-0 md:w-full md:max-w-md w-full md:border-l md:border-slate-200 md:dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-none max-h-[88vh] md:max-h-full overflow-y-auto animate-slide-in pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{label}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---------- ConfirmDialog ----------

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger', onConfirm, onCancel }: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[85] flex items-end md:items-center justify-center" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full md:max-w-sm m-0 md:m-4 rounded-t-3xl md:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 animate-scale-in">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={tone} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}