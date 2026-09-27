import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c5cfc] to-[#4f46e5] shadow-md shadow-indigo-500/25', className)}>
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 16.5 10 11l3.5 3.5L19 7" />
      </svg>
    </div>
  )
}
