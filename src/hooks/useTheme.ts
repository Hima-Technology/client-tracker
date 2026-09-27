import { useSyncExternalStore } from 'react'

// The initial class is set by the inline script in index.html (no flash on load).
const listeners = new Set<() => void>()
const isDark = () => document.documentElement.classList.contains('dark')

function toggle() {
  const next = !isDark()
  document.documentElement.classList.toggle('dark', next)
  try { localStorage.setItem('ct-theme', next ? 'dark' : 'light') } catch { /* private mode */ }
  listeners.forEach(l => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, isDark)
  return { dark, toggle }
}
