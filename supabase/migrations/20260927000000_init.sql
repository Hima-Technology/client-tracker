-- ClientTrack schema: team profiles, clients pipeline, activity log.
-- Run in Supabase → SQL Editor (or `supabase db push`).

-- ── Types ─────────────────────────────────────────────
create type public.client_status as enum ('new', 'audited', 'dm_sent', 'replied', 'closed', 'lost');

-- ── Profiles (one per auth user) ──────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger-only; must not be callable via /rest/v1/rpc.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users that existed before this migration
insert into public.profiles (id, email, full_name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- Active team member check, used by every policy.
-- Set profiles.is_active = false to revoke someone's access without deleting them.
create function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_active
  );
$$;

revoke execute on function public.is_team_member() from anon, public;
grant execute on function public.is_team_member() to authenticated;

-- ── Clients ───────────────────────────────────────────
create table public.clients (
  id                uuid primary key default gen_random_uuid(),
  legacy_id         text unique,
  name              text not null check (length(trim(name)) > 0),
  handle            text not null default '',
  channel           text not null default '',
  url               text not null default '',
  contact           text not null default '',
  status            public.client_status not null default 'new',
  score             smallint not null default 3 check (score between 1 and 5),
  weakness          text not null default '',
  notes             text not null default '',
  swot_s            text not null default '',
  swot_w            text not null default '',
  swot_o            text not null default '',
  swot_t            text not null default '',
  follow_up_on      date,
  owner_id          uuid references public.profiles (id) on delete set null,
  created_by        uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_by        uuid references public.profiles (id) on delete set null default auth.uid(),
  status_changed_at timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index clients_status_idx       on public.clients (status);
create index clients_owner_idx        on public.clients (owner_id);
create index clients_follow_up_idx    on public.clients (follow_up_on) where follow_up_on is not null;
create index clients_created_by_idx   on public.clients (created_by);
create index clients_updated_by_idx   on public.clients (updated_by);

-- ── Activity log ──────────────────────────────────────
create table public.activities (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null default auth.uid(),
  kind        text not null check (kind in ('created', 'status', 'updated', 'note')),
  body        text not null default '',
  from_status public.client_status,
  to_status   public.client_status,
  created_at  timestamptz not null default now()
);

create index activities_client_idx on public.activities (client_id, created_at desc);
create index activities_actor_idx  on public.activities (actor_id);

-- ── Triggers ──────────────────────────────────────────
create function public.clients_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger clients_before_update
  before update on public.clients
  for each row execute function public.clients_before_update();

create function public.clients_log_activity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activities (client_id, actor_id, kind, to_status, created_at)
    values (new.id, coalesce(auth.uid(), new.created_by), 'created', new.status, new.created_at);
  elsif new.status is distinct from old.status then
    insert into public.activities (client_id, actor_id, kind, from_status, to_status)
    values (new.id, coalesce(auth.uid(), new.updated_by), 'status', old.status, new.status);
  elsif (new.name, new.handle, new.channel, new.url, new.contact, new.score, new.weakness, new.notes,
         new.swot_s, new.swot_w, new.swot_o, new.swot_t, new.follow_up_on, new.owner_id)
        is distinct from
        (old.name, old.handle, old.channel, old.url, old.contact, old.score, old.weakness, old.notes,
         old.swot_s, old.swot_w, old.swot_o, old.swot_t, old.follow_up_on, old.owner_id) then
    insert into public.activities (client_id, actor_id, kind)
    values (new.id, coalesce(auth.uid(), new.updated_by), 'updated');
  end if;
  return null;
end;
$$;

create trigger clients_log_activity
  after insert or update on public.clients
  for each row execute function public.clients_log_activity();

-- ── Privileges (RLS below narrows these to active team members) ──
revoke all on public.profiles, public.clients, public.activities from anon, authenticated;
grant select, insert, update, delete on public.clients    to authenticated;
grant select, insert, delete         on public.activities to authenticated;
grant select                         on public.profiles   to authenticated;
grant update (full_name)             on public.profiles   to authenticated;

-- ── Row Level Security ────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.clients    enable row level security;
alter table public.activities enable row level security;

create policy "team reads profiles" on public.profiles
  for select to authenticated using ((select public.is_team_member()));
create policy "members update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and is_active)
  with check (id = (select auth.uid()) and is_active);

create policy "team reads clients" on public.clients
  for select to authenticated using ((select public.is_team_member()));
create policy "team creates clients" on public.clients
  for insert to authenticated with check ((select public.is_team_member()));
create policy "team updates clients" on public.clients
  for update to authenticated
  using ((select public.is_team_member()))
  with check ((select public.is_team_member()));
create policy "team deletes clients" on public.clients
  for delete to authenticated using ((select public.is_team_member()));

create policy "team reads activities" on public.activities
  for select to authenticated using ((select public.is_team_member()));
create policy "team logs activities" on public.activities
  for insert to authenticated
  with check ((select public.is_team_member()) and actor_id = (select auth.uid()));
create policy "authors delete own notes" on public.activities
  for delete to authenticated
  using (kind = 'note' and actor_id = (select auth.uid()));

-- ── Realtime ──────────────────────────────────────────
alter publication supabase_realtime add table public.clients, public.activities;
