import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/lib/types'

/** Activity feed for one client, or the latest team-wide activity when clientId is omitted. */
export function useActivities(clientId?: string, limit = 50) {
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    let q = supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(limit)
    if (clientId) q = q.eq('client_id', clientId)
    q.then(({ data }) => {
      if (!alive) return
      setItems((data as Activity[]) ?? [])
      setLoading(false)
    })

    const channel = supabase
      .channel(`activities-${clientId ?? 'all'}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          ...(clientId ? { filter: `client_id=eq.${clientId}` } : {}),
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            const a = payload.new as Activity
            setItems(list => (list.some(x => x.id === a.id) ? list : [a, ...list].slice(0, limit)))
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id?: string }).id
            setItems(list => list.filter(x => x.id !== id))
          }
        },
      )
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [clientId, limit])

  const addNote = useCallback(async (body: string) => {
    if (!clientId) return false
    const { data, error } = await supabase
      .from('activities')
      .insert({ client_id: clientId, kind: 'note', body })
      .select()
      .single()
    if (error) {
      toast.error('Could not add note', { description: error.message })
      return false
    }
    setItems(list => (list.some(x => x.id === data.id) ? list : [data as Activity, ...list]))
    return true
  }, [clientId])

  const deleteNote = useCallback(async (id: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) toast.error('Could not delete note', { description: error.message })
    else setItems(list => list.filter(x => x.id !== id))
  }, [])

  return { items, loading, addNote, deleteNote }
}
