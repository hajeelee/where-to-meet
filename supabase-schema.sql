create table if not exists public.meeting_sessions (
  session_id text primary key,
  participants jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  recommendation_scope jsonb,
  resolved_points jsonb not null default '[]'::jsonb,
  selected jsonb,
  updated_at timestamptz not null default now()
);

alter table public.meeting_sessions enable row level security;

create policy "Anyone can read meeting sessions"
on public.meeting_sessions
for select
to anon
using (true);

create policy "Anyone can create meeting sessions"
on public.meeting_sessions
for insert
to anon
with check (true);

create policy "Anyone can update meeting sessions"
on public.meeting_sessions
for update
to anon
using (true)
with check (true);

-- Supabase Dashboard에서 Database > Replication 또는 Realtime 설정에서
-- public.meeting_sessions 테이블을 Realtime 대상으로 활성화하세요.
