# ClientTrack

Outreach pipeline for Hima Tech: track prospects from first audit to won deal, as a team.

**Stack:** Vite · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres, Auth, Realtime) · Lucide icons · dnd-kit

## Features

- **Pipeline board**: drag clients between stages (New → Audited → Contacted → In talks → Won / Lost), with undo
- **Table view**: sortable by stage, priority, owner, follow-up, last update
- **Insights**: totals, reply and win rates, pipeline and channel breakdown, upcoming follow-ups, team activity
- **Client sheet**: details, SWOT analysis, and a full activity history with notes
- **Follow-ups**: set a next-contact date; overdue clients float to the top and get flagged
- **Team**: sign in with password or magic link, assign owners, see who changed what, live updates across everyone's screens
- **Import / export**: import the old `clients.json` (re-running is safe), export to Excel-friendly CSV or a JSON backup
- Light / dark mode, keyboard shortcuts, mobile friendly

Shortcuts: `/` search · `n` new client · `1` `2` `3` switch views · `Ctrl+Enter` save · `Esc` close

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `supabase/migrations/20260927000000_init.sql`.
   (Or with the CLI: `supabase link --project-ref <ref> && supabase db push`.)
3. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up". Only invited people get in.
4. **Authentication → URL Configuration**: set *Site URL* to where the app is hosted (e.g. `https://clients.himatech.co.tz`), and add `http://localhost:5173` to redirect URLs for development.
5. **Authentication → Users → Invite user** for each team member. They get an email link, and can set a password later from their profile menu.

To remove someone's access without deleting their history, run:

```sql
update public.profiles set is_active = false where email = 'person@example.com';
```

### 2. Run the app

```bash
cp .env.example .env       # fill in Project URL + publishable key (Settings → API)
bun install
bun run dev                # http://localhost:5173
```

### 3. Import existing data

Sign in → **Import** → choose `clients.json`. Clients are matched by their old `id`, so importing twice won't create duplicates.

### 4. Deploy

It's a static site: `bun run build` outputs `dist/`. On Netlify / Vercel / Cloudflare Pages, set the build command to `bun run build`, the output to `dist`, and add the two `VITE_SUPABASE_*` env vars.

## Local development against a local Supabase (optional)

```bash
supabase start                      # uses the ports in supabase/config.toml (554xx)
# .env.local → VITE_SUPABASE_URL=http://127.0.0.1:55421 + the local publishable key from `supabase status`
```

## Data model

| Table        | Purpose |
|--------------|---------|
| `profiles`   | One row per team member (auto-created on invite). `is_active` gates all access. |
| `clients`    | The prospects. `status`, `score` (1–5), SWOT fields, `follow_up_on`, `owner_id`. |
| `activities` | Append-only history. Status changes and edits are logged by database triggers; notes are added by users. |

Row Level Security allows only active team members to read or write anything. Nobody can edit another person's notes or reactivate themselves.
