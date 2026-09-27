import { useState } from 'react'
import { ChartColumn, LogOut, Moon, SquareKanban, Sun, Table2, UserRoundCog } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { useTheme } from '@/hooks/useTheme'
import type { View } from '@/lib/types'
import { cn, displayName } from '@/lib/utils'
import { Avatar, Button } from './ui'
import { Menu, MenuItem } from './ui/Menu'
import { Logo } from './Logo'
import { ProfileDialog } from './ProfileDialog'

const VIEWS: { id: View; label: string; icon: typeof Table2; key: string }[] = [
  { id: 'board', label: 'Pipeline', icon: SquareKanban, key: '1' },
  { id: 'table', label: 'Table', icon: Table2, key: '2' },
  { id: 'dashboard', label: 'Insights', icon: ChartColumn, key: '3' },
]

export function Header({ view, onView }: { view: View; onView: (v: View) => void }) {
  const { session, signOut } = useAuth()
  const { profiles } = useData()
  const { dark, toggle } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const me = session ? profiles.get(session.user.id) : undefined

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-semibold tracking-tight">ClientTrack</div>
            <div className="text-[11px] text-muted">Hima Tech · Zanzibar</div>
          </div>
        </div>

        <nav aria-label="Views" className="mx-auto flex items-center gap-0.5 rounded-xl border border-line bg-surface-2 p-0.5 sm:ml-6 sm:mr-0">
          {VIEWS.map(v => {
            const active = v.id === view
            return (
              <button key={v.id} type="button" onClick={() => onView(v.id)} aria-current={active ? 'page' : undefined}
                title={`${v.label} (${v.key})`}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium transition-all',
                  active ? 'bg-surface text-fg shadow-card ring-1 ring-line' : 'text-muted hover:text-fg',
                )}>
                <v.icon className="size-4" />
                <span className="hidden md:inline">{v.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-1 sm:ml-auto">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Menu trigger={({ toggle: t, open }) => (
            <button type="button" onClick={t} aria-expanded={open} aria-label="Account menu"
              className="flex items-center rounded-full p-0.5 transition hover:ring-2 hover:ring-line">
              <Avatar profile={me} size="md" className="ring-0" />
            </button>
          )}>
            {close => (
              <>
                <div className="border-b border-line px-2.5 pt-1.5 pb-2.5 mb-1">
                  <p className="truncate text-sm font-medium">{displayName(me)}</p>
                  <p className="truncate text-xs text-muted">{session?.user.email}</p>
                </div>
                <MenuItem icon={UserRoundCog} onClick={() => { close(); setProfileOpen(true) }}>Profile & password</MenuItem>
                <MenuItem icon={LogOut} danger onClick={() => { close(); signOut() }}>Sign out</MenuItem>
              </>
            )}
          </Menu>
        </div>
      </div>
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  )
}
