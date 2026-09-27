export type Status = 'new' | 'audited' | 'dm_sent' | 'replied' | 'closed' | 'lost'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  is_active: boolean
}

export interface Client {
  id: string
  legacy_id: string | null
  name: string
  handle: string
  channel: string
  url: string
  contact: string
  status: Status
  score: number
  weakness: string
  notes: string
  swot_s: string
  swot_w: string
  swot_o: string
  swot_t: string
  follow_up_on: string | null
  owner_id: string | null
  created_by: string | null
  updated_by: string | null
  status_changed_at: string
  created_at: string
  updated_at: string
}

/** Fields the user edits directly. */
export type ClientInput = Pick<
  Client,
  | 'name' | 'handle' | 'channel' | 'url' | 'contact' | 'status' | 'score'
  | 'weakness' | 'notes' | 'swot_s' | 'swot_w' | 'swot_o' | 'swot_t'
  | 'follow_up_on' | 'owner_id'
>

export type ActivityKind = 'created' | 'status' | 'updated' | 'note'

export interface Activity {
  id: string
  client_id: string
  actor_id: string | null
  kind: ActivityKind
  body: string
  from_status: Status | null
  to_status: Status | null
  created_at: string
}

export type View = 'board' | 'table' | 'dashboard'
