import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ExternalLink, History, Info, Sparkles, Trash2, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { CHANNELS, STAGES, SWOT } from '@/lib/constants'
import type { Client, ClientInput } from '@/lib/types'
import { cn, displayName, formatDate, normalizeUrl, prettyUrl, timeAgo, todayISO } from '@/lib/utils'
import { ActivityFeed } from './ActivityFeed'
import { Button, ConfirmDialog, Field, Input, Select, Sheet, StageBadge, Stars, Textarea } from './ui'

type Tab = 'details' | 'swot' | 'activity'

const EMPTY: ClientInput = {
  name: '', handle: '', channel: '', url: '', contact: '', status: 'new', score: 3,
  weakness: '', notes: '', swot_s: '', swot_w: '', swot_o: '', swot_t: '', follow_up_on: null, owner_id: null,
}

const toInput = (c: Client): ClientInput => ({
  name: c.name, handle: c.handle, channel: c.channel, url: c.url, contact: c.contact, status: c.status,
  score: c.score, weakness: c.weakness, notes: c.notes, swot_s: c.swot_s, swot_w: c.swot_w,
  swot_o: c.swot_o, swot_t: c.swot_t, follow_up_on: c.follow_up_on, owner_id: c.owner_id,
})

const clean = (f: ClientInput): ClientInput => ({
  ...f,
  name: f.name.trim(), handle: f.handle.trim(), contact: f.contact.trim(), url: normalizeUrl(f.url),
  weakness: f.weakness.trim(), notes: f.notes.trim(),
  swot_s: f.swot_s.trim(), swot_w: f.swot_w.trim(), swot_o: f.swot_o.trim(), swot_t: f.swot_t.trim(),
})

const FOLLOW_UPS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
]

