import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, SearchX } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { STAGES, channelIcon } from '@/lib/constants'
import type { Client } from '@/lib/types'
import { cn, displayName, timeAgo } from '@/lib/utils'
import { FollowUpChip, SwotDots } from './ClientCard'
import { Avatar, EmptyState, StageBadge, Stars } from './ui'

type Key = 'name' | 'status' | 'score' | 'channel' | 'owner' | 'follow_up_on' | 'updated_at'
const stageOrder = Object.fromEntries(STAGES.map((s, i) => [s.id, i]))

const COLS: { key: Key; label: string; className?: string }[] = [
  { key: 'name', label: 'Client', className: 'min-w-64' },
  { key: 'status', label: 'Stage' },
  { key: 'score', label: 'Priority' },
  { key: 'channel', label: 'Channel' },
  { key: 'owner', label: 'Owner' },
  { key: 'follow_up_on', label: 'Follow-up' },
  { key: 'updated_at', label: 'Updated' },
]

export function TableView({ clients, onOpen }: { clients: Client[]; onOpen: (c: Client) => void }) {
  const { profiles } = useData()
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: 'updated_at', dir: -1 })

  const rows = useMemo(() => {
    const val = (c: Client): string | number => {
      switch (sort.key) {
        case 'status': return stageOrder[c.status]
        case 'score': return c.score
        case 'owner': return c.owner_id ? displayName(profiles.get(c.owner_id)).toLowerCase() : '￿'
        case 'follow_up_on': return c.follow_up_on ?? '￿'
        case 'name': return c.name.toLowerCase()
        default: return c[sort.key] || '￿'
      }
    }
    return [...clients].sort((a, b) => {
      const x = val(a), y = val(b)
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir
    })
  }, [clients, sort, profiles])

  const toggle = (key: Key) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'score' || key === 'updated_at' ? -1 : 1 }))

  if (!clients.length) {
    return <EmptyState icon={SearchX} title="No matching clients" className="flex-1">Try a different search or reset the filters.</EmptyState>
  }

  return (
    <div className="px-4 pb-6 sm:px-6">
      <div className="scroll-thin overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {COLS.map(col => {
                const active = sort.key === col.key
                const Icon = !active ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown
                return (
                  <th key={col.key} scope="col" aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                    className={cn('px-4 py-2.5 font-medium whitespace-nowrap', col.className)}>
                    <button type="button" onClick={() => toggle(col.key)}
                      className={cn('-mx-1 inline-flex items-center gap-1 rounded px-1 text-xs transition-colors', active ? 'text-fg' : 'text-muted hover:text-fg')}>
                      {col.label}
                      <Icon className={cn('size-3', !active && 'opacity-50')} />
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(c => {
              const ChannelIcon = channelIcon(c.channel)
              const owner = c.owner_id ? profiles.get(c.owner_id) : null
              return (
                <tr key={c.id} onClick={() => onOpen(c)} tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') onOpen(c) }}
                  className="cursor-pointer transition-colors hover:bg-surface-2/70 focus-visible:bg-surface-2 focus-visible:outline-none">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <SwotDots client={c} />
                    </div>
                    {c.handle && <div className="mt-0.5 text-xs text-muted">{c.handle}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><StageBadge status={c.status} /></td>
                  <td className="px-4 py-3"><Stars value={c.score} size={12} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {c.channel ? <span className="inline-flex items-center gap-1.5"><ChannelIcon className="size-3.5" />{c.channel}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {owner ? <span className="inline-flex items-center gap-2"><Avatar profile={owner} size="xs" className="ring-0" />{displayName(owner)}</span>
                      : <span className="text-subtle">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.follow_up_on ? <FollowUpChip client={c} /> : <span className="text-subtle">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted" title={new Date(c.updated_at).toLocaleString()}>
                    {timeAgo(c.updated_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
