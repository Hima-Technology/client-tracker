import { forwardRef, type HTMLAttributes } from 'react'
import { AlarmClock } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { SWOT, channelIcon } from '@/lib/constants'
import type { Client } from '@/lib/types'
import { cn, followUpLabel, followUpState } from '@/lib/utils'
import { Avatar, Stars } from './ui'

export function FollowUpChip({ client, className }: { client: Client; className?: string }) {
  const state = followUpState(client)
  if (!state || !client.follow_up_on) return null
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
      state === 'overdue' && 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
      state === 'today' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      state === 'soon' && 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
      state === 'later' && 'bg-surface-2 text-muted',
      className,
    )} title={`Follow up ${state === 'overdue' ? '(overdue) ' : ''}on ${client.follow_up_on}`}>
      <AlarmClock className="size-3" />
      {state === 'overdue' ? 'Overdue · ' : ''}{followUpLabel(client.follow_up_on)}
    </span>
  )
}

export function SwotDots({ client }: { client: Client }) {
  const filled = SWOT.filter(s => client[s.key]).length
  if (!filled) return null
  return (
    <span className="inline-flex items-center gap-px font-mono text-[10px] font-semibold" title={`SWOT: ${filled}/4 filled`}>
      {SWOT.map(s => (
        <span key={s.key} className={cn('w-3 text-center', client[s.key] ? s.text : 'text-line-strong')}>{s.letter}</span>
      ))}
    </span>
  )
}

interface Props extends HTMLAttributes<HTMLDivElement> {
  client: Client
  dragging?: boolean
  overlay?: boolean
}

export const ClientCard = forwardRef<HTMLDivElement, Props>(({ client, dragging, overlay, className, ...rest }, ref) => {
  const { profiles } = useData()
  const ChannelIcon = channelIcon(client.channel)
  const owner = client.owner_id ? profiles.get(client.owner_id) : null
  const snippet = client.weakness || client.notes

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${client.name}. Open details`}
      className={cn(
        'group relative touch-manipulation rounded-xl border border-line bg-surface p-3 text-left shadow-card transition-[border-color,box-shadow,opacity] outline-none',
        'hover:border-line-strong hover:shadow-md focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/20',
        dragging && 'opacity-40',
        overlay && 'rotate-[1.5deg] cursor-grabbing border-accent/50 shadow-pop',
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 leading-snug font-medium">{client.name}</p>
        {owner && <Avatar profile={owner} size="xs" className="mt-0.5 ring-0" />}
      </div>

      {(client.handle || client.channel) && (
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted">
          {client.channel && <ChannelIcon className="size-3.5 shrink-0" />}
          <span className="truncate">{client.handle || client.channel}</span>
        </p>
      )}

      {snippet && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{snippet}</p>}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <Stars value={client.score} size={11} />
        <SwotDots client={client} />
        <FollowUpChip client={client} className="ml-auto" />
      </div>
    </div>
  )
})
