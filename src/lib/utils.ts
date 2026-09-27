import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import type { Client, Profile } from './types'

// Teach tailwind-merge our custom colors so e.g. `text-muted` and `text-sm` don't collide.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: ['bg', 'surface', 'surface-2', 'line', 'line-strong', 'fg', 'muted', 'subtle', 'accent', 'accent-hover', 'accent-soft'],
    },
  },
})

export const cn = (...v: ClassValue[]) => twMerge(clsx(v))

/** Local YYYY-MM-DD (not UTC, so "today" matches the user's calendar). */
export function todayISO(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type FollowUpState = 'overdue' | 'today' | 'soon' | 'later' | null

export function followUpState(c: Pick<Client, 'follow_up_on' | 'status'>): FollowUpState {
  if (!c.follow_up_on || c.status === 'closed' || c.status === 'lost') return null
  const today = todayISO()
  if (c.follow_up_on < today) return 'overdue'
  if (c.follow_up_on === today) return 'today'
  if (c.follow_up_on <= todayISO(3)) return 'soon'
  return 'later'
}

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const dateFmtYear = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso)
  return (d.getFullYear() === new Date().getFullYear() ? dateFmt : dateFmtYear).format(d)
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function timeAgo(iso: string): string {
  const s = (new Date(iso).getTime() - Date.now()) / 1000
  const abs = Math.abs(s)
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day')
  return formatDate(iso)
}

export function followUpLabel(iso: string): string {
  const today = todayISO()
  if (iso === today) return 'Today'
  if (iso === todayISO(1)) return 'Tomorrow'
  if (iso === todayISO(-1)) return 'Yesterday'
  return formatDate(iso)
}

export function displayName(p: Profile | undefined | null): string {
  return p?.full_name || p?.email?.split('@')[0] || 'Someone'
}

export function initials(p: Profile | undefined | null): string {
  const n = displayName(p).trim()
  const parts = n.split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function normalizeUrl(u: string): string {
  const t = u.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

export function prettyUrl(u: string): string {
  return u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM so Excel opens UTF-8 correctly
  return '﻿' + [headers.join(','), ...rows.map(r => headers.map(h => cell(r[h])).join(','))].join('\r\n')
}
