import { STAGE } from './constants'
import type { Client, ClientInput, Profile, Status } from './types'
import { displayName, download, toCSV, todayISO } from './utils'

/** Shape of the old clients.json (v1 app). */
interface LegacyClient {
  id?: string
  name?: string
  handle?: string
  channel?: string
  url?: string
  contact?: string
  status?: string
  weak?: string
  notes?: string
  score?: number
  date?: string
  swot?: { s?: string; w?: string; o?: string; t?: string }
}

type ImportRow = ClientInput & { legacy_id: string | null; created_at?: string }

const VALID: Status[] = ['new', 'audited', 'dm_sent', 'replied', 'closed', 'lost']
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Accepts both the legacy v1 format and this app's own JSON export. */
export function parseImport(text: string): ImportRow[] {
  const data: unknown = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('Expected a JSON array of clients')

  return data
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object' && !!str((r as LegacyClient).name))
    .map(r => {
      const l = r as LegacyClient & Partial<Client>
      const status = VALID.includes(l.status as Status) ? (l.status as Status) : 'new'
      const score = Math.min(5, Math.max(1, Math.round(Number(l.score) || 3)))
      const date = /^\d{4}-\d{2}-\d{2}/.test(str(l.date)) ? str(l.date).slice(0, 10) : null
      return {
        legacy_id: str(l.legacy_id) || str(l.id) || null,
        name: str(l.name),
        handle: str(l.handle),
        channel: str(l.channel),
        url: str(l.url),
        contact: str(l.contact),
        status,
        score,
        weakness: str(l.weakness) || str(l.weak),
        notes: str(l.notes),
        swot_s: str(l.swot_s) || str(l.swot?.s),
        swot_w: str(l.swot_w) || str(l.swot?.w),
        swot_o: str(l.swot_o) || str(l.swot?.o),
        swot_t: str(l.swot_t) || str(l.swot?.t),
        follow_up_on: /^\d{4}-\d{2}-\d{2}$/.test(str(l.follow_up_on)) ? str(l.follow_up_on) : null,
        owner_id: null,
        ...(date ? { created_at: `${date}T12:00:00Z` } : l.created_at ? { created_at: l.created_at } : {}),
      }
    })
}

export function exportJSON(clients: Client[]) {
  download(`clients-${todayISO()}.json`, JSON.stringify(clients, null, 2), 'application/json')
}

export function exportCSV(clients: Client[], profiles: Map<string, Profile>) {
  const rows = clients.map(c => ({
    Name: c.name,
    Stage: STAGE[c.status].label,
    Priority: c.score,
    Channel: c.channel,
    Handle: c.handle,
    Website: c.url,
    Contact: c.contact,
    Owner: c.owner_id ? displayName(profiles.get(c.owner_id)) : '',
    'Follow-up': c.follow_up_on ?? '',
    Weakness: c.weakness,
    Notes: c.notes,
    Strengths: c.swot_s,
    Weaknesses: c.swot_w,
    Opportunities: c.swot_o,
    Threats: c.swot_t,
    Created: c.created_at.slice(0, 10),
    Updated: c.updated_at.slice(0, 10),
  }))
  download(`clients-${todayISO()}.csv`, toCSV(rows), 'text/csv;charset=utf-8')
}
