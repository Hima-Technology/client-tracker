import { useMemo, type ComponentType, type ReactNode } from 'react'
import { AlarmClock, CalendarCheck2, History, Percent, Send, Trophy, Users } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { useActivities } from '@/hooks/useActivities'
import { CONTACTED, STAGES, channelIcon } from '@/lib/constants'
import type { Client } from '@/lib/types'
import { cn, followUpState, todayISO } from '@/lib/utils'
import { FollowUpChip } from './ClientCard'
import { ActivityItem } from './ActivityFeed'
import { EmptyState, StageBadge } from './ui'

export function Dashboard({ onOpen, onOpenId }: { onOpen: (c: Client) => void; onOpenId: (id: string) => void }) {
  const { clients } = useData()
  const { items: activity, loading: activityLoading } = useActivities(undefined, 12)

  const stats = useMemo(() => {
    const byStage = Object.fromEntries(STAGES.map(s => [s.id, 0])) as Record<Client['status'], number>
    const byChannel = new Map<string, number>()
    for (const c of clients) {
      byStage[c.status]++
      const ch = c.channel || 'No channel'
      byChannel.set(ch, (byChannel.get(ch) ?? 0) + 1)
    }
    const contacted = clients.filter(c => CONTACTED.includes(c.status)).length
    const decided = byStage.closed + byStage.lost
    const monthStart = todayISO().slice(0, 8) + '01'
    return {
      byStage,
      contacted,
      won: byStage.closed,
      winRate: decided ? Math.round((byStage.closed / decided) * 100) : null,
      replyRate: contacted ? Math.round(((byStage.replied + byStage.closed) / contacted) * 100) : null,
      newThisMonth: clients.filter(c => c.created_at.slice(0, 10) >= monthStart).length,
      channels: [...byChannel.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [clients])

  const followUps = useMemo(() => {
    const horizon = todayISO(7)
    return clients
      .filter(c => followUpState(c) && c.follow_up_on! <= horizon)
      .sort((a, b) => a.follow_up_on!.localeCompare(b.follow_up_on!))
  }, [clients])

  const overdue = followUps.filter(c => followUpState(c) === 'overdue').length
  const maxStage = Math.max(1, ...Object.values(stats.byStage))
  const maxChannel = Math.max(1, ...stats.channels.map(c => c[1]))

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Users} label="Total clients" value={clients.length} sub={`+${stats.newThisMonth} this month`} />
        <Kpi icon={Send} label="Contacted" value={stats.contacted}
          sub={stats.replyRate != null ? `${stats.replyRate}% replied` : 'No outreach yet'} />
        <Kpi icon={Trophy} label="Won" value={stats.won} tone="emerald"
          sub={stats.winRate != null ? `${stats.winRate}% win rate` : 'No decisions yet'} />
        <Kpi icon={AlarmClock} label="Overdue follow-ups" value={overdue} tone={overdue ? 'rose' : undefined}
          sub={`${followUps.length} due within 7 days`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Pipeline" icon={Percent} className="lg:col-span-2">
          <div className="space-y-2.5">
            {STAGES.map(s => {
              const n = stats.byStage[s.id]
              return (
                <div key={s.id} className="grid grid-cols-[96px_1fr_36px] items-center gap-3">
                  <span className="text-sm text-muted">{s.label}</span>
                  <div className="h-7 overflow-hidden rounded-lg bg-surface-2">
                    <div className="h-full rounded-lg transition-[width] duration-500"
                      style={{ width: `${(n / maxStage) * 100}%`, background: s.hex, opacity: n ? 0.85 : 0 }} />
                  </div>
                  <span className="text-right text-sm font-semibold tabular-nums">{n}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="By channel" icon={Send}>
          {stats.channels.length ? (
            <ul className="space-y-3">
              {stats.channels.map(([ch, n]) => {
                const Icon = channelIcon(ch)
                return (
                  <li key={ch}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted"><Icon className="size-3.5" />{ch}</span>
                      <span className="font-semibold tabular-nums">{n}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(n / maxChannel) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : <p className="text-sm text-muted">No data yet.</p>}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Follow-ups · next 7 days" icon={CalendarCheck2}>
          {followUps.length ? (
            <ul className="-mx-2 divide-y divide-line">
              {followUps.map(c => (
                <li key={c.id}>
                  <button type="button" onClick={() => onOpen(c)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-surface-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{c.notes || c.weakness || c.handle}</span>
                    </span>
                    <StageBadge status={c.status} className="hidden sm:inline-flex" />
                    <FollowUpChip client={c} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CalendarCheck2} title="All caught up" className="py-8">
              Set a follow-up date on a client to see it here.
            </EmptyState>
          )}
        </Card>

        <Card title="Recent activity" icon={History}>
          {activityLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : activity.length ? (
            <ul className="space-y-3">
              {activity.map(a => (
                <ActivityItem key={a.id} activity={a} showClient onOpenClient={onOpenId} />
              ))}
            </ul>
          ) : <p className="text-sm text-muted">No activity yet.</p>}
        </Card>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, sub, tone }: {
  icon: ComponentType<{ className?: string }>; label: string; value: number; sub: string; tone?: 'emerald' | 'rose'
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className={cn('flex size-7 items-center justify-center rounded-lg',
          tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : tone === 'rose' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              : 'bg-accent-soft text-accent')}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{sub}</div>
    </div>
  )
}

function Card({ title, icon: Icon, children, className }: {
  title: string; icon: ComponentType<{ className?: string }>; children: ReactNode; className?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5', className)}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-muted" />{title}
      </h2>
      {children}
    </section>
  )
}
