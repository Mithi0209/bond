create table if not exists public.diary_state (
  id text primary key,
  data jsonb not null default '{"version":1,"funds":[],"trades":[],"maturities":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.diary_state enable row level security;

drop policy if exists "Public read diary_state" on public.diary_state;
create policy "Public read diary_state"
on public.diary_state
for select
to anon
using (true);

drop policy if exists "Public insert diary_state" on public.diary_state;
create policy "Public insert diary_state"
on public.diary_state
for insert
to anon
with check (true);

drop policy if exists "Public update diary_state" on public.diary_state;
create policy "Public update diary_state"
on public.diary_state
for update
to anon
using (true)
with check (true);

insert into public.diary_state (id)
values ('primary')
on conflict (id) do nothing;

