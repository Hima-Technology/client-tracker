import { useState, type FormEvent } from 'react'
import { ArrowRight, MessageSquareText, PencilLine, Sparkles, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { useActivities } from '@/hooks/useActivities'
import type { Activity } from '@/lib/types'
import { displayName, timeAgo } from '@/lib/utils'
import { Avatar, Button, StageBadge, Textarea } from './ui'

export function ActivityItem({ activity: a, showClient, onOpenClient, onDelete }: {
  activity: Activity
  showClient?: boolean
  onOpenClient?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const { profiles, clients } = useData()
  const actor = a.actor_id ? profiles.get(a.actor_id) : null
  const client = showClient ? clients.find(c => c.id === a.client_id) : null
  const who = <span className="font-medium text-fg">{displayName(actor)}</span>
  const what = client ? (
    <button type="button" onClick={() => onOpenClient?.(client.id)} className="font-medium text-fg hover:text-accent hover:underline">
      {client.name}
    </button>
  ) : null

  const Icon = a.kind === 'note' ? MessageSquareText : a.kind === 'status' ? ArrowRight : a.kind === 'created' ? Sparkles : PencilLine

  return (
    <li className="group flex gap-3">
      <div className="relative h-fit shrink-0">
        <Avatar profile={actor} size="sm" className="ring-0" />
        <span className="absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-surface ring-1 ring-line">
          <Icon className="size-2.5 text-muted" />
        </span>
      </div>
      <div className="min-w-0 flex-1 text-sm text-muted">
        <p className="leading-6">
          {a.kind === 'created' && <>{who} added {what ?? 'this client'}{a.to_status && a.to_status !== 'new' && <> in <StageBadge status={a.to_status} /></>}</>}
          {a.kind === 'status' && a.to_status && (
            <>{who} moved {what ?? ''} {a.from_status && <><StageBadge status={a.from_status} className="opacity-70" /> <ArrowRight className="inline size-3" /> </>}<StageBadge status={a.to_status} /></>
          )}
          {a.kind === 'updated' && <>{who} edited {what ?? 'details'}</>}
          {a.kind === 'note' && <>{who} left a note{what && <> on {what}</>}</>}
          <span className="ml-1.5 text-xs text-subtle" title={new Date(a.created_at).toLocaleString()}>· {timeAgo(a.created_at)}</span>
        </p>
        {a.kind === 'note' && (
          <div className="relative mt-1.5 rounded-xl rounded-tl-sm border border-line bg-surface-2/60 px-3 py-2 text-fg whitespace-pre-wrap">
            {a.body}
            {onDelete && (
              <button type="button" onClick={() => onDelete(a.id)} aria-label="Delete note"
                className="absolute top-1.5 right-1.5 rounded p-1 text-subtle opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100 focus:opacity-100">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

export function ActivityFeed({ clientId }: { clientId: string }) {
  const { session } = useAuth()
  const { items, loading, addNote, deleteNote } = useActivities(clientId)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    const body = note.trim()
    if (!body) return
    setBusy(true)
    if (await addNote(body)) setNote('')
    setBusy(false)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-xl border border-line bg-surface focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15">
        <Textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.stopPropagation(); submit() } }}
          placeholder="Log a call, a reply, what you promised them…"
          className="min-h-16 resize-none border-0 bg-transparent shadow-none hover:border-0 focus:ring-0"
        />
        <div className="flex items-center justify-between border-t border-line px-3 py-2">
          <span className="text-xs text-subtle">Ctrl + Enter to post</span>
          <Button type="submit" size="sm" variant="primary" disabled={!note.trim()} loading={busy}>Add note</Button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Loading history…</p>
      ) : items.length ? (
        <ul className="space-y-4">
          {items.map(a => (
            <ActivityItem key={a.id} activity={a}
              onDelete={a.kind === 'note' && a.actor_id === session?.user.id ? deleteNote : undefined} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No activity yet.</p>
      )}
    </div>
  )
}
