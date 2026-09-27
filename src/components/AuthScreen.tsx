import { useState, type FormEvent } from 'react'
import { ArrowLeft, KeyRound, MailCheck, Wand2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Field, Input } from './ui'
import { Logo } from './Logo'

type Mode = 'password' | 'magic' | 'sent'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message)
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        // Only invited team members can sign in; never create accounts from this screen.
        options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
      })
      if (error) setError(error.message.includes('Signups not allowed') ? 'This email is not on the team. Ask an admin to invite you.' : error.message)
      else setMode('sent')
    }
    setBusy(false)
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative w-full max-w-sm animate-pop-in">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="size-11 rounded-xl" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">ClientTrack</h1>
            <p className="text-sm text-muted">Hima Tech · Zanzibar</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-pop">
          {mode === 'sent' ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <MailCheck className="size-5" />
              </div>
              <p className="font-medium">Check your inbox</p>
              <p className="text-sm text-muted">We sent a sign-in link to <span className="font-medium text-fg">{email}</span>.</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setMode('magic')}>
                <ArrowLeft className="size-3.5" /> Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Field label="Work email" htmlFor="email">
                <Input id="email" type="email" required autoComplete="email" autoFocus
                  value={email} onChange={e => setEmail(e.target.value)} placeholder="you@himatech.co.tz" />
              </Field>
              {mode === 'password' && (
                <Field label="Password" htmlFor="password">
                  <Input id="password" type="password" required autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)} />
                </Field>
              )}
              {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
              <Button type="submit" variant="primary" loading={busy} className="w-full">
                {mode === 'password' ? <><KeyRound className="size-4" /> Sign in</> : <><Wand2 className="size-4" /> Email me a sign-in link</>}
              </Button>
              <button type="button" onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError(null) }}
                className="text-center text-xs text-muted hover:text-fg">
                {mode === 'password' ? 'No password? Get a magic link instead' : 'Sign in with password'}
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-subtle">Team access only. Ask an admin for an invite.</p>
      </div>
    </div>
  )
}

export function SetupScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <div className="mb-4 flex items-center gap-3">
          <Logo />
          <h1 className="text-lg font-semibold">Connect Supabase</h1>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Run <code className="font-mono text-fg">supabase/migrations/…_init.sql</code> in your project's SQL editor.</li>
          <li>Copy <code className="font-mono text-fg">.env.example</code> to <code className="font-mono text-fg">.env</code> and fill in the project URL and publishable key.</li>
          <li>Restart <code className="font-mono text-fg">bun run dev</code>.</li>
        </ol>
      </div>
    </div>
  )
}