export function ClientSheet({ open, client, onClose, onCreated }: {
  open: boolean
  client: Client | null
  onClose: () => void
  onCreated: (c: Client) => void
}) {
  const { session } = useAuth()
  const { profiles, create, update, remove } = useData()
  const isNew = !client
  const initial = useMemo(
    () => (client ? toInput(client) : { ...EMPTY, owner_id: session?.user.id ?? null }),
    // Re-derive only when the server copy changes.
    [client?.id, client?.updated_at],
  )
  const [form, setForm] = useState<ClientInput>(initial)
  const [tab, setTab] = useState<Tab>('details')
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<'delete' | 'discard' | null>(null)
  const [nameError, setNameError] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const dirty = JSON.stringify(clean(form)) !== JSON.stringify(clean(initial))
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  // A teammate saved this client while we had it open: pick up their changes if we have none of our own.
  useEffect(() => {
    if (!dirtyRef.current) setForm(initial)
  }, [initial])

  useEffect(() => {
    if (open && isNew) setTimeout(() => nameRef.current?.focus(), 50)
  }, [open, isNew])

  const set = <K extends keyof ClientInput>(k: K, v: ClientInput[K]) => {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'name') setNameError(false)
  }

  const requestClose = () => (dirty ? setConfirm('discard') : onClose())

  async function save(e?: FormEvent) {
    e?.preventDefault()
    const data = clean(form)
    if (!data.name) {
      setTab('details')
      setNameError(true)
      setTimeout(() => nameRef.current?.focus(), 0)
      return
    }
    setSaving(true)
    if (isNew) {
      const created = await create(data)
      setSaving(false)
      if (created) onCreated(created)
    } else {
      const ok = await update(client.id, data)
      setSaving(false)
      if (ok) onClose()
    }
  }

  const swotCount = SWOT.filter(s => form[s.key].trim()).length
  const tabs: { id: Tab; label: string; icon: typeof Info; badge?: string }[] = [
    { id: 'details', label: 'Details', icon: Info },
    { id: 'swot', label: 'SWOT', icon: Sparkles, badge: `${swotCount}/4` },
    ...(!isNew ? [{ id: 'activity' as const, label: 'Activity', icon: History }] : []),
  ]

  return (
    <Sheet open={open} onClose={requestClose} label={isNew ? 'New client' : client.name}>
      {/* Header */}
      <div className="border-b border-line px-5 pt-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <StageBadge status={form.status} />
              {!isNew && (
                <span className="truncate text-xs text-subtle">
                  Added {formatDate(client.created_at)}
                  {client.created_by && ` by ${displayName(profiles.get(client.created_by))}`} · updated {timeAgo(client.updated_at)}
                </span>
              )}
            </div>
            <h2 className="truncate text-lg font-semibold tracking-tight">{form.name.trim() || (isNew ? 'New client' : client.name)}</h2>
          </div>
          <div className="flex items-center gap-1">
            {!isNew && client.url && (
              <Button variant="ghost" size="icon" onClick={() => window.open(normalizeUrl(client.url), '_blank', 'noopener')} aria-label="Open website" title={prettyUrl(client.url)}>
                <ExternalLink className="size-4" />
              </Button>
            )}
            {!isNew && (
              <Button variant="ghost" size="icon" onClick={() => setConfirm('delete')} aria-label="Delete client"
                className="hover:bg-rose-500/10 hover:text-rose-600">
                <Trash2 className="size-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={requestClose} aria-label="Close"><X className="size-4" /></Button>
          </div>
        </div>

        <div role="tablist" className="mt-3 -mb-px flex gap-1">
          {tabs.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 pt-1.5 pb-2.5 text-sm font-medium transition-colors',
                tab === t.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
              )}>
              <t.icon className="size-4" />
              {t.label}
              {t.badge && <span className="rounded bg-surface-2 px-1 font-mono text-[10px] text-muted">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {tab === 'activity' && client ? (
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <ActivityFeed clientId={client.id} />
        </div>
      ) : (
        <form onSubmit={save} className="flex min-h-0 flex-1 flex-col"
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save() } }}>
          <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {tab === 'details' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Organisation name *" htmlFor="f-name" className="sm:col-span-2"
                  hint={nameError ? <span className="text-rose-600 dark:text-rose-400">A name is required</span> : undefined}>
                  <Input id="f-name" ref={nameRef} value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Promoting Women in Tourism" aria-invalid={nameError}
                    className={cn(nameError && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15')} />
                </Field>

                <Field label="Stage" htmlFor="f-status">
                  <Select id="f-status" value={form.status} onChange={e => set('status', e.target.value as ClientInput['status'])}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </Select>
                </Field>
                <Field label="Priority">
                  <div className="flex h-9 items-center"><Stars value={form.score} onChange={v => set('score', v)} size={20} /></div>
                </Field>

                <Field label="Channel" htmlFor="f-channel">
                  <Select id="f-channel" value={form.channel} onChange={e => set('channel', e.target.value)}>
                    <option value="">Select…</option>
                    {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                    {form.channel && !CHANNELS.some(c => c.id === form.channel) && <option value={form.channel}>{form.channel}</option>}
                  </Select>
                </Field>
                <Field label="Handle / social" htmlFor="f-handle">
                  <Input id="f-handle" value={form.handle} onChange={e => set('handle', e.target.value)} placeholder="@handle" />
                </Field>

                <Field label="Website" htmlFor="f-url">
                  <Input id="f-url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="example.org" inputMode="url" />
                </Field>
                <Field label="Contact person / email" htmlFor="f-contact">
                  <Input id="f-contact" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Name, role or email" />
                </Field>

                <Field label="Owner" htmlFor="f-owner">
                  <Select id="f-owner" value={form.owner_id ?? ''} onChange={e => set('owner_id', e.target.value || null)}>
                    <option value="">Unassigned</option>
                    {[...profiles.values()].filter(p => p.is_active || p.id === form.owner_id).map(p => (
                      <option key={p.id} value={p.id}>{displayName(p)}{p.id === session?.user.id ? ' (you)' : ''}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Next follow-up" htmlFor="f-follow">
                  <Input id="f-follow" type="date" value={form.follow_up_on ?? ''} onChange={e => set('follow_up_on', e.target.value || null)} />
                </Field>
                <div className="-mt-2 flex flex-wrap gap-1.5 sm:col-span-2 sm:justify-end">
                  {FOLLOW_UPS.map(f => {
                    const d = todayISO(f.days)
                    return (
                      <button key={f.days} type="button" onClick={() => set('follow_up_on', d)}
                        className={cn('rounded-md border px-2 py-1 text-xs transition-colors',
                          form.follow_up_on === d ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:border-line-strong hover:text-fg')}>
                        {f.label}
                      </button>
                    )
                  })}
                  {form.follow_up_on && (
                    <button type="button" onClick={() => set('follow_up_on', null)}
                      className="rounded-md px-2 py-1 text-xs text-muted hover:text-rose-600">Clear</button>
                  )}
                </div>

                <Field label="Weakness spotted" htmlFor="f-weak" className="sm:col-span-2">
                  <Textarea id="f-weak" value={form.weakness} onChange={e => set('weakness', e.target.value)}
                    placeholder="Vague About section, no link-in-bio, outdated website…" />
                </Field>
                <Field label="Notes / next step" htmlFor="f-notes" className="sm:col-span-2">
                  <Textarea id="f-notes" value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="What to offer, who to talk to, extra context…" />
                </Field>
              </div>
            ) : (
              <>
                <p className="mb-4 rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-sm text-muted">
                  Map their situation to shape the pitch: what they do well, where they struggle, and where <em>we</em> can help.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SWOT.map(s => (
                    <div key={s.key} className={cn('rounded-xl border-l-[3px] border border-line p-3', s.bg, s.border)}>
                      <label htmlFor={`f-${s.key}`} className={cn('mb-2 flex items-center gap-2 text-sm font-semibold', s.text)}>
                        <span className={cn('flex size-5 items-center justify-center rounded font-mono text-[11px] ring-1 ring-current/30')}>{s.letter}</span>
                        {s.label}
                      </label>
                      <Textarea id={`f-${s.key}`} value={form[s.key]} onChange={e => set(s.key, e.target.value)}
                        placeholder={s.hint} className="min-h-32 bg-surface/80 text-[13px]" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-line bg-surface px-5 py-3 sm:px-6">
            <span className="hidden text-xs text-subtle sm:block">
              {dirty ? 'Unsaved changes · Ctrl + Enter to save' : isNew ? '' : 'All changes saved'}
            </span>
            <div className="ml-auto flex gap-2">
              <Button onClick={requestClose}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving} disabled={!isNew && !dirty}>
                {isNew ? 'Add client' : 'Save changes'}
              </Button>
            </div>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (client) { remove(client.id); onClose() } }}
        title={`Delete ${client?.name ?? 'client'}?`}
        description="This removes the client and its whole activity history for the entire team. This can't be undone."
      />
      <ConfirmDialog
        open={confirm === 'discard'}
        onClose={() => setConfirm(null)}
        onConfirm={onClose}
        title="Discard unsaved changes?"
        description="Your edits to this client will be lost."
        confirmLabel="Discard"
      />
    </Sheet>
  )
}
