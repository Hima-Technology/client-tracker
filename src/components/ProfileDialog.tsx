import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { supabase } from '@/lib/supabase'
import { Button, Dialog, Field, Input } from './ui'

export function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session } = useAuth()
  const { profiles, reload } = useData()
  const me = session ? profiles.get(session.user.id) : undefined
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) { setName(me?.full_name ?? ''); setPassword('') }
  }, [open, me?.full_name])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    setBusy(true)
    let ok = true
    if (name.trim() !== (me?.full_name ?? '')) {
      const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', session.user.id)
      if (error) { ok = false; toast.error('Could not update name', { description: error.message }) }
    }
    if (password) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { ok = false; toast.error('Could not set password', { description: error.message }) }
    }
    setBusy(false)
    if (ok) {
      toast.success('Profile saved')
      await reload()
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Your profile" description={session?.user.email}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Display name" htmlFor="p-name">
          <Input id="p-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lion" autoFocus />
        </Field>
        <Field label="New password" htmlFor="p-pass" hint="Optional. Set one to sign in without a magic link.">
          <Input id="p-pass" type="password" minLength={8} autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </Field>
        <div className="mt-1 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>Save</Button>
        </div>
      </form>
    </Dialog>
  )
}
