import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { STAGE } from '@/lib/constants'
import type { Client, ClientInput, Profile, Status } from '@/lib/types'
import type { parseImport } from '@/lib/importExport'

interface DataState {
  clients: Client[]
  profiles: Map<string, Profile>
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  create: (input: ClientInput) => Promise<Client | null>
  update: (id: string, patch: Partial<ClientInput>) => Promise<boolean>
  move: (id: string, status: Status) => Promise<void>
  remove: (id: string) => Promise<void>
  importRows: (rows: ReturnType<typeof parseImport>) => Promise<number>
}

const DataContext = createContext<DataState | null>(null)

const upsertLocal = (list: Client[], c: Client) => {
  const i = list.findIndex(x => x.id === c.id)
  if (i === -1) return [...list, c]
  const next = list.slice()
  next[i] = c
  return next
}

export function DataProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const clientsRef = useRef(clients)
  clientsRef.current = clients

  const reload = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, email, full_name, is_active'),
    ])
    if (c.error || p.error) {
      setError((c.error ?? p.error)!.message)
    } else {
      setError(null)
      setClients(c.data as Client[])
      setProfiles(new Map((p.data as Profile[]).map(x => [x.id, x])))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
    const channel = supabase
      .channel('clients-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, payload => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id?: string }).id
          setClients(list => list.filter(c => c.id !== id))
        } else {
          setClients(list => upsertLocal(list, payload.new as Client))
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [reload, userId])

  const create = useCallback(async (input: ClientInput) => {
    const { data, error } = await supabase.from('clients').insert(input).select().single()
    if (error) {
      toast.error('Could not add client', { description: error.message })
      return null
    }
    setClients(list => upsertLocal(list, data as Client))
    toast.success(`${input.name} added`)
    return data as Client
  }, [])

  const update = useCallback(async (id: string, patch: Partial<ClientInput>) => {
    const prev = clientsRef.current.find(c => c.id === id)
    if (!prev) return false
    setClients(list => upsertLocal(list, { ...prev, ...patch }))
    const { data, error } = await supabase.from('clients').update(patch).eq('id', id).select().single()
    if (error) {
      setClients(list => upsertLocal(list, prev))
      toast.error('Could not save changes', { description: error.message })
      return false
    }
    setClients(list => upsertLocal(list, data as Client))
    return true
  }, [])

  const move = useCallback(async (id: string, status: Status) => {
    const prev = clientsRef.current.find(c => c.id === id)
    if (!prev || prev.status === status) return
    const ok = await update(id, { status })
    if (ok) {
      toast(`Moved to ${STAGE[status].label}`, {
        description: prev.name,
        action: { label: 'Undo', onClick: () => update(id, { status: prev.status }) },
      })
    }
  }, [update])

  const remove = useCallback(async (id: string) => {
    const prev = clientsRef.current.find(c => c.id === id)
    if (!prev) return
    setClients(list => list.filter(c => c.id !== id))
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) {
      setClients(list => upsertLocal(list, prev))
      toast.error('Could not delete client', { description: error.message })
    } else {
      toast(`${prev.name} deleted`)
    }
  }, [])

  const importRows = useCallback(async (rows: ReturnType<typeof parseImport>) => {
    // Rows with a legacy_id are skipped if already imported, so re-importing is safe.
    const withId = rows.filter(r => r.legacy_id)
    const withoutId = rows.filter(r => !r.legacy_id)
    let count = 0
    if (withId.length) {
      const { data, error } = await supabase
        .from('clients')
        .upsert(withId, { onConflict: 'legacy_id', ignoreDuplicates: true })
        .select('id')
      if (error) throw error
      count += data?.length ?? 0
    }
    if (withoutId.length) {
      const { data, error } = await supabase.from('clients').insert(withoutId).select('id')
      if (error) throw error
      count += data?.length ?? 0
    }
    await reload()
    return count
  }, [reload])

  const value = useMemo(
    () => ({ clients, profiles, loading, error, reload, create, update, move, remove, importRows }),
    [clients, profiles, loading, error, reload, create, update, move, remove, importRows],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
