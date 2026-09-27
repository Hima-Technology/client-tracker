import type { ComponentType } from 'react'
import {
  CircleDashed, ScanSearch, Send, MessagesSquare, Trophy, CircleOff,
  MessageCircle, Mail, Globe, Phone, Users, CircleHelp,
} from 'lucide-react'
import { Instagram, Linkedin, Facebook, XTwitter } from '@/components/ui/brand-icons'
import type { Status } from './types'

export type IconType = ComponentType<{ className?: string; size?: number | string; strokeWidth?: number | string }>
type LucideIcon = IconType

export interface StageDef {
  id: Status
  label: string
  short: string
  icon: LucideIcon
  /** Tailwind classes, spelled out so the compiler keeps them. */
  text: string
  bg: string
  ring: string
  dot: string
  hex: string
}

export const STAGES: StageDef[] = [
  { id: 'new',     label: 'New',      short: 'New',     icon: CircleDashed,   text: 'text-slate-600 dark:text-slate-300',     bg: 'bg-slate-500/10',   ring: 'ring-slate-500/25',   dot: 'bg-slate-400',   hex: '#94a3b8' },
  { id: 'audited', label: 'Audited',  short: 'Audited', icon: ScanSearch,     text: 'text-sky-700 dark:text-sky-300',         bg: 'bg-sky-500/10',     ring: 'ring-sky-500/25',     dot: 'bg-sky-500',     hex: '#0ea5e9' },
  { id: 'dm_sent', label: 'Contacted', short: 'Contacted', icon: Send,        text: 'text-violet-700 dark:text-violet-300',   bg: 'bg-violet-500/10',  ring: 'ring-violet-500/25',  dot: 'bg-violet-500',  hex: '#8b5cf6' },
  { id: 'replied', label: 'In talks', short: 'In talks', icon: MessagesSquare, text: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-500/10',   ring: 'ring-amber-500/25',   dot: 'bg-amber-500',   hex: '#f59e0b' },
  { id: 'closed',  label: 'Won',      short: 'Won',     icon: Trophy,         text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/25', dot: 'bg-emerald-500', hex: '#10b981' },
  { id: 'lost',    label: 'Lost',     short: 'Lost',    icon: CircleOff,      text: 'text-rose-700 dark:text-rose-300',       bg: 'bg-rose-500/10',    ring: 'ring-rose-500/25',    dot: 'bg-rose-500',    hex: '#f43f5e' },
]

export const STAGE: Record<Status, StageDef> = Object.fromEntries(STAGES.map(s => [s.id, s])) as Record<Status, StageDef>

/** Stages that count as "reached out" for conversion stats. */
export const CONTACTED: Status[] = ['dm_sent', 'replied', 'closed', 'lost']

export const CHANNELS: { id: string; icon: LucideIcon }[] = [
  { id: 'Instagram', icon: Instagram },
  { id: 'LinkedIn',  icon: Linkedin },
  { id: 'WhatsApp',  icon: MessageCircle },
  { id: 'Email',     icon: Mail },
  { id: 'Facebook',  icon: Facebook },
  { id: 'Twitter/X', icon: XTwitter },
  { id: 'Website',   icon: Globe },
  { id: 'Phone',     icon: Phone },
  { id: 'Referral',  icon: Users },
]

export const channelIcon = (id: string): LucideIcon =>
  CHANNELS.find(c => c.id === id)?.icon ?? CircleHelp

export const SWOT = [
  { key: 'swot_s', letter: 'S', label: 'Strengths',     hint: 'What do they do well? Strong mission, active community, reputation, funding…',   text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/40' },
  { key: 'swot_w', letter: 'W', label: 'Weaknesses',    hint: 'Weak website copy, no social presence, unclear messaging, poor donor comms…',   text: 'text-rose-700 dark:text-rose-300',       bg: 'bg-rose-500/8',     border: 'border-rose-500/40' },
  { key: 'swot_o', letter: 'O', label: 'Opportunities', hint: 'Where we can help: redesign, content calendar, campaign copy, funnels…',        text: 'text-sky-700 dark:text-sky-300',         bg: 'bg-sky-500/8',      border: 'border-sky-500/40' },
  { key: 'swot_t', letter: 'T', label: 'Threats',       hint: 'Budget limits, in-house team, competing freelancers, slow decisions…',          text: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-500/8',    border: 'border-amber-500/40' },
] as const
