create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  session_id uuid references public.quiz_sessions(id) on delete set null,
  line_user_id text,
  event_name text not null,
  page text,
  scenario_id text,
  option_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_events_event_name_idx
  on public.user_events(event_name);

create index if not exists user_events_profile_id_idx
  on public.user_events(profile_id);

create index if not exists user_events_session_id_idx
  on public.user_events(session_id);

create index if not exists user_events_occurred_at_idx
  on public.user_events(occurred_at desc);

create index if not exists user_events_line_user_id_idx
  on public.user_events(line_user_id);

alter table public.user_events enable row level security;

revoke all on table public.user_events from anon, authenticated;
grant all on table public.user_events to service_role;

comment on table public.user_events is 'Behavioral funnel events emitted by the Alpha frontend and future LIFF app.';
