import { useEffect, useMemo, useRef, useState } from 'react'
import { Toaster } from 'sonner'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { DataProvider, useData } from '@/hooks/useData'
import { useTheme } from '@/hooks/useTheme'
import { isConfigured } from '@/lib/supabase'
import type { Client, View } from '@/lib/types'
import { followUpState } from '@/lib/utils'
import { AuthScreen, SetupScreen } from '@/components/AuthScreen'
import { Header } from '@/components/Header'
import { Toolbar, type Filters } from '@/components/Toolbar'
import { Board } from '@/components/Board'
import { TableView } from '@/components/TableView'
import { Dashboard } from '@/components/Dashboard'
import { ClientSheet } from '@/components/ClientSheet'
import { Button, EmptyState, hasOpenOverlay } from '@/components/ui'

export default function App() {
  const { dark } = useTheme()
  return (
    <>
      {isConfigured ? (
        <AuthProvider>
          <Gate />
        </AuthProvider>
      ) : <SetupScreen />}
      <Toaster position="bottom-right" theme={dark ? 'dark' : 'light'} richColors closeButton
        toastOptions={{ className: '!font-sans !rounded-xl' }} />
    </>
  )
}

function Gate() {
  const { session, loading } = useAuth()
  if (loading) return <FullscreenSpinner />
  if (!session) return <AuthScreen />
  return (
    <DataProvider userId={session.user.id}>
      <Workspace userId={session.user.id} />
    </DataProvider>
  )
}

function FullscreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted">
      <Loader2 className="size-5 animate-spin" />
    </div>
  )
}

const readView = (): View => {
  try {
    const v = localStorage.getItem('ct-view')
    return v === 'table' || v === 'dashboard' ? v : 'board'
  } catch { return 'board' }
}

/** Open sheet: an existing client's id, or 'new'. */
type SheetTarget = { id: string } | { new: true } | null

function Workspace({ userId }: { userId: string }) {
  const { clients, loading, error, reload } = useData()
  const [view, setView] = useState<View>(readView)
  const [filters, setFilters] = useState<Filters>({ q: '', owner: 'all', channel: '', dueOnly: false })
  const [sheet, setSheet] = useState<SheetTarget>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { localStorage.setItem('ct-view', view) } catch { /* private mode */ }
  }, [view])

  // Keyboard shortcuts: "/" search, "n" new client, 1/2/3 switch views.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || hasOpenOverlay()) return
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      else if (e.key === 'n') { e.preventDefault(); setSheet({ new: true }) }
      else if (e.key === '1') setView('board')
      else if (e.key === '2') setView('table')
      else if (e.key === '3') setView('dashboard')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return clients.filter(c => {
      if (filters.owner === 'mine' && c.owner_id !== userId) return false
      if (filters.owner === 'unassigned' && c.owner_id) return false
      if (filters.channel && c.channel !== filters.channel) return false
      if (filters.dueOnly) {
        const f = followUpState(c)
        if (f !== 'overdue' && f !== 'today') return false
      }
      if (!q) return true
      return [c.name, c.handle, c.contact, c.url, c.notes, c.weakness, c.swot_s, c.swot_w, c.swot_o, c.swot_t]
        .some(v => v.toLowerCase().includes(q))
    })
  }, [clients, filters, userId])

  const openClient = (c: Client) => setSheet({ id: c.id })
  const sheetClient = sheet && 'id' in sheet ? clients.find(c => c.id === sheet.id) ?? null : null

  // Close the sheet if its client was deleted (locally or by a teammate).
  useEffect(() => {
    if (sheet && 'id' in sheet && !loading && !sheetClient) setSheet(null)
  }, [sheet, sheetClient, loading])

  return (
    <div className="flex h-dvh flex-col">
      <Header view={view} onView={setView} />
      {view !== 'dashboard' && (
        <Toolbar filters={filters} onFilters={setFilters} searchRef={searchRef}
          count={filtered.length} total={clients.length} onNew={() => setSheet({ new: true })} />
      )}
      <main className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto">
        {loading ? (
          <FullscreenSpinner />
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load clients" className="flex-1">
            <p className="mb-3">{error}</p>
            <Button onClick={reload}>Try again</Button>
          </EmptyState>
        ) : view === 'board' ? (
          <Board clients={filtered} onOpen={openClient} onNew={() => setSheet({ new: true })} isEmpty={!clients.length} />
        ) : view === 'table' ? (
          <TableView clients={filtered} onOpen={openClient} />
        ) : (
          <Dashboard onOpen={openClient} onOpenId={id => setSheet({ id })} />
        )}
      </main>

      <ClientSheet
        key={sheet ? ('id' in sheet ? sheet.id : 'new') : 'closed'}
        open={!!sheet && (!('id' in sheet) || !!sheetClient)}
        client={sheetClient}
        onClose={() => setSheet(null)}
        onCreated={c => setSheet({ id: c.id })}
      />
    </div>
  )
}
