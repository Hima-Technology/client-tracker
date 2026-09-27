import { useMemo, useState, type RefObject } from 'react'
import { AlarmClock, ChevronDown, Download, FileJson, FileSpreadsheet, Plus, Search, Upload, X } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { CHANNELS } from '@/lib/constants'
import { exportCSV, exportJSON } from '@/lib/importExport'
import { cn, followUpState } from '@/lib/utils'
import { Button, Kbd, Select } from './ui'
import { Menu, MenuItem } from './ui/Menu'
import { ImportDialog } from './ImportDialog'

export interface Filters {
  q: string
  owner: 'all' | 'mine' | 'unassigned'
  channel: string
  dueOnly: boolean
}

export function Toolbar({ filters, onFilters, searchRef, count, total, onNew }: {
  filters: Filters
  onFilters: (f: Filters) => void
  searchRef: RefObject<HTMLInputElement | null>
  count: number
  total: number
  onNew: () => void
}) {
  const { clients, profiles } = useData()
  const [importOpen, setImportOpen] = useState(false)
  const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch })
  const dueCount = useMemo(
    () => clients.filter(c => { const f = followUpState(c); return f === 'overdue' || f === 'today' }).length,
    [clients],
  )
  const filtering = filters.q || filters.owner !== 'all' || filters.channel || filters.dueOnly

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 sm:px-6">
      <div className="relative min-w-52 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <input
          ref={searchRef}
          type="search"
          value={filters.q}
          onChange={e => set({ q: e.target.value })}
          onKeyDown={e => { if (e.key === 'Escape') { set({ q: '' }); e.currentTarget.blur() } }}
          placeholder="Search clients, notes, SWOT…"
          aria-label="Search clients"
          className="h-9 w-full rounded-lg border border-line bg-surface pr-9 pl-9 text-sm shadow-card placeholder:text-subtle hover:border-line-strong focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2">
          {filters.q ? null : <Kbd>/</Kbd>}
        </span>
        {filters.q && (
          <button type="button" onClick={() => set({ q: '' })} aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-fg">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5 shadow-card" role="group" aria-label="Owner filter">
        {(['all', 'mine', 'unassigned'] as const).map(o => (
          <button key={o} type="button" onClick={() => set({ owner: o })} aria-pressed={filters.owner === o}
            className={cn('h-7 rounded-md px-2.5 text-xs font-medium capitalize transition-colors',
              filters.owner === o ? 'bg-accent-soft text-accent' : 'text-muted hover:text-fg')}>
            {o === 'all' ? 'Everyone' : o}
          </button>
        ))}
      </div>

      <Select value={filters.channel} onChange={e => set({ channel: e.target.value })} aria-label="Channel filter"
        className="h-9 w-auto min-w-36 shadow-card">
        <option value="">All channels</option>
        {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
      </Select>

      <button type="button" onClick={() => set({ dueOnly: !filters.dueOnly })} aria-pressed={filters.dueOnly}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-card transition-colors',
          filters.dueOnly
            ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
            : 'border-line bg-surface text-muted hover:text-fg hover:border-line-strong',
        )}>
        <AlarmClock className="size-3.5" />
        Due follow-ups
        {dueCount > 0 && (
          <span className="rounded-full bg-rose-500 px-1.5 text-[10px] leading-4 font-semibold text-white">{dueCount}</span>
        )}
      </button>

      {filtering && (
        <span className="text-xs text-muted">
          {count} of {total}
          <button type="button" className="ml-2 font-medium text-accent hover:underline"
            onClick={() => onFilters({ q: '', owner: 'all', channel: '', dueOnly: false })}>
            Reset
          </button>
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button onClick={() => setImportOpen(true)} className="shadow-card" title="Import from JSON">
          <Upload className="size-4" /><span className="hidden lg:inline">Import</span>
        </Button>
        <Menu trigger={({ toggle, open }) => (
          <Button onClick={toggle} aria-expanded={open} title="Export">
            <Download className="size-4" /><span className="hidden lg:inline">Export</span>
            <ChevronDown className="size-3.5 text-subtle" />
          </Button>
        )}>
          {close => (
            <>
              <MenuItem icon={FileSpreadsheet} onClick={() => { exportCSV(clients, profiles); close() }}>Excel / CSV</MenuItem>
              <MenuItem icon={FileJson} onClick={() => { exportJSON(clients); close() }}>JSON backup</MenuItem>
            </>
          )}
        </Menu>
        <Button variant="primary" onClick={onNew} title="Add client (N)">
          <Plus className="size-4" strokeWidth={2.5} /> Add client
        </Button>
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
