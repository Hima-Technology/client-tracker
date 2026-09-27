import {
  forwardRef, useEffect, useRef,
  type ButtonHTMLAttributes, type ComponentType, type InputHTMLAttributes, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Star, X } from 'lucide-react'
import { STAGE } from '@/lib/constants'
import type { Profile, Status } from '@/lib/types'
import { cn, displayName, initials } from '@/lib/utils'

// ── Button ─────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'icon' | 'icon-sm'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm shadow-accent/20',
  secondary: 'bg-surface text-fg border border-line hover:bg-surface-2 hover:border-line-strong shadow-card',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  icon: 'h-9 w-9 rounded-lg',
  'icon-sm': 'h-7 w-7 rounded-md',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors select-none disabled:opacity-50 disabled:pointer-events-none',
        variants[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  ),
)

// ── Form fields ────────────────────────────────────────
const fieldBase =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-subtle transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => <input ref={ref} className={cn(fieldBase, 'h-9', className)} {...rest} />,
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, 'min-h-20 py-2 leading-relaxed resize-y', className)} {...rest} />
  ),
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => (
    <select ref={ref} className={cn(fieldBase, 'h-9 pr-8 appearance-none bg-no-repeat bg-[right_0.6rem_center] bg-[length:14px]', className)}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239a9aad' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
      {...rest}
    >
      {children}
    </select>
  ),
)

export function Field({ label, htmlFor, hint, className, children }: {
  label: string; htmlFor?: string; hint?: ReactNode; className?: string; children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted">{label}</label>
      {children}
      {hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  )
}

// ── Badges ─────────────────────────────────────────────
export function StageBadge({ status, className }: { status: Status; className?: string }) {
  const s = STAGE[status]
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset', s.bg, s.text, s.ring, className)}>
      <Icon className="size-3" strokeWidth={2.25} />
      {s.label}
    </span>
  )
}

export function Stars({ value, onChange, size = 14 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : undefined} aria-label={`Priority ${value} of 5`}>
      {[1, 2, 3, 4, 5].map(n => {
        const on = n <= value
        const star = (
          <Star
            size={size}
            className={cn(on ? 'fill-amber-400 text-amber-400' : 'text-line-strong', onChange && 'transition-transform group-hover:scale-110')}
            strokeWidth={on ? 1.5 : 2}
          />
        )
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)} className="group rounded p-0.5">
            {star}
          </button>
        ) : <span key={n}>{star}</span>
      })}
    </div>
  )
}

const avatarColors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500']

export function Avatar({ profile, size = 'sm', className }: { profile?: Profile | null; size?: 'xs' | 'sm' | 'md'; className?: string }) {
  const hash = [...(profile?.id ?? '')].reduce((a, ch) => a + ch.charCodeAt(0), 0)
  return (
    <span
      title={displayName(profile)}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface',
        size === 'xs' && 'size-5 text-[9px]', size === 'sm' && 'size-6 text-[10px]', size === 'md' && 'size-8 text-xs',
        profile ? avatarColors[hash % avatarColors.length] : 'bg-line-strong',
        className,
      )}
    >
      {initials(profile)}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-surface-2 px-1.5 py-px font-mono text-[10px] text-muted">{children}</kbd>
}

// ── Overlays ───────────────────────────────────────────
// Only the topmost overlay reacts to Escape.
const overlayStack: symbol[] = []

/** True when a sheet or dialog is open (global shortcuts should stand down). */
export const hasOpenOverlay = () => overlayStack.length > 0

function useOverlay(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    if (!open) return
    const id = Symbol()
    overlayStack.push(id)
    const prevFocus = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && overlayStack[overlayStack.length - 1] === id) onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      overlayStack.splice(overlayStack.indexOf(id), 1)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [open])
}

export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useOverlay(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-fade-in dark:bg-black/60" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={label}
        className="relative flex h-full w-full max-w-2xl flex-col border-l border-line bg-surface shadow-pop animate-slide-in-right">
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Dialog({ open, onClose, title, description, children, footer, className }: {
  open: boolean; onClose: () => void; title: string; description?: ReactNode; children?: ReactNode; footer?: ReactNode; className?: string
}) {
  useOverlay(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-fade-in dark:bg-black/60" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title}
        className={cn('relative w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-pop animate-pop-in', className)}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close"><X className="size-4" /></Button>
        </div>
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Delete' }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; description?: ReactNode; confirmLabel?: string
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}
      footer={<>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="danger" autoFocus onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
      </>}
    />
  )
}

export function EmptyState({ icon: Icon, title, children, className }: {
  icon: ComponentType<{ className?: string }>; title: string; children?: ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      <div className="mb-1 flex size-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted">
        <Icon className="size-5" />
      </div>
      <p className="font-medium">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  )
}
