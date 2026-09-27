import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Minimal dropdown: trigger renders the button, children render items (call close() when done). */
export function Menu({ trigger, children, align = 'end', className }: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'start' | 'end'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen(o => !o) })}
      {open && (
        <div role="menu"
          className={cn(
            'absolute top-full z-40 mt-1.5 min-w-48 rounded-xl border border-line bg-surface p-1 shadow-pop animate-pop-in',
            align === 'end' ? 'right-0' : 'left-0', className,
          )}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon: Icon, children, onClick, danger }: {
  icon?: ComponentType<{ className?: string }>
  children: ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button type="button" role="menuitem" onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
        danger ? 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-400' : 'text-fg hover:bg-surface-2',
      )}>
      {Icon && <Icon className={cn('size-4', !danger && 'text-muted')} />}
      {children}
    </button>
  )
}
